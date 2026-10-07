# Módulos e componentes — TSE VOTA

Catálogo de componentes recuperados das strings de log/assert (assinaturas
`Namespace::Classe::metodo()`). Os nomes são confiáveis; a descrição de cada um
é inferida do contexto/uso.

## 1. Namespace `comum` (base / utilitários do negócio)

| Classe | Papel |
|---|---|
| `CAppState` / `CAppStateContext` | Estado global da aplicação e contexto |
| `CAssinador` | Assinatura digital de artefatos (BU/RDV) |
| `CGeradorBU` / `CGeradorBUBase` | Geração do Boletim de Urna |
| `CCalculaCV` | Cálculo do Código Verificador (CV) |
| `CGeradorTeclas` | Geração de chaves criptográficas |
| `CEleitores` | Manipulação da base de eleitores |
| `CCargos` | Cargos em disputa (agrupados por eleição) |
| `CCandidaturas` | Candidaturas / chapas |
| `CConfiguracaoEleicao` | Configuração da eleição |
| `CLogComum` | Logging |
| `CPath` | Manipulação de caminhos/arquivos |
| `CPacoteArquivos` | Empacotamento/validação de arquivos |
| `CArquivosResultado` / `CArquivosSavd` | Arquivos de resultado / SAVD |
| `CControlaArmazenamentoDeImagens` | Controle de armazenamento de fotos |
| `CDAO*` / `dao` | Camada de acesso a dados (DAO) |

## 2. Namespace `api` (framework)

| Classe | Papel |
|---|---|
| `CApplication` | Ciclo de vida da aplicação |
| `CForm` / `CFormBuilder` | Formulários e construção de telas |
| `CInputField`, `CTextField`, `CInputMenuField` | Campos de entrada |
| `CFile` / `CFileASN` | Arquivos (plain e com envelope ASN.1) |
| `CEncryptedFile` | Arquivo cifrado |
| `CDirReader` | Leitura de diretórios |
| `CDataMap` | Mapa de dados genérico |
| `CDate` / `CDateTime` | Data/hora |
| `CThread` / `IThreadImpl` | Threads |
| `ITimerScheduler` | Agendamento por tempo |
| `IImpressora` | Abstração de impressora |
| `IFingerPrepare` | Preparo do leitor biométrico |
| `IScreen` / `IScreenMT` | Abstração de tela |
| `IGenericFactory`, `CPolySingleton` | Fábricas / singletons polimórficos |
| `IInterfaceInit` / `IInterfaceSavd` | Interfaces de inicialização / SAVD |
| `ISemaphore` / `IRWSyncCtl` / `ISyncCtl` | Sincronização |

## 3. Namespace `ecourna` (aplicação da urna)

- `ecourna::app` — dados e estados do app.
- `ecourna::api` — subcamadas de infra: `asn`, `security`, `sql::sqlite`, `io::CFile`.

## 4. Namespace `vota` (máquina de estados / fluxo de votação)

| Classe | Papel |
|---|---|
| `CTelasVota` | Conjunto de telas do fluxo de votação |
| `CEleitorVotando` | Estado "eleitor votando" |
| `CAguardaEleitoresVotarem` | Espera de eleitores |
| `CConfirmaVotoEmCargo` / `CConfirmaVotoSemCandidato` | Confirmação de voto |
| `CCompletaProporcional` | Voto em legenda/partido |
| `CDigitalNaoReconhecida` | Tratamento de digital não reconhecida |
| `CControlaReconhecimento` | Reconhecimento biométrico |
| `CGeraBU` / `CImprimindoBU` | Geração/impressão do BU |
| `CImprimindoZeresima` / `CImprimindoBEHB` | Zeresima / relatórios |
| `CGravaResultado` | Gravação do resultado |
| `CGeraDadosDinamicos` / `CGeraRelatorios` | Relatórios dinâmicos |
| `CEncerramentoHorarioInvalido` | Encerramento fora de horário |
| `CThreadMonitor` | Thread de monitoramento (alimentação, fone) |
| `CVotacaoStateAudio` | Áudio dos estados de votação |

## 5. Namespace `dados` (DTOs do domínio)

`CDadosComparecimento`, `CDadosComparecimentoCifrado`, `CHabilitacaoBiometrica`,
`CApresentacaoFotoEleitor`, `CConfiguracaoMunicipio(s)`, `CFederacao(s)`,
`CDadosGeracaoMidia`, `CDadosCifracao`, `CRegistroIdentificacaoEleitor`,
`CIdentificacaoJustificativa`, `CLabelParametrizado`.

