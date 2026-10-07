# Modelo de dados — TSE VOTA

A persistência é **híbrida**:

1. **SQLite** — apenas tabelas relacionais de registro (comparecimento de
   mesário e justificativa) + tabelas internas de chave/valor.
2. **Arquivos ASN.1** — a maior parte do estado da urna (BU, RDV, eleição,
   candidatos, eleitores, parâmetros, estado geral) é serializada em arquivos
   codificados em ASN.1 (DER/PER) segundo os módulos `Modulo*`.

## 1. Esquema SQLite

### `registro_justificativa`

| Coluna | Tipo | Restrição |
|---|---|---|
| `numero_titulo` | BIGINT | PRIMARY KEY UNIQUE NOT NULL |
| `ano_nascimento` | SMALLINT | |

### `comparecimento_mesario`

| Coluna | Tipo | Restrição |
|---|---|---|
| `numero_titulo` | BIGINT | NOT NULL |
| `tipo_identificador` | INTEGER | CHECK IN (1,2,3) NOT NULL |
| `periodo_presente` | INTEGER | NOT NULL |
| `pertence_secao` | INTEGER | NOT NULL |
| `estado_biometria` | INTEGER | NOT NULL |
| `dedo_habilitacao` | INTEGER | NOT NULL |
| `data_hora_registro` | DATETIME | NOT NULL |
| `id_arquivo` | INTEGER | |

`UNIQUE (numero_titulo, periodo_presente)`

> Há também queries que projetam colunas de **habilitação do mesário**:
> `titulo, tipo_identificador, identidade_habilitacao, tipo_identidade_habilitacao,
> estado_comparecimento, tipo_habilitacao, dedo_habilitacao, score_habilitacao,
> numero_tentativa, erro_decifrar_biometria, tipo_ativacao_audio,
> estado_apresentacao_foto, resultado_decifracao_foto, titulo_mesario,
> tipo_identificador_mesario`.

## 2. Entidades principais (modelos `md` / `dados`)

| Entidade | Descrição |
|---|---|
| Eleição / `CEleicao` | Dados e turno da eleição |
| Cargo / `CCargo` | Cargos em disputa |
| Candidatura / `CCandidatura` | Candidatos por cargo/partido |
| Eleitor / `CEleitor` | Dados do eleitor (título, seção, biometria) |
| Biometria / `CBiometriaEleitor` | Digitais do eleitor |
| Comparecimento / `CComparecimentoMesario` | Registro de comparecimento |
| Justificativa | Justificativa de ausência |
| BU / `CEntidadeBU` | Boletim de Urna |
| RDV / RDV | Registro Digital do Voto |
| Histórico / `CHistoricoVotoImpresso` | Histórico de voto impresso |

## 3. Codificação e cifração

- **ASN.1** (`namespace asn`): conversores `CConversor*` transformam os tipos
  C++ em estruturas ASN.1 (módulos `Modulo*`) e vice-versa (`CodeObject` /
  `DecodeObject`, `ReadFromFile`).
- **Envelope genérico** (`ModuloEnvelopeGenerico`): empacota entidades com
  metadados (tamanho, hash, assinatura) — base para integridade/autenticidade.
- **Cifração** (`security`): AES para dados de comparecimento
  (`CDadosComparecimentoCifrado`), HKDF para derivação de chave, RSA-PSS para
  assinatura do BU/RDV, SipHash para MAC.
