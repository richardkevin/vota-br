# AGENTS.md

Research repo on the TSE (Brazilian) voting machine: reverse-engineering of the
`vota_web_wasm` build + a tool to download/verify official Boletins de Urna.
Two **independent** projects at the root — no root manifest, no CI, no tests.

## Layout & entrypoints
- `vota-web-viewer/` — local web viewer for the RE. Pure **stdlib** Python HTTP
  server + **vanilla JS** frontend (no npm / no build step).
- `boletim-urna/` — Python CLI (managed by **uv**) that downloads and SHA-512-verifies
  the TSE Boletim de Urna (BU) open data.
- `vota_web_wasm.wasm` (~7.4 MB) and `vota_web_wasm.dcmp` (~24 MB) — the analyzed
  artifact. Large, committed binaries: do not regenerate casually.

## Path gotcha (verify before running)
`vota-web-viewer/server.py` and `tools/extract.py` locate the binary as
`<repo-root>/vota_web_wasm.*` (they compute `REPO = dirname(vota-web-viewer)`),
**not** inside `vota-web-viewer/`. Keep the `.wasm`/`.dcmp` at the repo root.
If they are missing there, `python3 server.py` dies at startup with a
`FileNotFoundError` on the `.dcmp` (the working tree currently also has untracked
copies inside `vota-web-viewer/`).

## vota-web-viewer
- Run: `cd vota-web-viewer && python3 server.py [port]` (default `8099`) — stdlib only.
- Regenerate data only if the `.dcmp` changes: `python3 tools/extract.py` (requires
  `wasm-objdump` and `c++filt` on PATH), then `python3 tools/analyze.py`.
  `data/*.json` are committed, so the viewer runs **without** regenerating.
- The `.dcmp` was produced by `wasm-decompile` from **WABT 1.0.33**; that tool was
  **removed in WABT >= 1.0.34** (see `vota-web-viewer/DESCOMPILACAO_NOTAS.md`).
- The wasm has **no name section**: functions are synthetic (`f_a`, `f_ge`, ...).
  Export <-> `f_*` and function <-> string mappings are **unreliable** — do not
  assert them. Real class names come from `__FILE__` path strings,
  `Namespace::Classe::metodo()` log strings, and RTTI demangled with `c++filt`.
- Keep the frontend vanilla JS (`web/app.js`, `diagrams.js`, `sim.js`); no Node here.

## boletim-urna
- Uses **uv** (Python 3.12). From `boletim-urna/`: `make sync` (= `uv sync`), then
  `make list` / `make download` / `make descarga` / `make verify`.
- Entry point: `boletim-urna = "boletim_urna.baixar:main"` (src layout `src/boletim_urna`).
- `make download` = **1st turn only**; `make descarga` = both turns. Downloads are
  huge (~5 GB per turn). Only stdlib; `data/` and `state/` are gitignored.
- Lint/format config lives in `pyproject.toml` (ruff, line-length 100).

## Docs (read these; don't duplicate)
- Under `vota-web-viewer/`: `README.md`, `DESCOMPILACAO_NOTAS.md`, `ARQUITETURA.md`,
  `MODULOS.md`, `DADOS.md`, `FLUXO_VOTACAO.md`, `BIBLIOTECAS.md`, `EXPORTS_IMPORTS.md`.
- `boletim-urna/README.md` (dataset id, asset URL patterns, disk-space warning).