## 6. Namespace `asn` (conversores ASN.1 TSE)

`IConversorASN` (interface) e implementações `CConversor*`:
`CConversorEntidadeBU`, `CConversorEstadoGeralVota`, `CConversorParametrosUrna`,
`CConversorCargo`, `CConversorUrna`, `CConversorFase`, `CConversorBiometriaEleitorCifrada`,
`CConversorEnvelopeGenerico`, `CConversorResultadoUrnaCadastro`,
`CConversorEstadoComparecimento`, `CConversorEstadoHabilitacaoPorCodigo`,
`CConversorTipoApuracaoSA`, `CConversorLabelParametrizado`,
`CConversorDadoCarga`, `CConversorOrigemConfiguracao`, `CConversorAbrangencia`,
`CConversorApresentacaoFotoEleitor`, `CConversorInformacaoMidia`.

## 7. Namespace `md` (modelos de dados)

`CEleicao`, `CEleicaoDataHora`, `CCargo`, `CCandidatura`, `CDadosCandidato`,
`CPartido`, `CEleitor`, `CEleitorDinamico`, `CBiometriaEleitor`,
`CComparecimentoMesario`, `CHistoricoVotoImpresso`, `CEntidadeBU`,
`CIdentificacaoSecao`, `CIdentificacaoUrna`, `CMunicipio`, `CLocal`,
`CComplementosMunicipiosUF`, `CIDEleitoral`, `CIDPacote`, `CHorarioVerao`.

## 8. Namespace `sql::sqlite`

`CSqlConnection`, `CSqlStatement` — persistência relacional (SQLite).

## 9. Namespace `security`

| Classe | Papel |
|---|---|
| `CAesCipher` | Cifra simétrica AES |
| `CBlockCipher` / `CBlock` | Cifras de bloco (base) |
| `CHKDFSeed` | Derivação de chave HKDF |
| `CKeyLoader` | Carregamento de chaves |
| `CSha` | Hash SHA |
| `CSiphashMac` | MAC SipHash |
| `CTrng` / `IRng` | Gerador aleatório (TRNG) |
| `IHash` / `IMacAlgorithm` | Interfaces hash/MAC |
| `ISymmetricCipherFactory` | Fábrica de cifras simétricas |
| `ITextEncoding` | Codificação de texto |

## 10. Namespace `estadoaplicacao` (estados gerais)

`CEstadoGeralVota`, `CEstadoGeralUrna`, `CEstadoGeralSA`, `CEstadoGeralGap`,
`CLocalidadeEleitoral`, `CAjusteDataHora`, `CNumViasImpressasRelatorios`,
`CDadoCarga`, `CDadoLocal`, `CDadoCorrespondencia`.

## 11. Módulos de domínio (`Modulo*` — esquema ASN.1 TSE)

Estes nomes correspondem aos **módulos ASN.1 da especificação da urna** (arquivos
`ModuloX.asn1`), usados para serialização DER/PER dos dados:

| Módulo | Conteúdo |
|---|---|
| `ModuloBoletimUrna` | Boletim de Urna (BU) |
| `ModuloRegistroDigitalVoto` | Registro Digital do Voto (RDV) |
| `ModuloEleicao` | Dados da eleição |
| `ModuloCandidatos` | Candidatos |
| `ModuloEleitores` | Eleitores |
| `ModuloPartidos` | Partidos |
| `ModuloFederacoes` | Federações partidárias |
| `ModuloLocal` | Local de votação |
| `ModuloParametrizacaoUrna` | Parâmetros da urna |
| `ModuloEstadoGeralUrna` | Estado geral da urna |
| `ModuloEstadoGeralVota` | Estado geral de votação |
| `ModuloEstadoGeralGap` | Estado geral do GAP |
| `ModuloProcessoEleitoral` | Processo eleitoral |
| `ModuloConfiguracaoMunicipios` | Configuração de municípios |
| `ModuloComplementosMunicipios` | Complementos de municípios |
| `ModuloInformacaoMidia` | Informações de mídia |
| `ModuloSituacoesEleicoes` | Situações das eleições |
| `ModuloTiposEcoUrna` | Tipos base da eco-urna |
| `ModuloTiposEleitorais` | Tipos eleitorais (cabeçalho de pacote) |
| `ModuloTiposResultadosEcoUrna` | Tipos de resultado |
| `ModuloEnvelopeGenerico` | Envelope genérico (criptografia) |
| `ModuloResultadoUrnaCadastro` | Resultado/cadastro da urna |
