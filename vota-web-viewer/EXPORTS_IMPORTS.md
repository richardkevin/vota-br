# Exports / Imports — `vota_web_wasm.wasm`

Dados de `wasm-objdump -x` (WABT). Nomes minificados pelo Emscripten.

## 1. Exportações (23)

| Export | Tipo | Índice | Nota |
|---|---|---|---|
| `Cb` | memory | 0 | memória linear (414 págs. inicial, máx. 32768) |
| `Fb` | table | 0 | tabela `funcref` (12.855 slots) |
| `Db` | func | 14478 | entrada principal (recebe ponteiro de contexto) |
| `Eb` | func | 7840 | — |
| `Gb` | func | 10703 | — |
| `Hb` | func | 10619 | — |
| `Ib` | func | 10240 | — |
| `Jb` | func | 10171 | — |
| `Kb` | func | 10307 | — |
| `Lb` | func | 9614 | — |
| `Mb` | func | 9604 | — |
| `Nb` | func | 6176 | — |
| `Ob` | func | 12144 | — |
| `Pb` | func | 6263 | — |
| `Qb` | func | 6263 | mesmo índice que `Pb` (alias) |
| `Rb` | func | 6227 | — |
| `Sb` | func | 12275 | — |
| `Tb` | func | 12274 | — |
| `Ub` | func | 12122 | — |
| `Vb` | func | 12119 | — |
| `Wb` | func | 12118 | — |
| `Xb` | func | 12128 | — |
| `Yb` | func | 12127 | — |

As funções exportadas incluem o runtime Emscripten (`malloc`/`free`) e os
entry points do aplicativo, todos renomeados.

## 2. Importações (136)

Todos vêm do **módulo host `a`** (glue JS do Emscripten), campos `a` … `Bb`.
Assinaturas variadas (de `() -> i32` até funções com 8+ parâmetros e retornos
`i64`/`f64`). São as primitivas de ambiente: gerenciamento de memória, IO,
`abort`, emulação de `syscall` e de `pthread`.

## 3. Demais seções

| Seção | Valor |
|---|---|
| Type | 155 assinaturas |
| Function | 14.343 funções definidas |
| Global | 2 (`g_a` = stack/heap pointer 10.326.000, `g_b` = 0) |
| Element | 12.854 entradas de tabela (vtable/virtual) |
| Data | 4.224 segmentos |
| DataCount | 4.224 |
