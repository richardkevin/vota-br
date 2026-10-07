# TSE VOTA — Visualizador de Arquitetura

Aplicação web local (sem dependências) para **entender** o binário
`vota_web_wasm.wasm` do TSE VOTA (urna eletrônica): relatório de domínio,
infográficos, simuladores interativos e explorador de funções.

O foco é **votação, apuração, resultado e o papel do mesário**.

## Como executar

```sh
cd vota-web-viewer
python3 server.py            # http://127.0.0.1:8099
```

Abra **http://127.0.0.1:8099**. Só requer Python 3.8+ (biblioteca padrão).

## Como o binário foi tornado compreensível

O módulo é um build **Emscripten/C++ minificado**, sem seção de nomes. Sem
isso, os nomes de função (`f_*`) são ilegíveis. A estrutura foi recuperada de:

1. **Caminhos `__FILE__`** nas strings de log/assert → **árvore de fontes real**
   (400 arquivos: `src/api`, `src/app/{vota,comum,operador}`, `src/ecourna`).
2. **Mensagens `Namespace::Classe::metodo()`** → nomes de classe e de método.
3. **Typeinfo C++ (RTTI)** demangled com `c++filt` → tipos reais.
4. **Enums/estados** e **esquema SQL**.

## Abas

| Aba | Conteúdo |
|---|---|
| **Relatório** | Síntese de domínio: sistema, poder do mesário, votação, apuração, resultado — com infográficos |
| **Árvore de fontes** | Estrutura real do projeto (interativa, filtrável) |
| **Fluxo de votação** | Máquina de estados `app/vota` + infográfico |
| **Apuração & Resultado** | RDV → BU → hash/assinatura → CV → MR |
| **Poder do mesário** | Registro de mesários, habilitação, justificativa, vias/MR |
| **Simuladores** | Votação · Apuração/BU · Sessão do mesário (interativos) |
| **Visão geral técnica** | Estatísticas e camadas |
| **Explorador de funções** | Grafo de chamadas navegável (clique para focar) |
| **Strings / Dados & SQL / Bibliotecas / Imports-Exports** | Detalhamento técnico |

## Infográficos e simuladores

- Infográficos em **SVG** (`web/diagrams.js`): camadas, ciclo do mesário,
  habilitação do eleitor, sessão de votação, pipeline de apuração, dados, estados.
- Simuladores em `web/sim.js`:
  - **Votação** — teclado, branco/corrige/confirma, cargos majoritário/proporcional.
  - **Apuração & BU** — soma de votos, código verificador (ilustrativo), BU assinado.
  - **Mesário** — registrar mesários (limite), habilitar eleitor (biometria/justificar/suspender), justificativa.

> Os simuladores usam dados de exemplo e um CV **ilustrativo** (não é o algoritmo
> oficial do TSE); servem para explicar o fluxo, não para reproduzir valores.

## Estrutura

```
vota-web-viewer/
├── server.py            # servidor HTTP (stdlib) + API JSON
├── tools/extract.py     # parser do .dcmp -> data/*.json
├── tools/analyze.py     # árvore de fontes + agrupamento por domínio
├── data/                # dados gerados (JSON)
├── web/                 # index.html · styles.css · app.js · diagrams.js · sim.js
└── README.md
```

## Regenerar os dados

```sh
python3 tools/extract.py     # a partir de ../vota_web_wasm.dcmp
python3 tools/analyze.py     # árvore de fontes + domínio
```

Requer `wasm-objdump` (WABT) e `c++filt` no PATH para `extract.py`.

## Nota sobre tecnologia do frontend

Optei por **JavaScript puro** (sem build/npm, funciona offline), organizado em
"views" e componentes (`diagrams.js`, `sim.js`). Migrar para **React** é
possível, mas exigiria Node/`npm` e um passo de build — indisponíveis no
ambiente atual. A arquitetura já está componentizada para facilitar essa troca.
