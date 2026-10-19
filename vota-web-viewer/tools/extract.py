#!/usr/bin/env python3
"""
Extrai dados estruturados do arquivo descompilado (wasm-decompile) e do .wasm
para alimentar a aplicacao web de visualizacao.

Uso:
    python3 tools/extract.py
Gera arquivos JSON em ./data
"""
import os
import re
import json
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
DCMP = os.path.join(PROJ, "vota_web_wasm.dcmp")
WASM = os.path.join(PROJ, "vota_web_wasm.wasm")
DATA = os.path.join(PROJ, "data")

# imports oficiais do runtime Emscripten contam para o offset dos nomes f_
N_IMPORTS = 136

RE_DATA = re.compile(r'^data (d_\S+)\(offset:\s*(\d+)\)\s*=')
RE_FUNC = re.compile(r'^function (f_[a-z]+)\((.*?)\)(?::\s*(\w+))?\s*\{')
RE_CALL = re.compile(r'\b(f_[a-z]+|a_[a-z]+)\s*\(')
RE_QSTR = re.compile(r'"((?:\\.|[^"\\])*)"')

HEX = set("0123456789abcdefABCDEF")


def idx_to_fname(idx: int) -> str:
    n = idx - N_IMPORTS
    if n < 0:
        return "a_import"
    n += 1
    s = ""
    while n > 0:
        n -= 1
        s = chr(ord("a") + n % 26) + s
        n //= 26
    return "f_" + s


def decode_wasm_string(s: str) -> str:
    out = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c == "\\" and i + 1 < n:
            if i + 2 < n and s[i + 1] in HEX and s[i + 2] in HEX:
                out.append(chr(int(s[i + 1:i + 3], 16)))
                i += 3
                continue
            nxt = s[i + 1]
            if nxt == "n":
                out.append("\n")
            elif nxt == "t":
                out.append("\t")
            elif nxt == "r":
                out.append("\r")
            elif nxt in ('"', "\\", "'"):
                out.append(nxt)
            else:
                out.append(nxt)
            i += 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


def read_lines():
    with open(DCMP, "r", encoding="latin-1") as f:
        return f.readlines()


def parse_data(lines):
    entries = []
    i = 0
    n = len(lines)
    while i < n:
        m = RE_DATA.match(lines[i])
        if not m:
            i += 1
            continue
        name, off = m.group(1), int(m.group(2))
        raw = lines[i]
        j = i
        while not raw.rstrip().endswith(";"):
            j += 1
            if j >= n:
                break
            raw += lines[j]
        i = j + 1
        parts = RE_QSTR.findall(raw)
        text = "".join(decode_wasm_string(p) for p in parts)
        strings = [s for s in text.split("\x00") if s]
        entries.append({"name": name, "offset": off, "size": len(text),
                        "strings": strings})
    return entries


def parse_functions(lines):
    funcs = []
    i = 0
    n = len(lines)
    while i < n:
        m = RE_FUNC.match(lines[i])
        if not m:
            i += 1
            continue
        name = m.group(1)
        params = m.group(2).strip()
        ret = m.group(3) or "void"
        start = i
        j = i + 1
        while j < n and lines[j].rstrip("\n") != "}":
            j += 1
        end = j
        body = "".join(lines[start:end + 1])
        calls = sorted({c for c in RE_CALL.findall(body) if c != name})
        params_list = []
        if params:
            for p in params.split(","):
                if ":" in p:
                    nm, tp = p.split(":", 1)
                    params_list.append({"name": nm.strip(), "type": tp.strip()})
        funcs.append({"name": name, "params": params_list, "return": ret,
                      "loc": end - start, "line_start": start + 1,
                      "line_end": end + 1, "callees": calls, "is_export": False})
        i = end + 1
    return funcs


def parse_exports_imports():
    try:
        out = subprocess.run(["wasm-objdump", "-x", WASM],
                             capture_output=True, text=True, check=True).stdout
    except Exception as e:
        print("aviso: wasm-objdump indisponivel:", e, file=sys.stderr)
        return {"imports": [], "exports": []}
    imports, exports = [], []
    sec = None
    for line in out.splitlines():
        if line.startswith("Import["):
            sec = "imp"
            continue
        if line.startswith("Export["):
            sec = "exp"
            continue
        if re.match(r'^[A-Z][a-z]+\[', line):
            sec = None
            continue
        if sec == "exp":
            m = re.match(r'\s*- func\[(\d+)\]\s*<([^>]*)>\s*->\s*"([^"]*)"', line)
            if m:
                idx = int(m.group(1))
                exports.append({"kind": "func", "index": idx,
                                "internal": m.group(2), "export": m.group(3)})
                continue
            m = re.match(r'\s*- (memory|table|global)\[(\d+)\]\s*->\s*"([^"]*)"', line)
            if m:
                exports.append({"kind": m.group(1), "index": int(m.group(2)),
                                "internal": "", "export": m.group(3)})
            continue
        if sec == "imp":
            m = re.match(r'\s*- func\[\d+\] sig=(\d+) <(\S+)>', line)
            if m:
                imports.append({"sig": int(m.group(1)), "name": m.group(2)})
                continue
            m = re.match(r'\s*- (memory|table|global)\[', line)
            if m:
                imports.append({"sig": None, "name": line.strip()})
    return {"imports": imports, "exports": exports}


