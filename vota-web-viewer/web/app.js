"use strict";

// ---------------- helpers ----------------
const $ = (s, r = document) => r.querySelector(s);
const main = $("#main");

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
async function api(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error("HTTP " + r.status + " em " + path);
  return r.json();
}
function fmt(n) { return (n || 0).toLocaleString("pt-BR"); }
function go(view, params) {
  location.hash = "#" + view + (params ? "?" + new URLSearchParams(params).toString() : "");
}

function highlight(code) {
  let h = esc(code);
  h = h.replace(/\b(if|else|while|loop|return|goto|break|continue|unreachable|function|var|label|import|export|global|memory|table|data|true|false)\b/g,
    '<span class="kw">$1</span>');
  h = h.replace(/\b(f_[a-z]+)\s*\(/g, '<span style="color:#79c0ff">$1</span>(');
  h = h.replace(/\b(a_[a-z]+)\s*\(/g, '<span style="color:#d2a8ff">$1</span>(');
  h = h.replace(/(&quot;(?:\\.|[^&]|&(?!quot;))*?&quot;)/g, '<span style="color:#a5d6ff">$1</span>');
  return h;
}

const views = {};

// ================= RELATÓRIO =================
views.report = async () => {
  const s = await api("/api/stats");
  const d = await api("/api/domain");
  main.innerHTML = `
  <article class="report">
    <h2 style="border:0">TSE VOTA — Relatório de arquitetura e domínio</h2>
    <p class="lead">Reconstrução do aplicativo da urna eletrônica a partir do binário
    <code>vota_web_wasm.wasm</code>. Apesar da minificação, recuperamos a <b>árvore de fontes real</b>
    (caminhos <code>__FILE__</code> em mensagens de log), as classes, os estados e as regras de negócio
    das strings — o suficiente para entender <b>votação, apuração, resultado e o papel do mesário</b>.</p>

    <div class="cards">
      <div class="card"><div class="n">14.321</div><div class="l">Funções wasm</div></div>
      <div class="card"><div class="n">${fmt(d.files ? d.files.length : 405)}</div><div class="l">Arquivos-fonte</div></div>
      <div class="card"><div class="n">${fmt(s.strings)}</div><div class="l">Strings</div></div>
      <div class="card"><div class="n">${fmt(s.rtti)}</div><div class="l">Tipos RTTI</div></div>
    </div>

    <h2>1. Visão do sistema</h2>
    <p>O sistema é um aplicativo <b>C++</b> compilado para WebAssembly (Emscripten). Ele implementa a
    <b>Urna Eletrônica (UE)</b>: identificação biometricamente assistida do eleitor, votação por cargo,
    geração e assinatura do <b>Boletim de Urna (BU)</b> e do <b>Registro Digital do Voto (RDV)</b>, e o
    controle de <b>comparecimento de mesários</b> e <b>justificativa</b> de ausência.</p>
    ${FIG.layers()}

    <h2>2. Poder do mesário (operador)</h2>
    <p>O mesário opera um <b>fluxo próprio</b> (<code>app/vota/operador</code> + <code>app/comum/comparecimentomesario</code>).
    Ele não vota pela máquina: ele <b>habilita</b> o eleitor, administra exceções e conduz a sessão.</p>
    <div class="power">
      <div class="p"><div class="ic">🧑‍⚖️</div><h4>Registrar mesários</h4>
        <p>Cadastra os mesários da seção por <b>biometria</b>, com limite e boletim de identificação.
        Módulo <code>comparecimentomesario/estados</code>.</p>
        <div class="src">cregistrarmesarios.cpp · cpededigitalmesario.cpp · cimprimiridentificacaomesariosfinal.cpp</div></div>
      <div class="p"><div class="ic">🪪</div><h4>Habilitar o eleitor</h4>
        <p>Lê título/identidade, localiza o eleitor e confirma sua <b>biometria</b>; em caso de falha decide
        repetir, justificar ou suspender.</p>
        <div class="src">cpedeidentidade.cpp · ccontrolareconhecimento.cpp · cdigitalnaoreconhecida.cpp</div></div>
      <div class="p"><div class="ic">✍️</div><h4>Justificativa e voto em trânsito</h4>
        <p>Registra a justificativa de ausência (tabela <code>registro_justificativa</code>) e o voto em
        trânsito, gerando o boletim ao final.</p>
        <div class="src">app/comum/justificativa · app/vota/operador/justificativa</div></div>
      <div class="p"><div class="ic">⏸️</div><h4>Suspender / encerrar</h4>
        <p>Suspensão automática por inatividade, encerramento fora de horário e condução do término
        da votação.</p>
        <div class="src">csuspensaoautomaticaeleitor.cpp · cencerramentohorarioinvalido.cpp</div></div>
      <div class="p"><div class="ic">🖨️</div><h4>Vias e boletins</h4>
        <p>Emissão de vias adicionais de BU, reimpressão de zerésima e relatórios.</p>
        <div class="src">cemitirmaisbu.cpp · cverificaqtdbusadicionais.cpp · app/comum/relatorios</div></div>
      <div class="p"><div class="ic">💾</div><h4>Retirar mídia de resultado</h4>
        <p>Ao final, o operador retira a <b>MR</b> com os resultados assinados.</p>
        <div class="src">cretirarmr.cpp · ccopiaresultadoparamr.cpp</div></div>
    </div>
    ${FIG.mesarioRegistro()}
    ${FIG.mesarioHabilita()}

    <h2>3. Votação (sessão do eleitor)</h2>
    <p>Após habilitado pelo mesário, o eleitor vota em cada cargo. A votação distingue cargos
    <b>majoritários</b> (2 dígitos) e <b>proporcionais</b> (mais dígitos, com legenda), tratando
    <b>branco</b> e <b>nulo</b>, e exibindo a acessibilidade por áudio.</p>
    ${FIG.votacao()}

    <h2>4. Apuração e Boletim de Urna</h2>
    <p>Cada voto é gravado no <b>RDV</b>. Ao fim, a urna gera o <b>BU</b> por cargo, calcula o
    <b>código verificador</b> (CV), aplica <b>hash</b> e <b>assinatura RSA-PSS</b>, imprime o BU com
    <b>QRCode</b> e grava/copia o resultado para a <b>mídia de resultado (MR)</b>.</p>
    ${FIG.apuracao()}

    <h2>5. Resultado</h2>
    <p>O resultado é consolidado nos módulos <code>resultadournacadastro</code> e nos relatórios
    (<code>app/comum/relatorios</code>) — totalização por partido/candidato, abrangência, comparação de
    correspondência e boletins. Os dados seguem o esquema ASN.1 <code>ModuloResultadoUrnaCadastro</code>.</p>
    ${FIG.dados()}

    <div class="callout"><b>Como este relatório foi produzido.</b> O binário não possui seção de nomes.
      Recuperamos a estrutura por: (a) caminhos <code>__FILE__</code> nas strings de log/assert;
      (b) nomes de classe em mensagens <code>Namespace::Classe::metodo()</code>; (c) typeinfo C++ (RTTI,
      demangled com <code>c++filt</code>); (d) enums e nomes de estado; (e) esquema SQL.</div>
  </article>`;
};

// ================= ÁRVORE DE FONTES =================
views.tree = async () => {
  const t = await api("/api/source_tree");
  function badge(p) {
    if (p.startsWith("src/app/vota")) return '<span class="badge vota">vota</span>';
    if (p.startsWith("src/app/comum")) return '<span class="badge comum">comum</span>';
    if (p.startsWith("src/app")) return '<span class="badge comum">app</span>';
    if (p.startsWith("src/api")) return '<span class="badge api">api</span>';
    if (p.startsWith("src/ecourna")) return '<span class="badge ecourna">ecourna</span>';
    return '';
  }
  function node(n) {
    if (n.type === "dir") {
      return `<li class="open"><span class="dir open">${esc(n.name)}</span>
        ${badge(n.path)}
        <ul>${(n.children || []).map(node).join("")}</ul></li>`;
    }
    return `<li><span class="file">📄 ${esc(n.name)}</span><span class="cls">${esc(n.class || "")}</span></li>`;
  }
  main.innerHTML = `
    <h2>Árvore de fontes</h2>
    <div class="sub">Estrutura real do projeto, reconstruída a partir dos caminhos <code>__FILE__</code>
      encontrados nas strings (${fmt(t.children ? countFiles(t) : 0)} arquivos).</div>
    <div class="toolbar"><input type="text" id="fq" placeholder="filtrar por nome de arquivo/pasta..."></div>
    <div class="tree-wrap"><ul class="ftree" id="ftree">${(t.children || []).map(node).join("")}</ul></div>`;
  function countFiles(n){return n.type==='file'?1:(n.children||[]).reduce((a,c)=>a+countFiles(c),0);}
  const tree = $("#ftree");
  tree.addEventListener("click", e => {
    if (e.target.classList.contains("dir")) {
      const li = e.target.closest("li"); if (!li) return;
      li.classList.toggle("open"); e.target.classList.toggle("open");
    }
  });
  $("#fq").oninput = ev => {
    const q = ev.target.value.toLowerCase();
    tree.querySelectorAll("li").forEach(li => {
      const txt = li.firstElementChild ? li.firstElementChild.textContent.toLowerCase() : "";
      const span = li.querySelector(":scope > .file, :scope > .dir");
      if (!span) return;
      const match = span.textContent.toLowerCase().includes(q);
      li.style.display = (!q || match) ? "" : "none";
    });
  };
};

// ================= FLUXO DE VOTAÇÃO =================
views.flow = async () => {
  const groups = [
    ["Início de ciclo", ["CInicioDeCiclo", "CAjusteInicial", "CVerificaEleicaoPassou", "CVerificaHorarioZeresima"]],
    ["Zerésima", ["CImprimindoZeresima", "CReimprimindoResumoZeresima", "CQuerReimprimirZeresima", "CGeradorResumoZeresima", "CTesteTeclado"]],
    ["Aguardando eleitores", ["CAguardaEleitoresVotarem", "CSuspensaoAutomaticaEleitor", "CEncerramentoHorarioInvalido"]],
    ["Identificação / habilitação", ["CPedeIdentidade", "CEleitorEncontrado", "CPedeDigital", "CControlaReconhecimento",
      "CDigitalNaoReconhecida", "CDigitalReconhecida", "CRegistraDigitalOperador", "CNomeEleitor"]],
    ["Votação", ["CEleitorVotando", "CPedeMajoritario", "CPedeProporcional", "CCompletaProporcional", "CPedeNulo",
      "CConfereVotoEmCargo", "CConfirmaVotoEmCargo", "CConfirmaVotoSemCandidato", "CInstrucaoVotacaoAcessibilidade"]],
    ["Fim de votação / BU", ["CGeraBU", "CGeradorBUQRCode", "CMostraQRCodeBU", "CQuerImprimirBU", "CImprimindoBU",
      "CImprimindoBim", "CImprimindoBehb", "CEmitirMaisBU", "CVerificaQtdBUsAdicionais"]],
    ["Resultado / mídia", ["CGravaResultado", "CCopiaResultadoParaMR", "CGeraRelatorios", "CImprimirBJust", "CRetirarMR"]],
    ["Threads", ["CThreadEleitor", "CThreadOperador", "CThreadMonitor", "CInformacaoThreadOperador"]],
  ];
  main.innerHTML = `
    <h2>Fluxo de votação</h2>
    <div class="sub">Máquina de estados em <code>app/vota</code> — cada estado é uma classe.</div>
    ${FIG.estados()}
    <div class="layers">
      ${groups.map(([g, cl]) => `<div class="layer"><div class="lt">${g}</div>
        <div class="chips">${cl.map(c => `<span class="chip">vota::${c}</span>`).join("")}</div></div>`).join("")}
    </div>`;
};

// ================= APURAÇÃO & RESULTADO =================
views.apuracao = async () => {
  const S = (await api("/api/strings?q=boletim&size=20")).items || [];
  const arquivos = [
    ["rdv.dat / rdvred.dat", "Registro Digital do Voto (+ reduzido)", "Votos por cargo: nominais, de legenda, nulos, brancos / votos válidos. <b>Encadeamento</b> <code>ultimoHashVotosVotavel</code> + <code>assinaturaUltimoHashVotosVotavel</code> por votável.", "#15210f"],
    ["bur.dat / imgbu.dat", "Boletim de Urna (totais) + imagem", "Totais por cargo (<code>TotalVotosCargo</code>), dados de seção, <code>DetalhamentoComparecimento</code>, tipo de voto, <b>Código Verificador</b>; imagem do BU impresso.", "#15210f"],
    ["bu... (bim/buj/behb/behbr)", "Boletins auxiliares", "Boletins de impressão/encerramento/justificativa/urna em contingência.", "#1b1f2a"],
    ["rze.dat / imgze.dat", "Zerésima (+ imagem)", "Boletim inicial com todos os cargos zerados, impresso antes da votação.", "#221a0d"],
    ["ResultadoUrnaCadastro (ASN.1)", "Cadastro do resultado", "Comparecimento de mesários/seção, justificativas, estados de habilitação/biometria/foto, parte <b>cifrada</b>.", "#0d2438"],
    ["uesieco-…-aut.dat / -cert.dat", "Resultado assinado + certificado", "Arquivos de resultado da UE <b>assinados</b> (<code>-aut</code>) com o <b>certificado</b> (<code>-cert</code>) — os que vão ao processamento do TSE.", "#221a0d"],
    ["tabcorr.dat / dadoscarga.dat", "Correspondência / carga", "Tabela de correspondência e dados da carga usados no processamento.", "#1b1f2a"],
    ["logd / serialv / infomidia / *-lo.dat", "Log, serial, mídia", "Log do sistema, número de série da urna, informações de mídia e log por seção (<code>{mun}{zona}{seção}-lo.dat</code>).", "#1b1f2a"],
    ["saraiz/gap/sasecao/eg/red/vota/sa .bin", "Estado binário", "Estado geral (SA/EG/GAP), redução, votação e saúde da urna.", "#1b1f2a"],
  ];
  const pacotes = [
    ["pacoteSolicitacaoResultadoUrnaCadastro", "Pedido dos dados de cadastro/resultado da urna"],
    ["pacoteRespostaSolicitacaoResultadoUrnaCadastro", "Resposta com os dados solicitados"],
    ["pacoteProcessamentoResultadoUrnaCadastro", "Envio para processamento do resultado"],
    ["pacoteRespostaProcessamentoResultadoUrnaCadastro", "Confirmação do processamento"],
    ["pacoteResultadoTotalizacao", "Resultado para totalização"],
    ["pacoteConsolidadoEleicao", "Consolidado da eleição"],
    ["pacoteConsolidadoSituacoesEleicoes", "Consolidado de situações"],
    ["pacoteApagaResultadoTotalizacao", "Remoção do resultado de totalização"],
  ];
  main.innerHTML = `
    <article class="report">
      <h2 style="border:0">Apuração &amp; Resultado</h2>
      <p class="lead">O que a urna <b>grava</b> e o que ela <b>envia ao TSE</b>. Votos ficam no <b>RDV</b>;
      os totais vão no <b>BU</b> (assinado); o <b>ResultadoUrnaCadastro</b> empacota comparecimento/justificativa;
      a transmissão usa os pacotes do protocolo <b>SAVD</b>, com assinatura via <b>HSM</b>.</p>
      ${FIG.apuracao()}
      ${FIG.transmissao()}

      <h3>1) O que é gravado na urna</h3>
      <div class="power">
        ${arquivos.map(([n, t, d, c]) => `<div class="p" style="border-left:4px solid ${c};border-radius:0 12px 12px 0">
          <h4 class="mono" style="font-size:12px">${esc(n)}</h4>
          <p style="color:#a9c7ff;margin:2px 0 6px">${t}</p><p>${d}</p></div>`).join("")}
      </div>

      <h3>2) Conteúdo dos artefatos principais</h3>
      <div class="grid2">
        <div class="callout"><b>RDV</b> — <code>ModuloRegistroDigitalVoto</code><br>
          <code>CVoto</code> (tipo: nominal / legenda / nulo / branco), <code>CVotosCargos</code>,
          <code>CVotosEleicoesVota</code>. Cada votável tem <b>hash</b> + <b>assinatura</b> encadeados
          (<code>ultimoHashVotosVotavel</code>).</div>
        <div class="callout ok"><b>BU</b> — <code>ModuloBoletimUrna</code><br>
          <code>TotalVotosCargo</code>, <code>DadosSecao</code>, <code>DetalhamentoComparecimento</code>,
          <code>TipoVoto</code>; <b>Código Verificador</b> (<code>CCalculaCV</code>) e assinatura por
          votável (<code>CAssinaVotavelBU</code>).</div>
        <div class="callout warn"><b>ResultadoUrnaCadastro</b> — <code>ModuloResultadoUrnaCadastro</code><br>
          <code>DadosComparecimento</code>{ <code>mesariosAbertura</code>: <b>SEQUENCE OF</b> <code>ComparecimentoMesario</code> },
          <code>ComparecimentoSecao</code>, <code>EstadoComparecimento</code>,
          <code>IdentificacaoJustificativa</code> (SEQUENCE OF), <code>EstadoHabilitacaoPorCodigo</code>,
          <code>EstadoColetaDigital</code>, <code>ApresentacaoFotoEleitor</code>, <code>HabilitacaoBiometrica</code>,
          <code>DadosComparecimentoCifrado</code> / <code>DadosCifracao</code>.</div>
        <div class="callout"><b>Integridade</b> — <code>CGravadorHashes</code>, <code>EntidadeHashes</code>,
          <code>CAssinador</code>, <code>CEnvelopeGenerico</code>; hashes de arquivos e versões de pacote.</div>
      </div>

      <h3>3) O que é enviado ao TSE (protocolo SAVD)</h3>
      <p>Interface <code>IInterfaceSavd</code> (transporte por socket; no simulador, <code>CWasmSavd</code>).
      As mensagens são empacotadas/desempacotadas por <code>DesconverteHeader</code>/<code>DesconverteMensagem</code>
      e assinadas/validadas por <code>AssinarUE</code>, <code>AssinarEcourna</code>, <code>ValidarUE</code>,
      <code>EnviarAcaoHSM</code>.</p>
      <div class="power">
        ${pacotes.map(([n, d]) => `<div class="p"><h4 class="mono" style="font-size:12px">${esc(n)}</h4><p>${d}</p></div>`).join("")}
      </div>
      <div class="callout warn"><b>Observação.</b> Na operação real a urna costuma ser <b>offline</b>: os
      resultados saem pela <b>mídia de resultado (MR)</b> e são processados no TSE; o protocolo SAVD aqui é a
      camada de mensagens observada (incl. a variante do simulador). <code>IResultado(TMunicipioID, TZonaID,
      TLocalID, TSecaoID, turno, EExtensaoArquivoResultado, ESavdArquivoUE)</code> identifica cada arquivo.</div>

      <h3>4) Garantias aplicadas na apuração</h3>
      <div class="grid2">
        <div class="callout"><b>Hash</b> — <code>CHashArquivo</code>/<code>CHashDiretorio</code>/<code>CMontadorHash</code>.</div>
        <div class="callout ok"><b>Assinatura</b> — RSA-PSS/SHA sobre BU/RDV; chaves via <code>security</code>/HSM.</div>
        <div class="callout"><b>Código Verificador</b> — <code>CCalculaCV::IncluiString</code>, impresso no BU.</div>
        <div class="callout warn"><b>Sigilo</b> — comparecimento/biometria em <code>DadosComparecimentoCifrado</code>.</div>
      </div>
      <p class="mini">Evidência: strings e fontes reconstruídas (ex.: <code>app/comum/gravadores/*</code>,
      <code>app/comum/carquivossavd.cpp</code>, <code>iinterfacesavd.cpp</code>). Sem o fonte oficial, alguns
      detalhes são inferidos do uso — marcados como observação.</p>
    </article>`;
};

// ================= PODER DO MESÁRIO =================
views.mesario = async () => {
  const S = await api("/api/strings?q=mesario&size=60");
  main.innerHTML = `
    <article class="report">
      <h2 style="border:0">Poder do mesário (operador)</h2>
      <p class="lead">O mesário conduz a seção: registra a equipe, habilita eleitores, trata exceções
      (biometria, justificativa, trânsito), emite boletins e encerra a votação.</p>
      ${FIG.mesarioRegistro()}
      ${FIG.mesarioHabilita()}
      <h3>Atribuições e arquivos-fonte</h3>
      <div class="power">
        <div class="p"><h4>Registro de mesários</h4><p>Limite, título válido, biometria do próprio mesário, boletim.</p>
          <div class="src">app/comum/comparecimentomesario/{cregistradormesario,ccontroladorreconhecimetomesario}.cpp</div></div>
        <div class="p"><h4>Leitura de identidade</h4><p>Título → eleitor encontrado.</p>
          <div class="src">app/vota/operador/leidentidade/</div></div>
        <div class="p"><h4>Confirmação biométrica</h4><p>Reconhecida / não reconhecida; registro de digital do operador.</p>
          <div class="src">app/vota/operador/confirmaidentidade/</div></div>
        <div class="p"><h4>Aguardar e suspender</h4><p>Mostra o eleitor votando; suspensão automática.</p>
          <div class="src">app/vota/operador/aguardaeleitor/</div></div>
        <div class="p"><h4>Justificativa</h4><p>Ausência e voto em trânsito; boletim de justificativa.</p>
          <div class="src">app/comum/justificativa/</div></div>
        <div class="p"><h4>Relatórios e vias</h4><p>Reimpressões e vias adicionais de BU.</p>
          <div class="src">app/comum/relatorios/</div></div>
      </div>
      <h3>Strings do domínio (mesário)</h3>
      <div class="chips">${(S.items || []).slice(0, 50).map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>
    </article>`;
};

// ================= SEGURANÇA & INTEGRIDADE =================
views.seguranca = async () => {
  const S = (await api("/api/strings?q=assinatura&size=20")).items || [];
  main.innerHTML = `
    <article class="report">
      <h2 style="border:0">Segurança &amp; integridade</h2>
      <p class="lead">Este binário <b>não é auditável quanto a exploits</b> por análise estática: faltam
      nomes de função e o código real. O que se pode afirmar com segurança é o <b>modelo de defesa</b>
      que o software implementa. Abaixo, os controles <b>observados</b> nas strings/fontes reconstruídas.</p>

      <div class="callout warn"><b>Aviso.</b> Não foram identificadas (nem é possível confirmar) falhas
      exploráveis a partir deste material. Qualquer teste ofensivo deve seguir a divulgação responsável
      e os <b>Testes Públicos de Segurança do TSE</b> — nunca em sistemas reais em produção.</div>

      ${FIG.seguranca()}

      <h3>Controles observados</h3>
      <div class="power">
        <div class="p"><h4>Assinatura de pacotes</h4><p>Validação de assinatura da carga/pacote UE
          (<code>"Falha ao validar assinatura UE"</code>, erro SAVD).</p><div class="src">app/comum/carquivossavd.cpp · iinterfacesavd.cpp</div></div>
        <div class="p"><h4>PKI / certificados</h4><p>OpenSSL X509, CRL/OCSP (<code>pkistatus</code>,
          <code>CRL Distribution Points</code>) para cadeia e revogação.</p><div class="src">ecourna/api/security</div></div>
        <div class="p"><h4>Hash de arquivos</h4><p><code>CHashArquivo</code>, <code>CHashDiretorio</code>,
          <code>CMontadorHash</code>, <code>EntidadeHashes</code>, <code>hashesVersoesPacotes</code>.</p><div class="src">api/hash</div></div>
        <div class="p"><h4>Assinatura do resultado</h4><p>RSA-PSS/SHA sobre BU/RDV
          (<code>shaWithRSAEncryption</code>, <code>Término do procedimento de assinatura</code>).</p><div class="src">app/comum (assinatura de resultados)</div></div>
        <div class="p"><h4>Código Verificador</h4><p><code>CCalculaCV</code> + QRCode do BU
          (<code>CGeradorBUQRCode</code>) para conferência.</p><div class="src">app/comum</div></div>
        <div class="p"><h4>Integridade referencial</h4><p><code>CIntegridadeReferencial</code> valida
          consistência dos dados de carga/estado.</p><div class="src">app/comum/dados/cintegridadereferencial.cpp</div></div>
        <div class="p"><h4>Sigilo dos dados</h4><p>AES + HKDF + SipHash-MAC; comparecimento e biometria
          cifrados (<code>DadosComparecimentoCifrado</code>).</p><div class="src">ecourna/api/security · cepesc</div></div>
        <div class="p"><h4>Contra abuso</h4><p>Contadores de tentativa (<code>numTentativas</code>),
          limites de vias/mesários, <b>bloqueio por horário</b> e tempo de bateria.</p><div class="src">app/vota · climitecopiasbuatingido.cpp</div></div>
        <div class="p"><h4>Ambiente de execução</h4><p><code>AmbienteExecucao</code> e checagens do
          contexto de execução.</p><div class="src">estadoaplicacao</div></div>
        <div class="p"><h4>Lacre e carga</h4><p>Cerimônia com <b>lacre físico</b> e código de
          identificação/carga (<code>telaLacreTampa</code>, <code>codigoCarga</code>).</p><div class="src">app/vota/iniciovotacao</div></div>
      </div>

      <h3>Modelo de confiança (onde repousa a garantia)</h3>
      <p>A confiança do sistema é <b>em camadas</b>: (1) o <b>software de votação é autenticado</b> por
      assinatura/PKI na carga; (2) na votação o processo roda em ambiente <b>isolado e selado</b>;
      (3) os resultados são <b>assinados e com hash</b> (via <b>HSM/SAVD</b>); (4) a totalização
      <b>revalida</b> tudo. A segurança depende da cadeia inteira e dos <b>procedimentos</b>
      (cerimônia, lacre, auditoria/fiscalização).</p>
      ${FIG.savd()}
      ${FIG.risco()}

      <h3>Áreas de atenção para melhoria (revisão defensiva)</h3>
      <p class="mini">Candidatos a revisão, derivados de evidências nas strings/fontes. São
        <b>hipóteses de risco</b> para orientar hardening — não são falhas confirmadas nem instruções de ataque.</p>
      <div class="power">
        ${[
        ["F1", "Modo demonstração / treinamento", "alto",
          ["GetDemoMode()", "Biometria desabilitada em demonstração", "IMPRESSO EM MODO DEMONSTRAÇÃO", "telaMRModoDemo"],
          "Se o estado de demonstração puder ser ativado/alterado fora da carga assinada, há mudança de comportamento (biometria off, tela de resultado) que confunde auditoria.",
          "Derivar demoMode de parâmetro assinado; marca d'água obrigatória; impedir persistência de demo em produção; teste negativo de transição."],
        ["F2", "Flags de debug no artefato", "alto",
          ["DEBUG_UENUX", "assertion failed (centenas)", "Assert (qtd == 0u)"],
          "Build de produção com DEBUG_UENUX/asserts pode alterar verbosidade e remover checagens (asserts compiladas fora).",
          "Garantir NDEBUG; remover símbolos de debug do binário publicado; converter asserts críticos em checagens sempre ativas com log."],
        ["F3", "Mídia de Resultado (MR) 'SemHabilitar'", "alto",
          ["MontarMRSemHabilitar", "IsMRMontadoSemHabilitar", "DesmontarMRSemDesabilitar", "Serial da MR"],
          "Operações de MR sem habilitação podem gerar estados inconsistentes de montagem/retirada — a retirada da MR é momento crítico.",
          "Máquina de estados explícita e auditável; assinar/chancelar cada transição; exigir confirmação assinada da retirada."],
        ["F4", "Superfície de parsing (SAVD / ASN.1 / SQLite)", "médio",
          ["CWasmSavd::RecebeMensagem - tamanho invalido", "DesconverteMensagem(vector<uebyte>)", "SEQUENCE OF incorrect final position", "inconsistent content length"],
          "Decodificadores tratam arquivos externos (carga/SAVD/MR); bugs de limite → DoS ou confusão de dados.",
          "Fuzzing dos decodificadores; validar tamanhos antes de copiar; rejeitar DER não canônico; limitar profundidade/tamanho."],
        ["F5", "Criptografia — config e algoritmos legados", "médio",
          ["provider=default,fips=yes", "rc4_hmac_md5", "tdes_*", "shaWithRSAEncryption"],
          "Presença de nomes de algoritmos legados (RC4/TDES). Se alcançáveis, enfraquecem garantias.",
          "Confirmar provider legado desabilitado; fixar FIPS; travar assinatura em RSA-PSS (SHA-256/512, salt explícito)."],
        ["F6", "RNG / TRNG", "alto",
          ["CTrng", "reseed_requests", "seed sources", "BufferSeed"],
          "Chaves e segredos dependem da qualidade do RNG.",
          "Atestar entropia (DRBG com reseed); evitar time()/seed fixo; testes de não-determinismo."],
        ["F7", "Funções de 'desabilitar' (sensores/bateria/áudio)", "médio",
          ["DisableSensors", "DisableBatIntStorageMode", "CDesabilitaAudioEleitor", "desabilitando MR"],
          "Se alcançáveis indevidamente, podem suprimir trilhas de segurança/auditoria.",
          "Restringir por estado autenticado; registrar quem/quando; revisar exposição via interface."],
        ["F8", "Assinatura e verificação (fail-closed)", "alto (mitigável)",
          ["AssinarUE", "ValidarUE", "AssinarEcourna", "EnviarAcaoHSM", "Falha ao validar assinatura UE"],
          "Bom sinal: assinatura e validação via HSM/SAVD. Risco residual: caminhos onde a validação falha e o fluxo continua.",
          "Garantir fail-closed: abortar em qualquer falha de validação; cobrir todos os pontos de entrada; testes de assinatura inválida."],
        ].map(([id, tit, sev, ev, risco, mit]) => `
          <div class="p">
            <h4>${id} · ${tit} <span class="tag ${sev.startsWith("alto") ? "exp" : ""}">${sev}</span></h4>
            <p><b>Evidência:</b> ${ev.map(e => `<code>${esc(e)}</code>`).join(" · ")}</p>
            <p><b>Risco:</b> ${esc(risco)}</p>
            <p><b>Mitigação:</b> ${esc(mit)}</p>
          </div>`).join("")}
      </div>

      <h3>Backlog de hardening (sugestão)</h3>
      <div class="callout ok"><b>P0:</b> F1 demo, F2 debug, F8 fail-closed. &nbsp; <b>P1:</b> F3 MR, F6 RNG.
        &nbsp; <b>P2:</b> F4 parsing (fuzzing), F5 crypto, F7 disables.</div>

      <h3>Como reportar</h3>
      <div class="callout ok">Pesquisa de segurança na urna deve usar os canais oficiais do <b>TSE</b>
      (Testes Públicos de Segurança / divulgação coordenada). Não teste sistemas em produção e não
      divulgue detalhes sem coordenação com o fabricante/autoridade.</div>

      <h3>Strings de assinatura (amostra)</h3>
      <div class="chips">${S.slice(0, 12).map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>
    </article>`;
};

// ================= AUDITORIA (COM SIGILO) =================
views.auditoria = async () => {
  const mecs = [
    ["Compromissos (hash/Merkle)", "CGravadorHashes · EntidadeHashes",
      "Publicar a <b>raiz de hash</b> de cada artefato (RDV/BU) e <b>provas de inclusão</b>. Audita-se integridade e presença de um item sem revelar o restante nem o vínculo voto↔eleitor.",
      "O dado confidencial nunca sai da urna; só o compromisso é público."],
    ["Assinaturas verificáveis por público", "AssinarUE · ValidarUE · CAssinador",
      "Chaves <b>públicas</b> publicadas; qualquer cidadão verifica a assinatura (RSA-PSS) do BU/RDV sem a chave privada (que fica no HSM).",
      "Verificação não exige segredo."],
    ["Log de transparência (append-only)", "CGravadorHashes + Merkle",
      "Todo BU publicado entra num <b>log append-only</b> (estilo Certificate Transparency). Detecta omissão/forja/substituição.",
      "Só digests; nada de voto individual."],
    ["Auditoria por amostragem (RLA)", "BU impresso + boletins",
      "<b>Risk-Limiting Audit</b>: confronta o boletim em papel com o total digital, limitando estatisticamente o erro sem abrir o RDV.",
      "Usa o que já é público (totais)."],
    ["Separação voto ↔ identidade", "RDV vs ResultadoUrnaCadastro",
      "Votos ficam no RDV; identidade/comparecimento/biometria ficam em estrutura <b>separada e cifrada</b> (<code>DadosComparecimentoCifrado</code>).",
      "Auditoria do voto não toca identidade."],
    ["Cifra com limiar (threshold)", "security · HSM (EnviarAcaoHSM)",
      "Decifrar o confidencial exige <b>múltiplos guardiões</b> (cerimônia). Auditar corretude não requer decifrar.",
      "Nenhum ator isolado quebra o sigilo."],
    ["Provas de conhecimento zero (ZK)", "ASN.1 + assinaturas",
      "Provar que <b>total = soma dos votos comprometidos</b> (ou que a elegibilidade foi checada) sem revelar os votos.",
      "Corretude verificável sem abrir o dado."],
    ["Build reprodutível + atestação", "hash do binário/carga",
      "Recompilar do fonte e comparar hashes; assinar o <b>binário</b> e a <b>carga</b>. Garante que o software auditado = software executado.",
      "Endereça flags de debug (F2)."],
  ];
  main.innerHTML = `
    <article class="report">
      <h2 style="border:0">Auditoria com preservação de sigilo</h2>
      <p class="lead">É possível <b>aumentar muito a auditabilidade sem expor</b> o que é confidencial. A ideia-chave:
      <b>separar camadas</b> e auditar <b>compromissos</b> (hashes/provas) em vez do dado cru. As informações a proteger
      são: o <b>vínculo voto↔eleitor</b>, a <b>biometria/foto</b> e as <b>chaves privadas</b>.</p>

      ${FIG.auditoria()}

      <h3>Princípios</h3>
      <div class="grid2">
        <div class="callout"><b>1. Publicar provas, não dados.</b> Hash, assinatura e CV provam integridade/corretude sem revelar conteúdo.</div>
        <div class="callout ok"><b>2. Separar quem sabe o quê.</b> Quem audita a contagem não precisa da identidade do eleitor — e vice-versa.</div>
        <div class="callout warn"><b>3. Limiar para o sensível.</b> O pouco que é confidencial só se abre por <b>múltiplos guardiões</b> (e só se necessário).</div>
        <div class="callout"><b>4. Verificável por terceiros.</b> Cidadão, partido e perito revalidam <b>independentemente</b>, sem confiar no fabricante.</div>
      </div>

      <h3>Mecanismos concretos (mapeados ao que o sistema já tem)</h3>
      <div class="power">
        ${mecs.map(([t, src, d, why]) => `<div class="p"><h4>${t}</h4>
          <div class="mono" style="color:#7ee787;font-size:10.5px;margin:2px 0 6px">${src}</div>
          <p>${d}</p><p class="mini" style="color:#8fae8a">↳ ${why}</p></div>`).join("")}
      </div>

      <h3>O que permanece confidencial (nunca publicado)</h3>
      <div class="chips">
        <span class="chip">voto vinculado à sequência/eleitor</span><span class="chip">biometria e foto</span>
        <span class="chip">comparecimento individual</span><span class="chip">chaves privadas (HSM)</span>
        <span class="chip">segredos de seção</span>
      </div>

      <h3>Como isso se encaixa no ciclo real</h3>
      <p><b>Pré-pleito:</b> publicar <b>hash assinado do binário e da carga</b> (build reprodutível) → qualquer um confere.
      <b>Votação:</b> RDV/BU comprometidos por hash; chaves no HSM. <b>Após:</b> publicar BU, zerésima, <b>CV</b>, raízes de hash
      e assinaturas no <b>log de transparência</b>; rodar <b>RLA</b> no papel. <b>Perícia:</b> acesso ao confidencial só via
      limiar/cerimônia e sempre auditável.</p>

      <div class="callout ok"><b>Resultado.</b> Mais auditoria <b>não</b> exige menos sigilo: with commitments, assinaturas
      públicas, log de transparência e provas ZK, verifica-se <b>integridade, inclusão e corretude</b> da apuração sem
      revelar voto, identidade ou chaves.</div>

      <div class="callout warn"><b>Ressalva.</b> Proposta conceitual, alinhada aos primitivos observados no binário
      (<code>CGravadorHashes</code>, <code>ValidarUE</code>, <code>DadosComparecimentoCifrado</code>, HSM). Requer
      validação normativa e de segurança antes de adoção.</div>
    </article>`;
};

// ================= SIMULADORES =================
views.sim = async () => {
  main.innerHTML = `
    <h2>Simuladores</h2>
    <div class="sub">Simulações didáticas do fluxo real (dados de exemplo). Reproduzem a lógica descrita no relatório.</div>
    <div class="tabsbar" id="simtabs">
      <button class="pill on" data-s="votacao">Votação</button>
      <button class="pill" data-s="apuracao">Apuração &amp; BU</button>
      <button class="pill" data-s="mesario">Mesário</button>
    </div>
    <div id="simhost"></div>`;
  const host = $("#simhost");
  const run = s => { host.innerHTML = ""; (SIM[s] || SIM.votacao)(host); };
  $("#simtabs").addEventListener("click", e => {
    const s = e.target.dataset.s; if (!s) return;
    document.querySelectorAll("#simtabs .pill").forEach(b => b.classList.toggle("on", b.dataset.s === s));
    run(s);
  });
  run("votacao");
};

// ================= VISÃO GERAL TÉCNICA =================
views.overview = async () => {
  const s = await api("/api/stats");
  const cards = [
    ["Funções", s.functions], ["Strings", s.strings], ["Segmentos de dados", s.data_segments],
    ["Classes (RTTI)", s.rtti], ["Namespaces", s.namespaces], ["Imports", s.imports],
    ["Exports", s.exports], ["Linhas .dcmp", s.lines],
  ].map(([l, n]) => `<div class="card"><div class="n">${fmt(n)}</div><div class="l">${l}</div></div>`).join("");
  main.innerHTML = `
    <h2>Visão geral técnica</h2>
    <div class="sub">Build Emscripten/C++ minificado, sem seção de nomes.</div>
    <div class="cards">${cards}</div>
    ${FIG.layers()}
    <h3>Domínio — módulos ASN.1 (TSE)</h3>
    <div class="chips">${["ModuloBoletimUrna", "ModuloRegistroDigitalVoto", "ModuloEleicao", "ModuloCandidatos",
      "ModuloEleitores", "ModuloPartidos", "ModuloFederacoes", "ModuloLocal", "ModuloParametrizacaoUrna",
      "ModuloEstadoGeralUrna", "ModuloEstadoGeralVota", "ModuloEstadoGeralGap", "ModuloProcessoEleitoral",
      "ModuloConfiguracaoMunicipios", "ModuloComplementosMunicipios", "ModuloInformacaoMidia",
      "ModuloSituacoesEleicoes", "ModuloTiposEcoUrna", "ModuloTiposEleitorais", "ModuloTiposResultadosEcoUrna",
      "ModuloEnvelopeGenerico", "ModuloResultadoUrnaCadastro", "ModuloFotosCandidatos"]
      .map(m => `<span class="chip">${m}</span>`).join("")}</div>
    <div class="note">Nomes de classe recuperados de strings de log (<code>Namespace::Classe::metodo()</code>)
      e de typeinfo C++ (RTTI).</div>`;
};

// ================= MÓDULOS & CLASSES =================
views.modules = async () => {
  const d = await api("/api/modules");
  const rtti = await api("/api/rtti");
  const dom = await api("/api/domain");
  const tbl = (h, rows, num) => !rows.length ? `<div class="empty">nada</div>` :
    `<table><thead><tr>${h.map((x, i) => `<th class="${num && i === 1 ? 'num' : ''}">${x}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${num && i === 1 ? 'num' : ''}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  main.innerHTML = `
    <h2>Módulos &amp; classes</h2>
    <div class="sub">Namespaces, classes de domínio (por palavras-chave) e tipos RTTI (demangled).</div>
    <div class="toolbar"><input type="text" id="mq" placeholder="filtrar..."></div>
    <h3>Classes por domínio</h3>
    <div id="dom"></div>
    <h3>Namespaces</h3><div id="ns"></div>
    <h3>Tipos RTTI (C++) — ${rtti.length}</h3><div id="rtti"></div>`;
  function render(term = "") {
    const t = term.toLowerCase();
    const ns = d.namespaces.filter(n => n.name.toLowerCase().includes(t));
    $("#ns").innerHTML = tbl(["Namespace", "Refs"], ns.map(n => [esc(n.name), n.count]), true);
    const rt = rtti.filter(r => !t || r.name.toLowerCase().includes(t) || r.mangled.toLowerCase().includes(t));
    $("#rtti").innerHTML = tbl(["Tipo (demangled)", "Mangled"], rt.slice(0, 400).map(r =>
      [esc(r.name), `<span class="mono" style="color:#8b98a9">${esc(r.mangled.slice(0, 55))}</span>`]), false);
    const dm = dom.classes || {};
    $("#dom").innerHTML = Object.entries(dm).filter(([k]) => !t || k.includes(t)).map(([k, arr]) =>
      `<div class="layer"><div class="lt">${k} (${arr.length})</div><div class="chips">${arr.slice(0, 60).map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>`).join("");
  }
  render();
  $("#mq").oninput = e => render(e.target.value);
};

// ================= FUNÇÕES (grafo interativo) =================
const fg = { name: null, cache: {} };
views.functions = async (params) => {
  if (params && params.name) return functionFocus(params.name);
  const d = await api("/api/functions?size=1&sort=callers");
  main.innerHTML = `
    <h2>Explorador de funções</h2>
    <div class="sub">Nomes <code>f_*</code> são sintéticos. Navegue pelo <b>grafo de chamadas</b> e veja
      as mensagens de log que cada função emite (quando recuperáveis).</div>
    <div class="toolbar">
      <input type="text" id="q" placeholder="buscar f_... ou vá pela árvore de fontes / relatório">
      <select id="sort">
        <option value="callers">mais chamadores</option>
        <option value="loc">maior corpo</option>
        <option value="name">nome</option>
      </select>
      <button class="pill" data-f="large">corpo ≥ 100</button>
      <button class="pill on" data-f="">todas</button>
    </div>
    <div id="list"></div><div class="pager" id="pager"></div>`;
  let page = 1, q = "", sort = "callers", filter = "";
  const load = async () => {
    $("#list").innerHTML = `<div class="spinner">carregando…</div>`;
    const d = await api(`/api/functions?q=${encodeURIComponent(q)}&page=${page}&size=50&sort=${sort}&filter=${filter}`);
    $("#list").innerHTML = `<table><thead><tr><th>Função</th><th>Retorno</th><th class="num">Linhas</th>
      <th class="num">Chama</th><th class="num">Chamada por</th></tr></thead><tbody>
      ${d.items.map(f => `<tr><td><a class="lnk" data-n="${f.name}">${f.name}</a></td>
        <td class="mono">${esc(f.return)}</td><td class="num">${f.loc}</td>
        <td class="num">${f.n_callees ?? 0}</td><td class="num">${f.n_callers}</td></tr>`).join("")}
      </tbody></table>`;
    const pages = Math.max(1, Math.ceil(d.total / d.size));
    $("#pager").innerHTML = `<button id="prev" ${page <= 1 ? 'disabled' : ''}>‹</button>
      <span>página ${page} de ${fmt(pages)} · ${fmt(d.total)}</span>
      <button id="next" ${page >= pages ? 'disabled' : ''}>›</button>`;
    $("#prev").onclick = () => { page--; load(); };
    $("#next").onclick = () => { page++; load(); };
    $("#list").querySelectorAll("a.lnk").forEach(a => a.onclick = () => go("functions", { name: a.dataset.n }));
  };
  let t; $("#q").oninput = e => { clearTimeout(t); q = e.target.value; page = 1; t = setTimeout(load, 250); };
  $("#sort").onchange = e => { sort = e.target.value; page = 1; load(); };
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => {
    filter = b.dataset.f; page = 1;
    document.querySelectorAll("[data-f]").forEach(x => x.classList.remove("on"));
    b.classList.add("on"); load();
  });
  load();
};

async function functionFocus(name) {
  main.innerHTML = `<div class="spinner">carregando ${esc(name)}…</div>`;
  const f = await api("/api/function/" + encodeURIComponent(name));
  const cap = 14;
  const callers = f.callers.slice(0, cap), callees = f.callees.slice(0, cap);
  main.innerHTML = `
    <h2 class="mono">${esc(f.name)}</h2>
    <div class="kv">
      <div class="k">Retorno</div><div class="mono">${esc(f.return)}</div>
      <div class="k">Parâmetros</div><div class="mono">${f.params.map(p => esc(p.name) + ":" + esc(p.type)).join(", ") || "—"}</div>
      <div class="k">Linhas descompiladas</div><div>${f.loc}</div>
      <div class="k">Conexões</div><div>${f.callers.length} chamadores · ${f.callees.length} chamadas</div>
    </div>
    <div class="callout">Função sem nome simbólico. Use o grafo abaixo para navegar: clique em um nó para
      focar. Ligada nesta vizinhança estão as funções que a usam e as que ela usa.</div>
    <div class="graphwrap">${graphSVG(f.name, callers, callees)}</div>
    <h3>Corpo descompilado (orientativo)</h3>
    <pre class="code">${highlight(f.body)}</pre>`;
  main.querySelectorAll(".gnode").forEach(n => n.onclick = () => go("functions", { name: n.dataset.n }));
}

function graphSVG(name, callers, callees) {
  const H = Math.max(callers.length, callees.length, 1) * 34 + 40;
  const W = 900;
  const cw = 250, ch = 26;
  let b = "";
  const cx = W / 2, cy = H / 2;
  // root
  b += `<g class="gnode" data-n="${esc(name)}">
    <rect x="${cx - cw / 2}" y="${cy - 20}" width="${cw}" height="40" rx="8" fill="#12324f" stroke="#4aa8ff"/>
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-weight="700">${esc(name)}</text></g>`;
  callers.forEach((c, i) => {
    const y = 30 + i * 34;
    b += `<line x1="${cx - cw / 2}" y1="${cy}" x2="${cx - cw - 40}" y2="${y + ch / 2}" stroke="#5c8a3f" stroke-width="1.2"/>`;
    b += `<g class="gnode" data-n="${esc(c)}"><rect x="40" y="${y}" width="${cw}" height="${ch}" rx="6" fill="#15210f" stroke="#3f5b2a"/>
      <text x="${40 + cw / 2}" y="${y + 17}" text-anchor="middle">${esc(c)}</text></g>`;
  });
  callees.forEach((c, i) => {
    const y = 30 + i * 34;
    b += `<line x1="${cx + cw / 2}" y1="${cy}" x2="${W - cw - 40}" y2="${y + ch / 2}" stroke="#2f5c8a" stroke-width="1.2"/>`;
    b += `<g class="gnode" data-n="${esc(c)}"><rect x="${W - cw - 40}" y="${y}" width="${cw}" height="${ch}" rx="6" fill="#0d2438" stroke="#1d5c8a"/>
      <text x="${W - cw - 40 + cw / 2}" y="${y + 17}" text-anchor="middle">${esc(c)}</text></g>`;
  });
  b += `<text x="${90}" y="18" fill="#7ee787" font-size="11">◄ chamadores</text>`;
  b += `<text x="${W - 180}" y="18" fill="#4aa8ff" font-size="11">chamadas ►</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${b}</svg>`;
}

// ================= STRINGS =================
views.strings = async () => {
  main.innerHTML = `<h2>Strings</h2>
    <div class="sub">Literais da seção de dados (SQL, logs, UI, ASN.1).</div>
    <div class="toolbar"><input type="text" id="q" placeholder="buscar..."><span id="cnt" class="pill"></span></div>
    <div id="list"></div><div class="pager" id="pager"></div>`;
  let page = 1;
  const load = async () => {
    const d = await api(`/api/strings?q=${encodeURIComponent($("#q").value)}&page=${page}&size=100`);
    $("#cnt").textContent = fmt(d.total) + " resultados";
    $("#list").innerHTML = `<table><tbody>${d.items.map(s => `<tr><td class="mono">${esc(s)}</td></tr>`).join("")}</tbody></table>`;
    const pages = Math.max(1, Math.ceil(d.total / d.size));
    $("#pager").innerHTML = `<button id="prev" ${page <= 1 ? 'disabled' : ''}>‹</button>
      <span>página ${page} de ${fmt(pages)}</span><button id="next" ${page >= pages ? 'disabled' : ''}>›</button>`;
    $("#prev").onclick = () => { page--; load(); }; $("#next").onclick = () => { page++; load(); };
  };
  let t; $("#q").oninput = () => { clearTimeout(t); page = 1; t = setTimeout(load, 250); };
  load();
};

// ================= DADOS & SQL =================
views.data = async () => {
  const sql = await api("/api/sql");
  main.innerHTML = `<h2>Dados &amp; SQL</h2>
    <div class="sub">Persistência híbrida: SQLite (registros) + arquivos ASN.1.</div>
    <h3>Esquema</h3>
    ${Object.entries(sql.schema).map(([t, c]) => `<div class="note"><b>${esc(t)}</b><pre class="code" style="max-height:none">${esc(c)}</pre></div>`).join("")}
    <h3>Statements (${sql.statements.length})</h3>
    <div class="toolbar"><input type="text" id="q" placeholder="filtrar SQL..."><button class="pill" data-f="user">só tabelas do domínio</button></div>
    <div id="list"></div>`;
  const render = (term = "", userOnly = false) => {
    let arr = sql.statements;
    if (term) arr = arr.filter(s => s.toLowerCase().includes(term.toLowerCase()));
    if (userOnly) arr = arr.filter(s => /comparecimento_mesario|registro_justificativa/i.test(s));
    $("#list").innerHTML = `<table><tbody>${arr.slice(0, 800).map(s => `<tr><td class="mono">${esc(s)}</td></tr>`).join("")}</tbody></table>`;
  };
  render();
  $("#q").oninput = e => render(e.target.value);
  $("[data-f=user]").onclick = () => render($("#q").value, true);
};

// ================= BIBLIOTECAS =================
views.libraries = async () => {
  const libs = [
    ["SQLite", "sql::sqlite", "Persistência relacional (mesários, justificativa)."],
    ["OpenSSL", "security", "RSA-PSS, AES, SHA, X509, ASN.1 DER."],
    ["Boost", "boost::", "regex, posix_time, filesystem, function."],
    ["7-Zip / LZMA", "compression::CLzmaCompress", "Compressão de pacotes."],
    ["ASN1", "ASN1::", "SEQUENCE_OF, constraints (TSE ASN.1)."],
    ["RHVoice", "RHVoice::", "Síntese de voz pt-BR (acessibilidade)."],
    ["QR Code", "comum::CGeradorBUQRCode", "QRCode do BU (QRBU)."],
    ["pthreads (emul.)", "vota::CThread*", "Threads de eleitor/operador/monitor."],
    ["Emscripten", "a.* (136 imports)", "Runtime/glue JS."],
  ];
  main.innerHTML = `<h2>Bibliotecas embutidas</h2>
    <div class="sub">Identificadas por RTTI e assinaturas.</div>
    <div class="cards">${libs.map(([n, ns, d]) => `<div class="card"><div class="n" style="font-size:16px">${n}</div>
      <div class="mono" style="color:#7ee787;margin:4px 0">${esc(ns)}</div>
      <div class="l" style="text-transform:none;letter-spacing:0;font-size:12.5px;color:#c3cddb">${esc(d)}</div></div>`).join("")}</div>`;
};

// ================= IMPORTS / EXPORTS =================
views.imp_exp = async () => {
  const d = await api("/api/imports_exports");
  const exps = d.exports.filter(e => e.kind === "func");
  main.innerHTML = `<h2>Imports / Exports</h2>
    <div class="sub">Interface do módulo wasm com o host JS.</div>
    <div class="split">
      <div><h3>Exports funcionais (${exps.length})</h3>
        <table><thead><tr><th>Export</th><th class="num">Índice wasm</th></tr></thead><tbody>
        ${exps.map(e => `<tr><td class="mono">${esc(e.export)}</td><td class="num">${e.index}</td></tr>`).join("")}
        </tbody></table>
        <h3>Memória / tabela</h3>
        <div class="chips">${d.exports.filter(e => e.kind !== "func").map(e => `<span class="chip">${e.kind} → ${esc(e.export)}</span>`).join("")}</div>
      </div>
      <div><h3>Imports (${d.imports.length})</h3>
        <table><thead><tr><th>Import</th><th class="num">sig</th></tr></thead><tbody>
        ${d.imports.slice(0, 140).map(i => `<tr><td class="mono">${esc(i.name)}</td><td class="num">${i.sig ?? "—"}</td></tr>`).join("")}
        </tbody></table></div>
    </div>`;
};

// ---------------- router ----------------
function parseHash() {
  const hsh = location.hash.replace(/^#/, "") || "report";
  const [view, qs] = hsh.split("?");
  return { view, params: Object.fromEntries(new URLSearchParams(qs || "")) };
}
async function route() {
  const { view, params } = parseHash();
  document.querySelectorAll(".sidebar a").forEach(a => a.classList.toggle("active", a.dataset.view === view));
  main.innerHTML = `<div class="spinner">carregando…</div>`;
  try { (views[view] || views.report)(params); }
  catch (e) { main.innerHTML = `<div class="empty">Erro: ${esc(e.message)}</div>`; }
}
window.addEventListener("hashchange", route);

(async () => {
  try {
    const s = await api("/api/stats");
    $("#global-stats").innerHTML = `<span><b>${fmt(s.functions)}</b> funções</span>
      <span><b>${fmt(s.strings)}</b> strings</span>
      <span><b>${fmt(s.data_segments)}</b> seg. dados</span>
      <span><b>${fmt(s.rtti)}</b> tipos</span>`;
  } catch (e) { }
})();
route();
