"use strict";
// Simuladores interativos do fluxo da urna (didáticos, fiéis à estrutura
// observada no binário, porém com dados de exemplo).

const SIM = {};

// util
function h(html){const d=document.createElement("div");d.innerHTML=html.trim();return d.firstElementChild;}
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}

// ---------------- 1. Simulador de votação ----------------
SIM.votacao = function(host){
  const cargos = [
    {id:"governador", nome:"GOVERNADOR", digs:2, cands:{"12":["CANDIDATO ALFA","PARTIDO A"],"45":["CANDIDATO BETA","PARTIDO B"],"00":["NULO",""]}},
    {id:"senador", nome:"SENADOR", digs:3, cands:{"123":["CANDIDATO GAMA","PARTIDO A"],"456":["CANDIDATO DELTA","PARTIDO C"]}},
    {id:"depfed", nome:"DEPUTADO FEDERAL", digs:4, cands:{"1234":["CANDIDATO ÉPSILON","PARTIDO B"],"5678":["CANDIDATO ZETA","PARTIDO D"]}},
  ];
  let idx=0, buf="", votos=[], stage="votando";

  host.innerHTML = `
    <div class="grid2">
      <div class="sim">
        <div class="mini" id="vt-topo"></div>
        <div class="screen" id="vt-screen" style="margin-top:8px"></div>
        <div class="keys" id="vt-keys" style="max-width:340px">
          ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="num" data-k="${n}">${n}</button>`).join("")}
          <button class="num" data-k="0">0</button>
          <button data-k="BRANCO">BRANCO</button>
          <button data-k="CORRIGE">CORRIGE</button>
          <button data-k="CONFIRMA">CONFIRMA</button>
        </div>
        <div class="mini" style="margin-top:8px">Teclas: números · <span class="kbd">BRANCO</span> <span class="kbd">CORRIGE</span> <span class="kbd">CONFIRMA</span></div>
      </div>
      <div>
        <h3 style="margin-top:0">Cédula / votos registrados</h3>
        <div id="vt-rrdv"></div>
        <div class="mini" id="vt-fim"></div>
      </div>
    </div>`;

  const screen = host.querySelector("#vt-screen");
  const topo = host.querySelector("#vt-topo");
  const rrdv = host.querySelector("#vt-rrdv");

  function render(){
    if(stage==="fim"){
      screen.innerHTML = `<div class="big">FIM</div><div style="margin-top:8px">Votação encerrada — votos gravados no RDV.</div>`;
      topo.textContent = "Sessão do eleitor";
      rrdv.innerHTML = votos.length? `<table><thead><tr><th>Cargo</th><th>Voto</th></tr></thead><tbody>
        ${votos.map(v=>`<tr><td>${v.cargo}</td><td>${v.txt}</td></tr>`).join("")}</tbody></table>`:"";
      host.querySelector("#vt-fim").innerHTML = `<div class="callout ok" style="margin-top:10px">Agora o mesário emite o BU e libera a urna para o próximo eleitor.</div>`;
      return;
    }
    const c = cargos[idx];
    let cand="";
    if(buf.length===c.digs && c.cands[buf]) cand = `<div style="margin-top:6px;color:#ffd479">${c.cands[buf][0]} <span class="mini">${c.cands[buf][1]}</span></div>`;
    const slots = Array.from({length:c.digs},(_,i)=>`<span style="color:${i<buf.length?'#7ee787':'#274a34'}">${buf[i]||'–'}</span>`).join(" ");
    topo.textContent = `Cargo ${idx+1} de ${cargos.length}`;
    screen.innerHTML = `<div class="mini">Seu voto para</div>
      <div class="big">${c.nome}</div>
      <div style="font-size:26px;letter-spacing:6px;margin:10px 0">${slots}</div>
      ${cand}
      <div class="mini">Número: ${buf||'—'} ${buf.length===c.digs?'':'· digite '+ (c.digs-buf.length)+' dígito(s)'}</div>`;
  }
  function confirma(){
    const c=cargos[idx];
    let txt;
    if(buf==="") txt="BRANCO";
    else if(buf.length===c.digs && c.cands[buf]) txt = `${buf} · ${c.cands[buf][0]}`;
    else txt = `${buf} · NULO`;
    votos.push({cargo:c.nome, txt});
    idx++; buf="";
    if(idx>=cargos.length){ stage="fim"; }
    render();
  }
  host.querySelector("#vt-keys").addEventListener("click",e=>{
    const k=e.target.dataset.k; if(!k) return;
    if(stage==="fim") return;
    const c=cargos[idx];
    if(/^\d$/.test(k)){ if(buf.length<c.digs) buf+=k; }
    else if(k==="CORRIGE"){ buf=""; }
    else if(k==="BRANCO"){ if(buf===""){ votos.push({cargo:c.nome,txt:"BRANCO"}); idx++; if(idx>=cargos.length)stage="fim"; } }
    else if(k==="CONFIRMA"){ confirma(); }
    render();
  });
  render();
};

// ---------------- 2. Simulador de apuração ----------------
SIM.apuracao = function(host){
  const cands = [
    {n:"12", nome:"CANDIDATO ALFA", partido:"PARTIDO A", votos:0},
    {n:"45", nome:"CANDIDATO BETA", partido:"PARTIDO B", votos:0},
    {n:"99", nome:"CANDIDATO ÔMEGA", partido:"PARTIDO C", votos:0},
  ];
  let brancos=0, nulos=0, gerado=false;

  host.innerHTML = `
    <div class="grid2">
      <div class="sim">
        <h3 style="margin-top:0">Urna — registro de votos (RDV)</h3>
        <div class="mini">Simule votos chegando dos eleitores:</div>
        <div class="keys" id="ap-add" style="margin-top:8px">
          ${cands.map((c,i)=>`<button data-c="${i}">+ voto ${c.n}</button>`).join("")}
          <button data-c="b">+ BRANCO</button>
          <button data-c="n">+ NULO</button>
          <button data-c="r">aleatório x10</button>
        </div>
        <div id="ap-tab" style="margin-top:12px"></div>
        <div style="margin-top:10px"><button id="ap-gerar" class="pill good">Gerar BU</button></div>
      </div>
      <div>
        <h3 style="margin-top:0">Boletim de Urna (BU)</h3>
        <div id="ap-bu"></div>
      </div>
    </div>`;
  const tab=host.querySelector("#ap-tab");
  function renderTab(){
    const tot = cands.reduce((s,c)=>s+c.votos,0)+brancos+nulos;
    tab.innerHTML = `<table><thead><tr><th>Candidato</th><th class="num">Votos</th></tr></thead><tbody>
      ${cands.map(c=>`<tr><td>${c.n} ${c.nome} <span class="mini">${c.partido}</span></td><td class="num">${c.votos}</td></tr>`).join("")}
      <tr><td>Brancos</td><td class="num">${brancos}</td></tr>
      <tr><td>Nulos</td><td class="num">${nulos}</td></tr>
      <tr><td><b>Total</b></td><td class="num"><b>${tot}</b></td></tr></tbody></table>`;
  }
  function cv(){
    // código verificador ILUSTRATIVO (não é o algoritmo real do TSE)
    let acc = 7;
    cands.forEach(c=>acc=(acc*31 + c.votos*7 + c.n.length) % 999999);
    acc=(acc*31+brancos*3+nulos*5+tot())%999999;
    return String(acc).padStart(6,"0");
  }
  function tot(){return cands.reduce((s,c)=>s+c.votos,0)+brancos+nulos;}
  host.querySelector("#ap-add").addEventListener("click",e=>{
    const c=e.target.dataset.c; if(c==null) return;
    if(c==="b") brancos++;
    else if(c==="n") nulos++;
    else if(c==="r"){ for(let i=0;i<10;i++){const r=Math.random(); if(r<0.55)cands[0].votos++;else if(r<0.85)cands[1].votos++;else if(r<0.95)cands[2].votos++;else if(r<0.98)brancos++;else nulos++;} }
    else cands[+c].votos++;
    gerado=false; renderTab();
  });
  host.querySelector("#ap-gerar").onclick=()=>{
    gerado=true;
    const total=tot();
    const bu = `BOLETIM DE URNA — DOMÍNIO ILUSTRATIVO
