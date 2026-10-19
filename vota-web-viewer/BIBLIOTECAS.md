# Bibliotecas embutidas — TSE VOTA

Identificadas por assinaturas e strings no código descompilado.

## 1. SQLite

- Uso: `sql::sqlite::CSqlConnection` / `CSqlStatement`.
- Tabelas internas visíveis: `sqlite_master`, `sqlite_sequence`,
  `sqlite_schema`, `sqlite_stat1`; SQL completo de DDL/DML (`CREATE TABLE`,
  `INSERT`, `SELECT`, triggers, `ATTACH`, `PRAGMA quick_check`).
- Índices/triggers e mecanismos de `sqlite_rename_table`/`sqlite_rename_column`
  indicam SQLite completo (não um stub).

## 2. OpenSSL (criptografia)

- Símbolos: `EVP_*`, `d2i_ASN1_OBJECT`, `ossl_c2i_ASN1_OBJECT`, `X509
  CERTIFICATE`, `TRUSTED CERTIFICATE`, `PEM`, `DER`.
- Algoritmos: **RSA-PSS** (strings de erro "Hash Algorithm", "Mask Algorithm",
  "Minimum Salt Length"), **SHA** (`CSha`, `CHashArquivo`), **AES** (`CAesCipher`).
- Papel no domínio: assinatura do BU/RDV, cifração de dados de comparecimento,
  carregamento de chaves (`CKeyLoader`, `LeChavePublica`).

## 3. Boost (C++)

- `boost::regex` / `boost::match_results` — expressões regulares.
- `boost::posix_time::ptime` — data/hora.
- `boost::filesystem::path` — caminhos.
- `boost::function` — callbacks.

## 4. Compressão

- `compression::CZip` (zip), `compression::CLzmaCompress` (LZMA/7z).
- Uso: empacotamento/compactação de pacotes de mídia e arquivos de resultado.

## 5. Outros

- **Engine de regex** além do Boost (strings de erro de parsing de regex).
- **QR code**: `QRBU` — QRCode do Boletim de Urna.
- **pthreads**: emuladas via Emscripten (threads de monitoramento/eleitor/operador).
- **Emscripten runtime**: `CWasmThread`, `CWasmTimerScheduler` (`simulador`),
  imports `a.*` (memória/IO/syscalls).

## 6. Tabela resumo

| Biblioteca | Namespace/classe | Função no app |
|---|---|---|
| SQLite | `sql::sqlite` | Persistência relacional |
| OpenSSL | `security` | RSA-PSS, AES, SHA, X509/ASN.1 DER |
| Boost | `std`-like, `boost::` | regex, tempo, filesystem |
| zlib/LZMA | `compression` | Compactação de pacotes |
| QR | `CMostraQRCodeBU` | QR do BU |
| pthreads (emul.) | `CThread*` | Threads de monitoramento |
