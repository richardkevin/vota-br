#!/usr/bin/env python3
"""
Analise semantica orientada a dominio do TSE VOTA.
Le data/strings.json e o .dcmp e gera:
  - source_tree.json   : arvore de fontes real (a partir das strings __FILE__)
  - domain.json        : grupos de strings e classes por dominio
Uso: python3 tools/analyze.py
"""
import os
import re
import json
from collections import defaultdict, OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
DATA = os.path.join(PROJ, "data")

SRC = json.load(open(os.path.join(DATA, "strings.json"), encoding="utf-8"))
MODULES = json.load(open(os.path.join(DATA, "modules.json"), encoding="utf-8"))


def extract_files(strings):
    files, third = {}, {}
    for s in strings:
        for m in re.finditer(r'/[\w./\-]*?/src/([\w./\-]+\.(?:cpp|h|hpp|c))\b', s):
            rel = m.group(1)
            if rel.startswith(("app/", "api/", "ecourna/", "comum/")):
                files[rel] = True
            else:
                third[rel] = True
    return sorted(files), sorted(third)


def class_from_file(fn):
    base = os.path.basename(fn).rsplit(".", 1)[0]
    parts = base.split("_")
    name = "".join(p.capitalize() for p in parts)
    return name


def build_tree(files):
    root = {"name": "src", "path": "src", "type": "dir", "children": OrderedDict()}
    for f in files:
        parts = f.split("/")
        node = root
        cur = "src"
        for i, p in enumerate(parts):
            cur = cur + "/" + p
            is_file = (i == len(parts) - 1)
            if p not in node["children"]:
                node["children"][p] = {
                    "name": p, "path": cur,
                    "type": "file" if is_file else "dir",
                    "children": OrderedDict() if not is_file else None}
            node = node["children"][p]

    def finalize(n):
        if n["children"] is None:
            n["class"] = class_from_file(n["path"])
            return n
        n["children"] = [finalize(c) for c in sorted(n["children"].values(),
                                                     key=lambda x: (x["type"] != "dir", x["name"]))]
        return n
    return finalize(root)


DOMAINS = {
    "mesario": {
        "titulo": "Mesário / Habilitação",
        "kw": ["mesario", "mesário", "habilitacao", "habilitação", "registrarmesarios",
               "operador", "batimento", "reconhecimento", "definirsenha", "senha"],
    },
    "votacao": {
        "titulo": "Votação",
        "kw": ["votando", "iniciovotacao", "fimvotacao", "votaproporcional", "votamajoritario",
               "cedula", "cédula", "legenda", "nulo", "branco", "digit", "confirma voto",
               "escolha", "candidato", "cargo", "teclado", "biometrica"],
    },
    "apuracao": {
        "titulo": "Apuração / BU",
        "kw": ["bu", "boletim", "zeresima", "zerésima", "rdv", "apura", "hash", "assinatura",
               "código verificador", "codigo verificador", "cv", "totaliza", "gerab"],
    },
    "resultado": {
        "titulo": "Resultado",
        "kw": ["resultado", "totalização", "totalizacao", "votos", "eleito", "comparecimento",
               "abstenção", "abstencao", "prestação", "prestacao", "relatorio", "relatório"],
    },
    "justificativa": {
        "titulo": "Justificativa / Voto em Trânsito",
        "kw": ["justificativ", "justificar", "transito", "trânsito", "ausência", "ausencia"],
    },
}


def group_strings(strings):
    out = {}
    for key, d in DOMAINS.items():
        seen = []
        for s in strings:
            lo = s.lower()
            if any(k in lo for k in d["kw"]):
                if len(s) >= 4:
                    seen.append(s)
        out[key] = seen[:500]
    return out


def relevant_classes():
    classes = [c["name"] for c in MODULES["classes"]]
    out = defaultdict(list)
    for c in classes:
        lo = c.lower()
        for key, d in DOMAINS.items():
            for k in d["kw"]:
                if k.replace(" ", "") in lo.replace(" ", ""):
                    out[key].append(c)
                    break
    return {k: sorted(set(v)) for k, v in out.items()}


def main():
    files, third = extract_files(SRC)
    print("arquivos:", len(files), "| 3rd-party:", len(third), third[:6])
    tree = build_tree(files)
    with open(os.path.join(DATA, "source_tree.json"), "w", encoding="utf-8") as w:
        json.dump(tree, w, ensure_ascii=False, separators=(",", ":"))
    print("-> source_tree.json")

    domain = {
        "files": files,
        "third_party": third,
        "strings": group_strings(SRC),
        "classes": relevant_classes(),
        "counts": {k: len(v) for k, v in group_strings(SRC).items()},
    }
    with open(os.path.join(DATA, "domain.json"), "w", encoding="utf-8") as w:
        json.dump(domain, w, ensure_ascii=False, separators=(",", ":"))
    print("-> domain.json", domain["counts"])


if __name__ == "__main__":
    main()
