# Fluxo de votação e máquina de estados — TSE VOTA

O fluxo é implementado como uma **máquina de estados** onde cada estado é uma
classe sob o namespace `vota` (gerenciadas por `vota::CTelasVota`) e o estado
geral persistido fica em `estadoaplicacao`.

## 1. Estados de votação (`vota`)

Recuperados das assinaturas C++ (ordem aproximada do fluxo):

```
Início
  └─ CIniciodeCiclo
  └─ CAjusteInicial
  └─ CVerificaEleicaoPassou
  └─ CVerificaHorarioZeresima
Zeresima
  └─ CImprimindoZeresima
  └─ CReimprimindoResumoZeresima
  └─ CQuerReimprimirZeresima
Aguardando eleitores
  └─ CAguardaEleitoresVotarem
Identificação do eleitor
  └─ CPedeDigital
  └─ CControlaReconhecimento          (batimento biométrico)
  └─ CDigitalNaoReconhecida
  └─ CInformacaoEleitor / CNomeEleitor / CInfoEleitorAudioHabilitado
Votação
  └─ CEleitorVotando
       ├─ CPedeProporcional           (escolha de legenda/partido)
       ├─ CCompletaProporcional
       ├─ CConfirmaVotoSemCandidato
       └─ IConfereVotoEmCargo
Apuração / BU
  └─ CGeraBU
  └─ CMostraQRCodeBU
  └─ CQuerImprimirBU
  └─ CImprimindoBU / CImprimindoBim
  └─ CEmitirMaisBU
  └─ CVerificaQtdBUsAdicionais
Resultado
  └─ CGravaResultado
  └─ CGeraDadosDinamicos
  └─ CImprimirBJust                    (boletim de justificativa)
  └─ CRetirarMR                        (retirada da mídia de resultado)
Encerramento
  └─ CSincronizaVota
  └─ CEstadoComDesligamentoAutomatico
  └─ CExibeAlertaDesligamento
```

## 2. Threads concorrentes

| Thread | Papel |
|---|---|
| `CThreadEleitor` | Fluxo do eleitor |
| `CThreadOperador` / `CInformacaoThreadOperador` | Fluxo do mesário/operador |
| `CThreadMonitor` | Monitoramento (alimentação, fone de ouvido, desligamento) |

## 3. Estado geral (`estadoaplicacao`)

| Classe | Papel |
|---|---|
| `CEstadoGeralVota` | Estado geral da votação (`EEstadoVota`, `EEstadoEncerramento`) |
| `CEstadoGeralUrna` | Estado geral da urna (`TipoUrnaOperacao`) |
| `CEstadoGeralSA` | Estado geral (SA = ?) |
| `CEstadoGeralGap` | Estado geral do GAP (`EUrnaAplicativo`) |
| `CLocalidadeEleitoral` | Localidade da seção/urna |
| `CAjusteDataHora` | Ajuste de data/hora |
| `CDadoCarga` / `CDadoLocal` / `CDadoCorrespondencia` | Dados de carga/local |

## 4. Enums de domínio identificados

- `ModuloEstadoGeralVota::EstadoVota` / `EEstadoVota`
- `ModuloEstadoGeralVota::EstadoEncerramento` / `EEstadoEncerramento`
- `ModuloEstadoGeralGap::UrnaAplicativo` / `EUrnaAplicativo`
- `ModuloEstadoGeralUrna::TipoUrnaOperacao`
- `ModuloParametrizacaoUrna::FormaSuspenderComVoto` / `FormaSuspenderSemVoto`
- `ModuloResultadoUrnaCadastro::SituacaoReconhecimentoMesario`
- `ModuloResultadoUrnaCadastro::SituacaoComparecimentoEleitor`
- `ModuloTiposEcoUrna::SituacaoArquivo`
- `ModuloTiposResultadosEcoUrna::MotivoApuracaoManual/Eletronica/MistaComBU`
- `dados::ETipoIdentificadorEleitor`

## 5. Ações transversais

- **Biometria:** coleta e batimento de digitais (`CControlaReconhecimento`,
  `IFingerPrepare`, score de `batimento de digitais`).
- **Áudio:** `CVotacaoStateAudio`, `CInfoEleitorAudioHabilitado`,
  acessibilidade (`CInstrucaoVotacaoAcessibilidade`, `StartStateAudio`).
- **Impressão:** `IImpressora`, `CImprimindoBU`, `CImprimindoZeresima`,
  `CNumViasImpressasRelatorios`.
- **QRCode:** `CMostraQRCodeBU`, geração do QR do BU.