------------------------------------
Município: 00001    Zona: 0001   Seção: 0001
Eleição: SIMULADA   Turno: 1
------------------------------------
${cands.map(c=>`Cargo: GOVERNADOR
  ${c.n.padStart(2,"0")} ${c.nome.padEnd(20)} ${String(c.votos).padStart(5,"0")}`).join("\n")}
  BRANCOS                    ${String(brancos).padStart(5,"0")}
  NULOS                      ${String(nulos).padStart(5,"0")}
------------------------------------
Comparecimento ......: ${String(total).padStart(5,"0")}
Código Verificador ..: ${cv()}
Hash (SHA) ..........: 9f2a${(total*7%9999).toString(16).padStart(3,"0")}e1
Assinatura (RSA-PSS).: [válida]
QRCode ..............: ▦▦▦ ▦ ▦▦ (dados do BU)
====================================`;
    host.querySelector("#ap-bu").innerHTML = `<pre class="code" style="max-height:none">${bu.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre>
      <div class="callout">O BU é <b>assinado</b> (RSA-PSS) e contém o <b>código verificador</b>; a <b>mídia de resultado (MR)</b> é retirada ao final.</div>`;
  };
  renderTab();
};

// ---------------- 3. Simulador do mesário ----------------
SIM.mesario = function(host){
  const LIMITE=5;
  let mesarios=[]; // {titulo, dedo}
  let compareceram=[]; // titulos
  let eleitoresBase = {"123456789012":{nome:"MARIA SILVA", nasc:"1980"}, "987654321098":{nome:"JOÃO SOUZA", nasc:"1990"}, "111222333444":{nome:"ANA LIMA",nasc:"1975"}};
  let justificativas=[];

  host.innerHTML = `
    <div class="tabsbar" id="me-tabs">
      <button class="pill on" data-t="registro">1) Registrar mesários</button>
      <button class="pill" data-t="habilita">2) Habilitar eleitor</button>
      <button class="pill" data-t="justifica">3) Justificativa</button>
    </div>
    <div id="me-body"></div>`;
  const body=host.querySelector("#me-body");
  let tab="registro";

  function regView(){
    body.innerHTML=`
      <div class="grid2">
        <div class="sim">
          <h3 style="margin-top:0">Registro de mesários</h3>
          <div class="mini">Fonte: <code>comparecimentomesario/estados/cregistrarmesarios.cpp</code></div>
          <div class="toolbar" style="margin-top:10px">
            <input type="text" id="me-tit" placeholder="título do mesário (12 díg.)">
            <select id="me-dedo">${["polegar","indicador","médio","anular","mínimo"].map(d=>`<option>${d}</option>`).join("")}</select>
            <button id="me-add" class="pill good">Ler digital e registrar</button>
          </div>
          <div id="me-msg"></div>
          <div id="me-list" style="margin-top:10px"></div>
        </div>
        <div><h3 style="margin-top:0">Informativo</h3>
          <div class="callout">Limite de mesários registrados: <b>${LIMITE}</b>. Ao atingir, a urna exibe
            <code>CLimiteMesariosRegistradosAtingido</code> e pede confirmação para encerrar o ciclo
            (<code>CConfirmaFimRegistroMesarios</code>).</div>
          <div class="callout warn">A biometria coletada precisa pertencer ao mesário
            (<code>"Biometria coletada não é do mesário"</code>); caso contrário, é rejeitada.</div>
        </div>
      </div>`;
    const list=body.querySelector("#me-list");
    function render(){
      list.innerHTML = mesarios.length? `<table><thead><tr><th>#</th><th>Título</th><th>Dedo</th></tr></thead><tbody>
        ${mesarios.map((m,i)=>`<tr><td>${i+1}</td><td class="mono">${m.titulo}</td><td>${m.dedo}</td></tr>`).join("")}</tbody></table>`
        : `<div class="mini">Nenhum mesário registrado.</div>`;
    }
    render();
    body.querySelector("#me-add").onclick=()=>{
      const t=body.querySelector("#me-tit").value.trim();
      const d=body.querySelector("#me-dedo").value;
      const msg=body.querySelector("#me-msg");
      if(!/^\d{12}$/.test(t)){ msg.innerHTML=`<div class="callout warn">Título inválido (<code>CTituloMesarioInvalido</code>): informe 12 dígitos.</div>`; return; }
      if(mesarios.some(m=>m.titulo===t)){ msg.innerHTML=`<div class="callout warn">Este título já foi registrado (<code>CTituloMesarioJaRegistrado</code>).</div>`; return; }
      mesarios.push({titulo:t,dedo:d});
      msg.innerHTML = mesarios.length>=LIMITE
        ? `<div class="callout ok">Mesário registrado. <b>Limite de ${LIMITE} atingido</b> — confirme o fim do registro.</div>`
        : `<div class="callout ok">Mesário registrado com sucesso.</div>`;
      render();
    };
  }

  function habilitaView(){
    body.innerHTML=`
      <div class="grid2">
        <div class="sim">
          <h3 style="margin-top:0">Habilitação do eleitor</h3>
          <div class="mini">Fonte: <code>app/vota/operador/{leidentidade,confirmaidentidade}</code></div>
          <div class="toolbar" style="margin-top:10px">
            <input type="text" id="he-tit" placeholder="título do eleitor">
            <button id="he-buscar" class="pill">Buscar</button>
          </div>
          <div id="he-out" class="screen" style="margin-top:10px"></div>
          <div class="keys" id="he-keys"></div>
        </div>
        <div><h3 style="margin-top:0">Comparecimento</h3><div id="he-comp"></div>
          <div class="callout">Tabela <code>comparecimento_mesario</code>: título, período, seção, estado biometria, dedo, data/hora.</div>
        </div>
      </div>`;
    const out=body.querySelector("#he-out"), keys=body.querySelector("#he-keys"), comp=body.querySelector("#he-comp");
    function state(html){ out.innerHTML=html; }
    function renderComp(){
      comp.innerHTML = compareceram.length? `<table><thead><tr><th>Título</th><th>Nome</th></tr></thead><tbody>
        ${compareceram.map(t=>`<tr><td class="mono">${t}</td><td>${eleitoresBase[t].nome}</td></tr>`).join("")}</tbody></table>
        <div class="mini">Total: ${compareceram.length}</div>` : `<div class="mini">Nenhum eleitor habilitado.</div>`;
    }
    renderComp();
    let found=null;
    body.querySelector("#he-buscar").onclick=()=>{
      const t=body.querySelector("#he-tit").value.trim();
      if(!eleitoresBase[t]){ state(`<div class="big">ELEITOR NÃO ENCONTRADO</div><div class="mini">CPedeIdentidade: verifique o título.</div>`); keys.innerHTML=""; return; }
      found=t;
      state(`<div class="mini">Eleitor reconhecido (CEleitorEncontrado)</div><div class="big">${eleitoresBase[t].nome}</div>
        <div class="mini">Aguardando biometria (CPedeDigital)</div>`);
      keys.innerHTML = `<button class="pill good" data-k="bio">LER DIGITAL</button>
        <button class="pill" data-k="nao">digital não reconhecida</button>`;
    };
    keys.onclick=e=>{
      const k=e.target.dataset.k; if(!k||!found) return;
      if(k==="bio"||k==="nao"){
        if(k==="nao"){
          state(`<div class="big" style="color:#ff9aa2">DIGITAL NÃO RECONHECIDA</div>
            <div class="mini">CDigitalNaoReconhecida — mesário decide:</div>`);
          keys.innerHTML=`<button data-k="rep">Repetir leitura</button>
            <button data-k="just">Justificar</button>
            <button data-k="sus">Suspender eleitor</button>`;
          return;
        }
        // reconhecida
        compareceram.push(found);
        state(`<div class="big">${eleitoresBase[found].nome}</div><div style="margin-top:6px">HABILITADO PARA VOTAR</div>
          <div class="mini">CMostraEleitorVotando → a urna libera a votação.</div>`);
        keys.innerHTML=`<button class="pill" data-k="next">Próximo eleitor</button>`;
        renderComp();
      } else if(k==="rep"){ keys.innerHTML=`<button class="pill good" data-k="bio">LER DIGITAL</button><button class="pill" data-k="nao">não reconhecida</button>`; state(`<div class="mini">Repetindo leitura… CPedeDigital</div>`); }
      else if(k==="just"){ state(`<div class="mini">Fluxo de justificativa (IIniciaJustificativa / IConfirmaJustificativa).</div>`); keys.innerHTML=`<button class="pill" data-k="next">Concluir justificativa</button>`; }
      else if(k==="sus"){ state(`<div class="mini">CSuspensaoAutomaticaEleitor: eleitor suspenso pelo mesário.</div>`); keys.innerHTML=`<button class="pill" data-k="next">Próximo eleitor</button>`; }
      else if(k==="next"){ body.querySelector("#he-tit").value=""; found=null; state(`<div class="mini">Aguardando próximo eleitor…</div>`); keys.innerHTML=""; }
    };
  }

  function justificaView(){
    body.innerHTML=`
      <div class="grid2">
        <div class="sim">
          <h3 style="margin-top:0">Justificativa / Voto em trânsito</h3>
          <div class="mini">Fonte: <code>app/comum/justificativa</code>, <code>app/vota/operador/justificativa</code></div>
          <div class="toolbar" style="margin-top:10px">
            <input type="text" id="ju-tit" placeholder="título do eleitor">
            <button id="ju-add" class="pill good">Registrar justificativa</button>
          </div>
          <div id="ju-msg"></div>
          <div id="ju-list" style="margin-top:10px"></div>
        </div>
        <div><h3 style="margin-top:0">Regras</h3>
          <div class="callout">Tabela <code>registro_justificativa</code> (título + ano de nascimento), UNIQUE por título.</div>
          <div class="callout warn">Não é permitido justificar com CPF quando o tipo de identificador exigido não permite.</div>
          <div class="callout">Gera <b>Boletim de Justificativa Eleitoral</b> ao final.</div>
        </div>
      </div>`;
    const list=body.querySelector("#ju-list");
    function render(){ list.innerHTML=justificativas.length?`<table><thead><tr><th>Título</th></tr></thead><tbody>
      ${justificativas.map(t=>`<tr><td class="mono">${t}</td></tr>`).join("")}</tbody></table>`:`<div class="mini">Nenhuma justificativa.</div>`; }
    render();
    body.querySelector("#ju-add").onclick=()=>{
      const t=body.querySelector("#ju-tit").value.trim(); const msg=body.querySelector("#ju-msg");
      if(!/^\d{12}$/.test(t)){ msg.innerHTML=`<div class="callout warn">Título inválido.</div>`; return; }
      if(justificativas.includes(t)){ msg.innerHTML=`<div class="callout warn">Já havia justificativa para o título (<code>"Já havia justificativa para o título"</code>).</div>`; return; }
      justificativas.push(t); msg.innerHTML=`<div class="callout ok">Justificativa registrada. Gera boletim ao final.</div>`; render();
    };
  }

  host.querySelector("#me-tabs").addEventListener("click",e=>{
    const t=e.target.dataset.t; if(!t) return; tab=t;
    host.querySelectorAll("#me-tabs .pill").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
    tab==="registro"?regView():tab==="habilita"?habilitaView():justificaView();
  });
  regView();
};
