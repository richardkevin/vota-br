"use strict";
// Infográficos SVG reutilizáveis (sem dependências).
// Cada função retorna uma <figure> com SVG + legenda.

const SVGNS = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" font-family="Menlo,Consolas,monospace">';

function escx(s){return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function box(x,y,w,h,fill,stroke,r=8){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;}
function txt(x,y,s,fill="#d5dde8",size=12,anchor="middle",weight="normal"){return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${escx(s)}</text>`;}
function arrow(x1,y1,x2,y2,stroke="#4aa8ff",dash=""){const m=`<defs><marker id="a${x1}${y1}${x2}${y2}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6" fill="${stroke}"/></marker></defs>`;
  return m+`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.6" ${dash?`stroke-dasharray="${dash}"`:""} marker-end="url(#a${x1}${y1}${x2}${y2})"/>`;}

function figure(title, w, h, body, cap){
  return `<figure class="fig"><figcaption style="color:#e7eef7;font-size:13px;font-weight:600">${escx(title)}</figcaption>
    ${SVGNS.replace("W",w).replace("H",h)}${body}</svg>
    ${cap?`<figcaption>${cap}</figcaption>`:""}</figure>`;
}

const FIG = {};

// 1. Arquitetura em camadas
FIG.layers = () => {
  const L = [
    ["Host / Glue Emscripten", "\"a\" · 136 imports · exports Cb..Yb", "#0d2438", "#1d5c8a"],
    ["Aplicação da urna", "app/vota · app/operador · estadoaplicacao", "#15210f", "#3f5b2a"],
    ["Comum & dados", "app/comum (comparecimento, justificativa, dados, asn)", "#221a0d", "#5c4318"],
    ["Framework api", "api/gui · api/io · api/hash · api/hwil · api/persistencia", "#1b1f2a", "#3a4560"],
    ["Infraestrutura", "ecourna/api: security · sql/sqlite · compression · asn", "#1b1f2a", "#3a4560"],
    ["Bibliotecas", "SQLite · OpenSSL · Boost · 7-Zip/LZMA · ASN1 · RHVoice · QR", "#241420", "#5c2f4a"],
  ];
  let b = ""; const x=40,w=820,y0=20,hh=42,gap=10;
  L.forEach(([t,s],i)=>{const y=y0+i*(hh+gap);
    b+=box(x,y,w,hh,L[i][2],L[i][3])+txt(x+16,y+18,t,"#e7eef7",13,"start","700")+txt(x+16,y+34,s,"#9fb0c4",11,"start");
    if(i<L.length-1) b+=arrow(x+w/2,y+hh,x+w/2,y+hh+gap,"#4aa8ff");});
  return figure("Arquitetura em camadas do TSE VOTA", 900, 20+L.length*(52)+10, b,
    "Fluxo de dependência: a aplicação usa a base comum, que usa o framework <code>api</code> e a infraestrutura.");
};

// 2. Ciclo de vida do mesário (registro)
FIG.mesarioRegistro = () => {
  const steps = [
    ["Iniciar", "Registrar mesários"], ["Pedir título", "CPedeTituloMesarioInicial"],
    ["Pedir digital", "CPedeDigitalMesario"], ["Reconhecer", "CRegistradorMesario"],
    ["Mesário registrado", "CMesarioRegistrado"], ["Limite?", "CLimiteMesarios…"],
    ["Confirma fim", "CConfirmaFim…"], ["Encerra", "CEncerra…"],
    ["Imprime", "CImprimirIdentificacao…"],
  ];
  let b=""; const w=140,h=54,y=70,x0=20,gapX=162;
  steps.forEach((s,i)=>{const x=x0+i%5*gapX; const yy=y+Math.floor(i/5)*110;
    b+=box(x,yy,w,h,"#15210f","#3f5b2a")+txt(x+w/2,yy+22,s[0],"#d7ffe3",12,"middle","700")+txt(x+w/2,yy+40,s[1],"#8fae8a",9.5);
    if(i%5<4 && i<steps.length-1) b+=arrow(x+w,yy+h/2,x+gapX,yy+h/2,"#7ee787");});
  b+=arrow(x0+4*gapX+w/2,y+h,x0+w/2,y+110,"#7ee787","4 3");
  return figure("Ciclo de vida — Registro de mesários", 900, 260, b,
    "Fonte: <code>app/comum/comparecimentomesario/estados/*.cpp</code>. O mesário registra os demais mesários por biometria.");
};

// 3. Habilitação do eleitor pelo mesário
FIG.mesarioHabilita = () => {
  const steps = [
    ["Pedir identidade", "CPedeIdentidade"], ["Eleitor encontrado", "CEleitorEncontrado"],
    ["Pedir digital", "CPedeDigital"], ["Controla reconhecimento", "CControlaReconhecimento"],
    ["Não reconhecida", "CDigitalNaoReconhecida", "#5c2f4a"],
    ["Reconhecida", "CDigitalReconhecida"], ["Nome do eleitor", "CNomeEleitor"],
    ["Habilitado p/ votar", "CMostraEleitorVotando", "#12331f"],
  ];
  let b=""; const w=175,h=52,x0=20,gapX=205,y=60;
  steps.forEach((s,i)=>{const x=x0+i%4*gapX,yy=y+Math.floor(i/4)*100;
    b+=box(x,yy,w,h,s[2]||"#15210f",s[2]?"#7a2a30":"#3f5b2a")+txt(x+w/2,yy+20,s[0],"#d7ffe3",11.5,"middle","700")+txt(x+w/2,yy+37,s[1],"#8fae8a",9.5);
    if(i%4<3&&i<steps.length-1)b+=arrow(x+w,yy+h/2,x+gapX,yy+h/2,"#7ee787");});
  b+=arrow(x0+3*gapX+w/2,y+h,x0+w/2,y+100,"#7ee787","4 3");
  return figure("Habilitação do eleitor pelo mesário (operador)", 900, 240, b,
    "Fonte: <code>app/vota/operador/{leidentidade,confirmaidentidade,aguardaeleitor}</code>. Decisões do mesário em caso de digital não reconhecida.");
};

// 4. Sessão de votação (eleitor)
FIG.votacao = () => {
  const steps = [
    ["Habilitar", "identidade+biometria"], ["Escolher cargo", "CTelasCargo"], ["Digitar nº", "teclado"],
    ["Votar", "candidato/legenda"], ["Confere", "CConfereVotoEmCargo"], ["Confirma", "CConfirmaVotoEmCargo"],
    ["Nulo/Branco", "CPedeNulo"], ["Próximo cargo", "CCompletaProporcional"], ["FIM", "CFimVotoEleitor"],
  ];
  let b=""; const w=140,h=54,x0=20,gapX=162,y=70;
  steps.forEach((s,i)=>{const x=x0+i%5*gapX,yy=y+Math.floor(i/5)*110;
    b+=box(x,yy,w,h,"#15210f","#3f5b2a")+txt(x+w/2,yy+22,s[0],"#d7ffe3",12,"middle","700")+txt(x+w/2,yy+40,s[1],"#8fae8a",9.5);
    if(i%5<4&&i<steps.length-1)b+=arrow(x+w,yy+h/2,x+gapX,yy+h/2,"#7ee787");});
  b+=arrow(x0+4*gapX+w/2,y+h,x0+w/2,y+110,"#7ee787","4 3");
  return figure("Sessão de votação (eleitor)", 900, 260, b,
    "Fonte: <code>app/vota/eleitor/{iniciovotacao,votamajoritario,votaproporcional,fimvotacao}</code>.");
};

// 5. Pipeline de apuração / BU
FIG.apuracao = () => {
  const stages = [
    ["Zeresima", "impressão inicial", "#221a0d"],
    ["Registro do voto", "RDV (ModuloRegistroDigitalVoto)", "#15210f"],
    ["Gera BU", "CGeraBU (+CGeradorBUQRCode)", "#15210f"],
    ["Hash + Assinatura", "api/hash · RSA-PSS", "#0d2438"],
    ["Código Verificador", "CCalculaCV", "#0d2438"],
    ["QRCode BU", "CMostraQRCodeBU", "#15210f"],
    ["Imprime BU", "CImprimindoBU", "#15210f"],
    ["Grava resultado", "CGravaResultado", "#15210f"],
    ["Copia p/ MR", "CCopiaResultadoParaMR", "#15210f"],
    ["Retira MR", "CRetirarMR", "#5c2f4a"],
  ];
  let b=""; const w=150,h=64,x0=20,y0=30,gapY=78;
  stages.forEach((s,i)=>{const y=y0+i*gapY; const x=60+ (i%2? 380:0);
    b+=box(x,y,w,h,s[2],"#3a4560")+txt(x+w/2,y+26,s[0],"#e7eef7",12,"middle","700")+txt(x+w/2,y+45,s[1],"#9fb0c4",9.5);
    if(i<stages.length-1){const nx=60+((i+1)%2?380:0);const ny=y0+(i+1)*gapY;
      b+=arrow(x+w/2,y+h,nx+w/2,ny,"#4aa8ff");}});
  return figure("Pipeline de apuração e emissão do Boletim de Urna (BU)", 620, 30+stages.length*gapY, b,
    "Cada cargo/eleição gera um BU assinado e com código verificador; a mídia de resultado (MR) é retirada ao final.");
};

// 6. Modelo de dados
FIG.dados = () => {
  let b="";
  b+=box(30,30,230,90,"#0d2438","#1d5c8a")+txt(145,52,"comparecimento_mesario","#8fc7ff",12,"middle","700")
    +txt(45,72,"numero_titulo (PK)", "#9fb0c4",10,"start")+txt(45,88,"tipo_identificador", "#9fb0c4",10,"start")
    +txt(45,104,"periodo_presente", "#9fb0c4",10,"start");
  b+=box(30,150,230,70,"#0d2438","#1d5c8a")+txt(145,172,"registro_justificativa","#8fc7ff",12,"middle","700")
    +txt(45,192,"numero_titulo (PK)","#9fb0c4",10,"start")+txt(45,208,"ano_nascimento","#9fb0c4",10,"start");
  b+=box(340,30,250,90,"#15210f","#3f5b2a")+txt(465,52,"Arquivos ASN.1","#d7ffe3",12,"middle","700")
    +txt(355,72,"ModuloBoletimUrna (BU)","#8fae8a",10,"start")+txt(355,88,"ModuloRegistroDigitalVoto","#8fae8a",10,"start")
    +txt(355,104,"ModuloResultadoUrnaCadastro","#8fae8a",10,"start");
  b+=box(340,150,250,70,"#221a0d","#5c4318")+txt(465,172,"Cripto (security)","#ffd479",12,"middle","700")
    +txt(355,192,"AES · HKDF · SipHash","#c8b98a",10,"start")+txt(355,208,"RSA-PSS (assinatura)","#c8b98a",10,"start");
  b+=arrow(260,75,340,75,"#4aa8ff")+arrow(260,185,340,185,"#4aa8ff");
  return figure("Modelo de dados", 620, 250, b,
    "Persistência híbrida: SQLite para registros de mesário/justificativa; arquivos ASN.1 para o restante do estado.");
};

// 7. Máquina de estados geral
FIG.estados = () => {
  const seq = ["CInicioDeCiclo","CVerificaEleicaoPassou","CVerificaHorarioZeresima","CImprimindoZeresima",
    "CAguardaEleitoresVotarem","(habilitação / votação)","CAguardaEleitoresVotarem",
    "CEncerramento","CGeraBU","CGravaResultado","CRetirarMR"];
  let b=""; const w=150,h=48,x0=20,gapY=60;
  seq.forEach((s,i)=>{const y=20+i*gapY;
    b+=box(x0,y,w,h,"#15210f","#3f5b2a")+txt(x0+w/2,y+29,s,"#d7ffe3",11);
    if(i<seq.length-1)b+=arrow(x0+w/2,y+h,x0+w/2,y+gapY,"#7ee787");});
  b+=box(340,20+4*gapY,240,48,"#0d2438","#1d5c8a")+txt(460,20+4*gapY+29,"loop por eleitor","#8fc7ff",11);
  b+=box(340,20+5*gapY,240,60,"#0d2438","#1d5c8a")+txt(460,20+5*gapY+22,"CPedeDigital","#8fc7ff",10)+txt(460,20+5*gapY+38,"CControlaReconhecimento","#8fc7ff",10);
  b+=arrow(x0+w,20+4*gapY+24,340,20+4*gapY+24,"#4aa8ff")+arrow(340,20+5*gapY+30,x0+w,20+5*gapY+30,"#4aa8ff");
  return figure("Máquina de estados da votação", 620, 20+seq.length*gapY, b,
    "Estados como classes em <code>app/vota</code>; loop de habilitação/votação por eleitor entre dois estados-âncora.");
};

// 8. Cadeia de confiança / segurança
FIG.seguranca = () => {
  const nodes = [
    ["Cerimônia de carga", "pacote assinado (PKI)", "#221a0d"],
    ["Urna valida assinatura", "X509 · CRL/OCSP (OpenSSL)", "#0d2438"],
    ["Ambiente de votação", "software isolado + lacre físico", "#15210f"],
    ["RDV / BU", "hash (SHA) + assinatura RSA-PSS + CV", "#15210f"],
    ["QRCode do BU", "CMostraQRCodeBU", "#15210f"],
    ["SAVD / totalização", "revalida assinaturas dos arquivos", "#0d2438"],
  ];
  let b=""; const w=250,h=54,x0=30,y0=30,gapY=74;
  nodes.forEach((s,i)=>{const y=y0+i*gapY;
    b+=box(x0,y,w,h,s[2],"#3a4560")+txt(x0+w/2,y+24,s[0],"#e7eef7",12,"middle","700")+txt(x0+w/2,y+41,s[1],"#9fb0c4",9.5);
    if(i<nodes.length-1)b+=arrow(x0+w/2,y+h,x0+w/2,y+gapY,"#4aa8ff");});
  // ramo de falha
  b+=box(x0+w+40,y0,240,54,"#3f1518","#7a2a30")+txt(x0+w+160,y0+24,"Assinatura inválida","#ff9aa2",12,"middle","700")
    +txt(x0+w+160,y0+41,"pacote/arquivo rejeitado","#d79a9a",9.5);
  return figure("Cadeia de confiança e integridade", 600, 30+nodes.length*gapY, b,
    "Controles observados no binário: validação de assinatura da carga, hash dos arquivos, assinatura RSA-PSS do BU/RDV e revalidação no SAVD.");
};

// 9. Cadeia de assinatura SAVD / HSM
FIG.savd = () => {
  let b=""; const w=180,h=52,x0=20,y=60,gap=205;
  const s=[["Urna (UE)","AssinarUE"],["Ecourna","AssinarEcourna"],["HSM","EnviarAcaoHSM"],["SAVD","ValidarUE"],["Totalização","revalida"]];
  s.forEach(([a,c],i)=>{const x=x0+i%5*gap; b+=box(x,y,w,h,"#0d2438","#1d5c8a")+txt(x+w/2,y+22,a,"#8fc7ff",12,"middle","700")+txt(x+w/2,y+39,c,"#9fb0c4",9.5);
    if(i<4)b+=arrow(x+w,y+h/2,x+gap,y+h/2,"#4aa8ff");});
  return figure("Cadeia de assinatura e validação (SAVD / HSM)", 900, 150, b,
    "Funções observadas: AssinarUE, AssinarEcourna, ValidarUE, EnviarAcaoHSM, IInterfaceSavd::DesconverteHeader/DesconverteMensagem.");
};

// 10. Matriz de risco (qualitativa)
FIG.risco = () => {
  const W=560,H=360,ox=60,oy=310,side=250;
  let b=box(ox,oy-side,side,side,"#0b0f14","#2a3341");
  b+=txt(ox+side/2,oy+28,"Probabilidade →","#8b98a9",11);
  b+=`<text x="18" y="${oy-side/2}" fill="#8b98a9" font-size="11" transform="rotate(-90 18 ${oy-side/2})" text-anchor="middle">Impacto →</text>`;
  // quadrantes
  b+=`<rect x="${ox+side/2}" y="${oy-side}" width="${side/2}" height="${side/2}" fill="#3f1518" opacity="0.25"/>`;
  b+=txt(ox+side*0.75,oy-side+18,"crítico","#ff9aa2",10);
  b+=txt(ox+side*0.25,oy-18,"monitorar","#8b98a9",10);
  const pts=[["F6 RNG",0.15,0.9],["F8 assinatura",0.2,0.85],["F1 demo",0.32,0.8],
    ["F3 MR",0.35,0.78],["F2 debug",0.3,0.68],["F5 cripto legado",0.16,0.7],
    ["F7 desabilitar",0.28,0.6],["F4 parsing",0.55,0.62]];
  pts.forEach(([l,p,i])=>{const x=ox+p*side,y=oy-i*side;
    b+=`<circle cx="${x}" cy="${y}" r="6" fill="#ffab70" stroke="#7a4a18"/>`+txt(x+10,y+4,l,"#e7eef7",9.5,"start");});
  return figure("Matriz de risco (avaliação qualitativa preliminar)", 560, 380, b,
    "Posições ilustrativas, para priorização de revisão. Não representam explorações confirmadas.");
};

// 11. O que é gravado e enviado ao TSE
FIG.transmissao = () => {
  const W=920,H=430;
  let b="";
  // coluna 1: gravado na urna
  b+=txt(150,20,"GRAVADO NA URNA","#7ee787",12,"middle","700");
  const st=[["rdv.dat / rdvred.dat","votos (nominal/legenda/nulo/branco) + hash+assinatura por votável"],
    ["bur.dat / imgbu.dat","Boletim de Urna (totais por cargo) + imagem"],
    ["rze.dat / imgze.dat","Zerésima (+ imagem)"],
    ["ResultadoUrnaCadastro (ASN.1)","comparecimento, mesários, justificativa, biometria/foto"],
    ["hashes / logd / serialv","hashes de arquivos, log, serial"]];
  st.forEach(([a,c],i)=>{const y=40+i*74; b+=box(20,y,260,62,"#15210f","#3f5b2a")
    +txt(150,y+20,a,"#d7ffe3",11,"middle","700")
    +`<foreignObject x="30" y="${y+24}" width="240" height="36"><div xmlns="http://www.w3.org/1999/xhtml" style="font:9.5px monospace;color:#8fae8a;text-align:center">${c}</div></foreignObject>`;});
  // coluna 2: assinatura
  b+=txt(460,20,"ASSINATURA (HSM/SAVD)","#8fc7ff",12,"middle","700");
  [["AssinarUE / AssinarEcourna","package UE assinado"],["ValidarUE","verifica assinatura da carga"],
   ["EnviarAcaoHSM","operações no HSM"],["CGravadorHashes / CAssinaVotavelBU","hash+assinatura por votável"]]
   .forEach(([a,c],i)=>{const y=55+i*84; b+=box(330,y,260,60,"#0d2438","#1d5c8a")
    +txt(460,y+24,a,"#8fc7ff",10.5,"middle","700")+txt(460,y+42,c,"#9fb0c4",9.5);});
  // coluna 3: enviado ao TSE
  b+=txt(760,20,"ENVIADO AO TSE (SAVD)","#ffd479",12,"middle","700");
  const pk=[["pacoteSolicitacaoResultadoUrnaCadastro","+ resposta"],["pacoteProcessamentoResultadoUrnaCadastro","+ resposta"],
    ["pacoteResultadoTotalizacao","totalização"],["pacoteConsolidadoEleicao","consolidação"],["pacoteConsolidadoSituacoesEleicoes","situações"]];
  pk.forEach(([a,c],i)=>{const y=40+i*74; b+=box(630,y,270,62,"#221a0d","#5c4318")
    +txt(765,y+22,a,"#ffd479",9.5,"middle","700")+txt(765,y+40,c,"#c8b98a",9.5);});
  // flechas
  b+=arrow(280,H/2-40,330,H/2-40,"#7ee787")+arrow(590,H/2-40,630,H/2-40,"#4aa8ff");
  return figure("O que é gravado e o que é transmitido ao TSE", W, H, b,
    "Os votos ficam no RDV; o BU carrega os totais assinados; o ResultadoUrnaCadastro empacota comparecimento/justificativa. A transmissão usa os pacotes do protocolo SAVD, com assinatura via HSM.");
};

// 12. Modelo de auditoria com preservação de sigilo
FIG.auditoria = () => {
  const W=920,H=470; let b="";
  b+=txt(210,20,"CAMADA CONFIDENCIAL (sigilo)","#ff9aa2",12,"middle","700");
  b+=txt(720,20,"CAMADA PÚBLICA (auditável)","#7ee787",12,"middle","700");
  const conf=[["Voto ↔ eleitor (RDV + comparecimento)","acesso restrito / limiar"],
    ["Biometria e foto","DadosComparecimentoCifrado"],
    ["Chaves privadas","HSM (EnviarAcaoHSM)"]];
  conf.forEach(([a,c],i)=>{const y=45+i*90; b+=box(30,y,360,66,"#3f1518","#7a2a30")
    +txt(210,y+26,a,"#ff9aa2",11,"middle","700")+txt(210,y+44,c,"#d79a9a",9.5);});
  const pub=[["Software + carga (hash/assinatura)","qualquer um verifica"],
    ["BU, zerésima, CV, totais","públicos por natureza"],
    ["Raízes de hash (Merkle) + assinaturas","verificáveis com chave pública"],
    ["Log de transparência (append-only)","detecta omissão/forja"]];
  pub.forEach(([a,c],i)=>{const y=45+i*90; b+=box(530,y,360,66,"#12331f","#3f5b2a")
    +txt(710,y+26,a,"#7ee787",11,"middle","700")+txt(710,y+44,c,"#8fae8a",9.5);});
  // meio: compromissos
  b+=box(400,45,110,66+2*90,"#0d2438","#1d5c8a");
  b+=`<text x="455" y="150" fill="#8fc7ff" font-size="11" text-anchor="middle" transform="rotate(-90 455 150)">compromissos (hash) + provas ZK</text>`;
  b+=arrow(390,H/2-30,530,H/2-30,"#4aa8ff")+arrow(530,H/2+30,390,H/2+30,"#4aa8ff");
  b+=txt(460,H-30,"Auditar a camada pública valida o compromisso sem revelar o dado confidencial","#9fb0c4",10.5);
  return figure("Auditoria sem vazamento de informação confidencial", W, H, b,
    "Separação em duas camadas + compromissos criptográficos: verifica-se integridade e corretude sem expor voto-eleitor, biometria ou chaves.");
};