def extract_rtti(lines):
    text = "".join(lines)
    toks = set()
    for m in re.finditer(r'\b(N[0-9][A-Za-z0-9_]{3,})', text):
        toks.add(m.group(1))
    names = sorted(toks)
    dem = {}
    if names:
        try:
            out = subprocess.run(["c++filt"], input="\n".join(names),
                                 capture_output=True, text=True).stdout.splitlines()
            dem = {a: b for a, b in zip(names, out)}
        except Exception:
            dem = {a: a for a in names}
    return dem


def build_modules(all_strings, rtti):
    ns, cls = {}, {}
    for s in all_strings:
        for m in re.finditer(r'\b([a-z_][A-Za-z0-9_]*)::([A-Za-z_][A-Za-z0-9_]*)(?:::([A-Za-z_][A-Za-z0-9_]*))?', s):
            top = m.group(1)
            ns[top] = ns.get(top, 0) + 1
            name = "::".join(g for g in m.groups() if g)
            cls[name] = cls.get(name, 0) + 1
    for d in rtti.values():
        if "::" in d:
            top = d.split("::")[0]
            ns[top] = ns.get(top, 0) + 1
    modules = [{"name": k, "count": v} for k, v in sorted(ns.items(), key=lambda x: -x[1])]
    classes = [{"name": k, "count": v} for k, v in sorted(cls.items(), key=lambda x: -x[1])]
    return modules, classes


def extract_sql(all_strings):
    sql = [s for s in all_strings
           if re.search(r'\b(CREATE TABLE|CREATE INDEX|CREATE TRIGGER|INSERT INTO|UPDATE |DELETE FROM|SELECT |PRAGMA )', s)]
    schema = {}
    for s in sql:
        m = re.search(r'CREATE TABLE IF NOT EXISTS\s+([a-z_]+)\s*\((.*?)\)\s*$', s, re.S)
        if m:
            schema[m.group(1)] = m.group(2)
    return {"statements": sorted(set(sql)), "schema": schema}


def main():
    os.makedirs(DATA, exist_ok=True)
    print("lendo", DCMP, "...")
    lines = read_lines()
    print("  linhas:", len(lines))

    data_entries = parse_data(lines)
    print("  data segments:", len(data_entries))
    funcs = parse_functions(lines)
    print("  funcoes:", len(funcs))

    all_strings, seen = [], set()
    for e in data_entries:
        for s in e["strings"]:
            if 2 <= len(s) <= 1500 and re.search(r'[\x20-\x7e\xc0-\xff]{3,}', s):
                if s not in seen:
                    seen.add(s)
                    all_strings.append(s)
    print("  strings unicas:", len(all_strings))

    rtti = extract_rtti(lines)
    print("  rtti:", len(rtti))
    imp_exp = parse_exports_imports()
    print("  imports:", len(imp_exp["imports"]), "exports:", len(imp_exp["exports"]))

    modules, classes = build_modules(all_strings, rtti)
    sql = extract_sql(all_strings)

    callers = {}
    for f in funcs:
        for c in f["callees"]:
            callers.setdefault(c, []).append(f["name"])
    for f in funcs:
        f["n_callers"] = len(callers.get(f["name"], []))

    def dump(name, obj):
        p = os.path.join(DATA, name)
        with open(p, "w", encoding="utf-8") as w:
            json.dump(obj, w, ensure_ascii=False, separators=(",", ":"))
        print("  ->", name, f"({os.path.getsize(p)//1024} KB)")

    dump("functions.json", {"functions": [
        {k: f[k] for k in ("name", "params", "return", "loc", "line_start",
                           "line_end", "callees", "n_callers", "is_export")}
        for f in funcs]})
    dump("strings.json", all_strings)
    dump("data_segments.json",
         [{"name": e["name"], "offset": e["offset"], "size": e["size"],
           "strings": e["strings"][:200]} for e in data_entries])
    dump("rtti.json", [{"mangled": k, "name": v} for k, v in sorted(rtti.items())])
    dump("modules.json", {"namespaces": modules, "classes": classes})
    dump("sql.json", sql)
    dump("imports_exports.json", imp_exp)

    stats = {
        "lines": len(lines),
        "data_segments": len(data_entries),
        "functions": len(funcs),
        "strings": len(all_strings),
        "rtti": len(rtti),
        "imports": len(imp_exp["imports"]),
        "exports": len(imp_exp["exports"]),
        "namespaces": len(modules),
        "classes": len(classes),
        "sql_statements": len(sql["statements"]),
    }
    dump("stats.json", stats)
    print("OK")


if __name__ == "__main__":
    main()
