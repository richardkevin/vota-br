#!/usr/bin/env python3
"""
Servidor web (somente stdlib) para visualizacao da engenharia reversa do
TSE VOTA. Serve o frontend em ./web e uma API JSON em /api.

Uso:
    python3 server.py [porta]
"""
import os
import re
import json
import sys
import functools
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
WEB = os.path.join(HERE, "web")
REPO = os.path.dirname(HERE)
DCMP = os.path.join(REPO, "vota_web_wasm.dcmp")

STATE = {}


def load_json(name):
    with open(os.path.join(DATA, name), "r", encoding="utf-8") as f:
        return json.load(f)


def init():
    print("carregando dados...")
    STATE["stats"] = load_json("stats.json")
    STATE["modules"] = load_json("modules.json")
    for extra in ("source_tree", "domain"):
        try:
            STATE[extra] = load_json(extra + ".json")
        except Exception:
            STATE[extra] = {}
    STATE["strings"] = load_json("strings.json")
    STATE["rtti"] = load_json("rtti.json")
    STATE["sql"] = load_json("sql.json")
    STATE["imp_exp"] = load_json("imports_exports.json")
    STATE["data_segments"] = load_json("data_segments.json")
    fns = load_json("functions.json")["functions"]
    STATE["functions"] = fns
    STATE["by_name"] = {f["name"]: f for f in fns}
    callers = {}
    for f in fns:
        for c in f["callees"]:
            callers.setdefault(c, []).append(f["name"])
    STATE["callers"] = callers
    print("abrindo fonte descompilado...")
    with open(DCMP, "r", encoding="latin-1") as fh:
        STATE["lines"] = fh.readlines()
    print("pronto. funcoes=%d strings=%d" % (len(fns), len(STATE["strings"])))


def json_resp(handler, obj, code=200):
    body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_GET(self):
        u = urlparse(self.path)
        path = u.path
        q = parse_qs(u.query)
        try:
            if path.startswith("/api/"):
                return self.api(path, q)
            return self.static(path)
        except BrokenPipeError:
            pass
        except Exception as e:
            json_resp(self, {"error": str(e)}, 500)

    # ---------- static ----------
    def static(self, path):
        if path == "/" or path == "":
            path = "/index.html"
        safe = os.path.normpath(path.lstrip("/"))
        full = os.path.join(WEB, safe)
        if not full.startswith(WEB) or not os.path.isfile(full):
            self.send_error(404, "not found")
            return
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
        }.get(os.path.splitext(full)[1], "application/octet-stream")
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ---------- api ----------
    def api(self, path, q):
        if path == "/api/stats":
            return json_resp(self, STATE["stats"])
        if path == "/api/modules":
            return json_resp(self, STATE["modules"])
        if path == "/api/source_tree":
            return json_resp(self, STATE.get("source_tree", {}))
        if path == "/api/domain":
            return json_resp(self, STATE.get("domain", {}))
        if path == "/api/rtti":
            term = (q.get("q", [""])[0]).lower()
            items = STATE["rtti"]
            if term:
                items = [r for r in items if term in r["name"].lower() or term in r["mangled"].lower()]
            return json_resp(self, items)
        if path == "/api/sql":
            return json_resp(self, STATE["sql"])
        if path == "/api/imports_exports":
            return json_resp(self, STATE["imp_exp"])
        if path == "/api/strings":
            return self.paginate(STATE["strings"], q, string_mode=True)
        if path == "/api/data_segments":
            term = (q.get("q", [""])[0]).lower()
            items = STATE["data_segments"]
            if term:
                items = [d for d in items if term in d["name"].lower()
                         or any(term in s.lower() for s in d["strings"])]
            return json_resp(self, {"total": len(items), "items": items[:500]})
        if path == "/api/functions":
            return self.functions(q)
        if path.startswith("/api/function/"):
            name = path[len("/api/function/"):]
            return self.function_detail(name)
        if path.startswith("/api/graph/"):
            name = path[len("/api/graph/"):]
            return self.graph(name, int(q.get("depth", ["2"])[0]))
        return json_resp(self, {"error": "unknown endpoint"}, 404)

    def paginate(self, items, q, string_mode=False):
        term = (q.get("q", [""])[0]).lower()
        page = int(q.get("page", ["1"])[0])
        size = min(int(q.get("size", ["100"])[0]), 1000)
        arr = items
        if term:
            arr = [s for s in arr if term in s.lower()]
        total = len(arr)
        start = (page - 1) * size
        return json_resp(self, {"total": total, "page": page, "size": size,
                                "items": arr[start:start + size]})

    def functions(self, q):
        term = (q.get("q", [""])[0]).lower()
        page = int(q.get("page", ["1"])[0])
        size = min(int(q.get("size", ["50"])[0]), 500)
        sort = q.get("sort", ["name"])[0]
        filt = q.get("filter", [""])[0]
        arr = STATE["functions"]
        if filt == "export":
            arr = [f for f in arr if f["is_export"]]
        elif filt == "large":
            arr = [f for f in arr if f["loc"] >= 100]
        elif filt == "leaf":
            arr = [f for f in arr if not f["callees"]]
        if term:
            arr = [f for f in arr if term in f["name"].lower()]
        keymap = {
            "name": lambda f: f["name"],
            "loc": lambda f: -f["loc"],
            "callers": lambda f: -f["n_callers"],
            "callees": lambda f: -len(f["callees"]),
        }
        arr = sorted(arr, key=keymap.get(sort, keymap["name"]))
        total = len(arr)
        start = (page - 1) * size
        page_items = [{k: f[k] for k in ("name", "return", "loc", "n_callers", "is_export")} for f in arr[start:start + size]]
        for it, f in zip(page_items, arr[start:start + size]):
            it["n_callees"] = len(f["callees"])
        return json_resp(self, {"total": total, "page": page, "size": size,
                                "items": page_items})

    def function_detail(self, name):
        f = STATE["by_name"].get(name)
        if not f:
            return json_resp(self, {"error": "not found"}, 404)
        lines = STATE["lines"]
        body = "".join(lines[f["line_start"] - 1:f["line_end"]])
        return json_resp(self, {
            "name": f["name"], "params": f["params"], "return": f["return"],
            "loc": f["loc"], "is_export": f["is_export"],
            "callees": f["callees"], "callers": STATE["callers"].get(name, []),
            "body": body,
        })

    def graph(self, name, depth):
        depth = max(1, min(depth, 3))
        nodes, edges = {}, []
        seen = set()

        def walk(n, d):
            key = (n, d)
            if key in seen or d < 0:
                return
            seen.add(key)
            f = STATE["by_name"].get(n)
            if not f:
                return
            nodes[n] = {"name": n, "loc": f["loc"], "is_export": f["is_export"]}
            for c in f["callees"]:
                edges.append([n, c])
                walk(c, d - 1)
            for c in STATE["callers"].get(n, [])[:30]:
                edges.append([c, n])
                walk(c, d - 1)
        walk(name, depth)
        uniq = []
        s = set()
        for e in edges:
            t = tuple(e)
            if t not in s:
                s.add(t)
                uniq.append(e)
        return json_resp(self, {"nodes": list(nodes.values()), "edges": uniq,
                                "root": name})


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
    init()
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("=" * 60)
    print("TSE VOTA — Visualizador  http://127.0.0.1:%d" % port)
    print("=" * 60)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nencerrando.")


if __name__ == "__main__":
    main()
