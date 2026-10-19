# Descompilação do `vota_web_wasm.wasm`

## O que foi gerado

| Arquivo | Descrição | Tamanho |
|---|---|---|
| `vota_web_wasm.dcmp` | Pseudocódigo estilo C (`wasm-decompile`) | ~24 MB, ~906 mil linhas |

Saída gerada com: `wasm-decompile vota_web_wasm.wasm -o vota_web_wasm.dcmp`

Observação: o binário é **minificado** (Emscripten) e **não tem seção de nomes**,
então as funções aparecem com nomes sintéticos (`f_a`, `f_b`, ...). Os nomes
originais não são recuperáveis. Strings em português (SQL/UI) estão visíveis na
seção de dados e ajudam a identificar a lógica (ex.: `CLeitorASN`, `biometria`,
`mesário`, `urna`, `QRBU`).

## Ferramentas instaladas via Homebrew

```
brew install wabt binaryen
```

| Pacote | Versão | Motivo |
|---|---|---|
| `wabt` | 1.0.42_1 | `wasm2wat`, `wasm2c`, `wasm-objdump` etc. |
| `binaryen` | 133 | `wasm-opt`, `wasm2js` etc. |
| `ca-certificates` | 2026-09-25 | dependência do `wabt` (instalada automaticamente) |
| `openssl@4` | 4.0.3 | dependência do `wabt` (instalada automaticamente) |

## Como desinstalar tudo

```sh
# 1. Remover os pacotes instalados
brew uninstall wabt binaryen

# 2. Remover dependências que sobrarem (ca-certificates, openssl@4)
brew autoremove
```

Confirmação: `ca-certificates` e `openssl@4` foram instalados apenas por causa do
`wabt` (verificado com `brew uses --installed`), então o `brew autoremove` os
remove se não forem mais necessários.

## `wasm-decompile` (nota)

A ferramenta `wasm-decompile` foi **removida do WABT a partir da v1.0.34**. Para
a descompilação foi baixado o binário pré-compilado da **v1.0.33**:

```
https://github.com/WebAssembly/wabt/releases/download/1.0.33/wabt-1.0.33-macos-12.tar.gz
```

Extraído em um diretório temporário do sistema (`/var/folders/.../T/opencode`),
fora do repositório — nada permanente foi instalado além do Homebrew acima.
Para refazer a descompilação, basta baixar esse tarball novamente e usar
`wabt-1.0.33/bin/wasm-decompile`.

## Remover os artefatos gerados

```sh
rm vota_web_wasm.dcmp DESCOMPILACAO_NOTAS.md
```

## Visualizador web

Há um projeto web local para explorar a descompilação (arquitetura, módulos,
funções, strings, SQL, fluxo de votação) em `vota-web-viewer/`:

```sh
cd vota-web-viewer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 server.py        # http://127.0.0.1:8099
```

O backend usa Flask. Veja `vota-web-viewer/README.md`.
