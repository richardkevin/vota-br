#!/usr/bin/env python3
"""
Servidor web Flask para visualizacao da engenharia reversa do TSE VOTA.
Serve o frontend em ./public e uma API JSON em /api.

Uso local:
    pip install -r requirements.txt
    python3 server.py [porta]
"""
import json
import os
import sys

from flask import Flask, jsonify, request, send_from_directory

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
PUBLIC = os.path.join(HERE, "public")
DCMP = os.path.join(HERE, "vota_web_wasm.dcmp")

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


def paginate(items, args):
    term = args.get("q", "").lower()
    page = args.get("page", 1, type=int)
    size = min(args.get("size", 100, type=int), 1000)
    arr = items
    if term:
        arr = [s for s in arr if term in s.lower()]
    total = len(arr)
    start = (page - 1) * size
    return {"total": total, "page": page, "size": size,
            "items": arr[start:start + size]}


def functions_payload(args):
    term = args.get("q", "").lower()
    page = args.get("page", 1, type=int)
    size = min(args.get("size", 50, type=int), 500)
    sort = args.get("sort", "name")
    filt = args.get("filter", "")
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
    page_items = [{k: f[k] for k in ("name", "return", "loc", "n_callers", "is_export")}
                  for f in arr[start:start + size]]
    for it, f in zip(page_items, arr[start:start + size]):
        it["n_callees"] = len(f["callees"])
    return {"total": total, "page": page, "size": size,
            "items": page_items}


def function_detail_payload(name):
    f = STATE["by_name"].get(name)
    if not f:
        return None
    lines = STATE["lines"]
    body = "".join(lines[f["line_start"] - 1:f["line_end"]])
    return {
        "name": f["name"], "params": f["params"], "return": f["return"],
        "loc": f["loc"], "is_export": f["is_export"],
        "callees": f["callees"], "callers": STATE["callers"].get(name, []),
        "body": body,
    }


def graph_payload(name, depth):
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
    return {"nodes": list(nodes.values()), "edges": uniq, "root": name}


app = Flask(__name__, static_folder=None)
app.json.ensure_ascii = False

init()


@app.after_request
def api_headers(resp):
    if request.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


@app.get("/api/stats")
def api_stats():
    return jsonify(STATE["stats"])


@app.get("/api/modules")
def api_modules():
    return jsonify(STATE["modules"])


@app.get("/api/source_tree")
def api_source_tree():
    return jsonify(STATE.get("source_tree", {}))


@app.get("/api/domain")
def api_domain():
    return jsonify(STATE.get("domain", {}))


@app.get("/api/rtti")
def api_rtti():
    term = request.args.get("q", "").lower()
    items = STATE["rtti"]
    if term:
        items = [r for r in items if term in r["name"].lower()
                 or term in r["mangled"].lower()]
    return jsonify(items)


@app.get("/api/sql")
def api_sql():
    return jsonify(STATE["sql"])


@app.get("/api/imports_exports")
def api_imports_exports():
    return jsonify(STATE["imp_exp"])


@app.get("/api/strings")
def api_strings():
    return jsonify(paginate(STATE["strings"], request.args))


@app.get("/api/data_segments")
def api_data_segments():
    term = request.args.get("q", "").lower()
    items = STATE["data_segments"]
    if term:
        items = [d for d in items if term in d["name"].lower()
                 or any(term in s.lower() for s in d["strings"])]
    return jsonify({"total": len(items), "items": items[:500]})


@app.get("/api/functions")
def api_functions():
    return jsonify(functions_payload(request.args))


@app.get("/api/function/<name>")
def api_function(name):
    data = function_detail_payload(name)
    if data is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(data)


@app.get("/api/graph/<name>")
def api_graph(name):
    depth = request.args.get("depth", 2, type=int)
    return jsonify(graph_payload(name, depth))


@app.get("/api/<path:path>")
def api_unknown(path):
    return jsonify({"error": "unknown endpoint"}), 404


@app.get("/")
def index():
    return send_from_directory(PUBLIC, "index.html")


@app.get("/<path:path>")
def assets(path):
    return send_from_directory(PUBLIC, path)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
    print("=" * 60)
    print("TSE VOTA — Visualizador  http://127.0.0.1:%d" % port)
    print("=" * 60)
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
