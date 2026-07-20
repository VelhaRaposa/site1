/* =========================================================
   BITCOIN-SPIRAL.JS — "Bitcoin Spiral"
   =========================================================
   100% LOCAL — nenhuma chamada de rede além do fetch do histórico local
   (assets/data/btc-history-usd.json, mesmo dataset que já alimenta as
   outras ferramentas). Sem Chart.js: canvas desenhado à mão, porque um
   polar-log-espiral de múltiplas voltas não é um tipo de gráfico nativo
   da lib já usada no site.

   GEOMETRIA (validada em rodadas de mockup — ver histórico do PR):
   - ângulo = posição no ciclo (tempo ou blocos, conforme o modo)
   - raio   = log10(preço), piso em $1 (não em $0,05) — abaixo de $1
     tudo colapsa pro centro, igual à referência que inspirou o formato
   - a linha é uma função contínua sobre a série real inteira — o
     afastamento "espiral pra fora" a cada volta é 100% consequência do
     preço subir a cada ciclo, não um deslocamento artificial por volta

   MODO TEMPO: 1 volta = 4 anos corridos, ancorados em 2009 (bloco
   gênese) — 2009/13/17/21/25 caem exatamente no topo do círculo. Um
   halving não cai numa fração "redonda" porque não acontece em 1º de
   janeiro — é esperado que o marcador "escorregue" um pouco a cada volta.

   MODO BLOCOS: 1 volta = exatamente 210.000 blocos. Halvings caem
   sempre no mesmo ângulo — é a própria definição da volta. Como o
   dataset de preço não tem altura de bloco por dia, a conversão
   data → bloco é interpolação linear entre os 4 halvings canônicos
   (blocos exatos, sem ambiguidade — mesma fonte de assets/js/halvings.js)
   e extrapolação a ~144 blocos/dia (10 min/bloco) depois do halving
   mais recente. É uma estimativa assumida, não um dado congelado.

   TOPOS/FUNDOS: a ferramenta não interpreta mercado, só marca eventos.
   Os topos e os fundos de eras já fechadas são os mesmos marcos
   canônicos usados em CICLOS (assets/js/comparador-ciclos.js) — mesma
   fonte, sem duplicar metodologia. O fundo da era EM ABERTO (depois do
   último topo confirmado) é calculado ao vivo como "menor preço desde
   esse topo": não existe categoria/cor/formato "provisório" — se
   amanhã o preço cair mais, o ponto se move sozinho.
   ========================================================= */

const HISTORICO_URL = "/assets/data/btc-history-usd.json";

// mesmos marcos canônicos de CICLOS (comparador-ciclos.js) — só topo e
// fundo, sem a metadata de cor/id que não se aplica aqui
const TOPOS = [
  { data: "2013-12-05", preco: 1137 },
  { data: "2017-12-17", preco: 19783 },
  { data: "2021-11-10", preco: 68789 },
  { data: "2025-10-06", preco: 126296 },
];
const FUNDOS_FECHADOS = [
  { data: "2011-11-22", preco: 2.30 },
  { data: "2015-01-14", preco: 152 },
  { data: "2018-12-07", preco: 3122 },
  { data: "2022-11-21", preco: 15476 },
];

const R_FLOOR = 1, R_CEIL = 1000000; // escala log do raio: $1 a $1M
const MS_DIA = 86400000;

function parseT(s) { return Date.parse(s + "T00:00:00Z"); }

// HALVINGS vem de assets/js/halvings.js, carregado antes deste arquivo
const BLOCK_ANCHORS = [
  { t: parseT("2009-01-03"), b: 0 },
  ...HALVINGS.map(h => ({ t: parseT(h.data), b: h.bloco })),
];

// altura de bloco estimada numa data — interpolação linear entre
// halvings canônicos, extrapolação a 144 blocos/dia depois do último
function blocoNaData(dateStr) {
  const t = parseT(dateStr);
  const last = BLOCK_ANCHORS[BLOCK_ANCHORS.length - 1];
  if (t >= last.t) return last.b + ((t - last.t) / MS_DIA) * 144;
  for (let i = 0; i < BLOCK_ANCHORS.length - 1; i++) {
    const a = BLOCK_ANCHORS[i], b = BLOCK_ANCHORS[i + 1];
    if (t >= a.t && t <= b.t) return a.b + ((t - a.t) / (b.t - a.t)) * (b.b - a.b);
  }
  return 0;
}

// fração da volta (0..1) — modo Tempo: ancorado em 2009, quadrante =
// (ano-2009) mod 4, fração do ano corrente soma o resto
function fracVoltaTempo(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const year = d.getUTCFullYear();
  const startY = Date.UTC(year, 0, 1), startNextY = Date.UTC(year + 1, 0, 1);
  const fracAno = (d.getTime() - startY) / (startNextY - startY);
  const quadrante = ((year - 2009) % 4 + 4) % 4;
  return (quadrante + fracAno) / 4;
}
function fracVoltaBlocos(dateStr) { return (blocoNaData(dateStr) / 210000) % 1; }
function fracVolta(dateStr, modo) { return modo === "tempo" ? fracVoltaTempo(dateStr) : fracVoltaBlocos(dateStr); }

function raioNorm(preco) {
  const p = Math.min(R_CEIL, Math.max(R_FLOOR, preco));
  return (Math.log10(p) - Math.log10(R_FLOOR)) / (Math.log10(R_CEIL) - Math.log10(R_FLOOR));
}
// rInt sempre 0 — centro = exatamente $1, a linha nasce da origem
function ptoXY(cx, cy, rExt, frac, preco) {
  const angle = frac * Math.PI * 2 - Math.PI / 2;
  const r = raioNorm(preco) * rExt;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

// fundo da era em aberto: menor preço real desde o último topo
// confirmado — recalculado sempre que o histórico é recarregado
function fundoEraAberta(serie) {
  const ultimoTopo = TOPOS[TOPOS.length - 1].data;
  let min = null;
  for (const [data, preco] of serie) {
    if (data > ultimoTopo && (min === null || preco < min.preco)) min = { data, preco };
  }
  return min;
}

async function carregarHistorico() {
  const res = await fetch(HISTORICO_URL);
  const dados = await res.json();
  return dados.filter(d => d.price > 0).map(d => [d.date, d.price]);
}

const state = { modo: "tempo" };
let btcSerie = null;
let fundos = null;
let canvasEl = null;
let pointCache = [];

function desenhar() {
  const rect = canvasEl.getBoundingClientRect();
  const W = Math.max(1, Math.round(rect.width)), H = Math.max(1, Math.round(rect.height));
  if (canvasEl.width !== W || canvasEl.height !== H) {
    canvasEl.width = W;
    canvasEl.height = H;
  }
  const ctx = canvasEl.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const rExt = Math.min(W, H) / 2 - Math.max(26, W * 0.05);
  const modo = state.modo;

  // vinheta radial sutilíssima — só profundidade de fundo, não informação
  const vign = ctx.createRadialGradient(cx, cy, 0, cx, cy, rExt + 30);
  vign.addColorStop(0, "rgba(255,255,255,0.02)");
  vign.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, W, H);

  // grade — só as décadas acima do piso: $1 não ganha anel próprio (é o
  // próprio centro), o primeiro anel visível é $10
  const decadas = [1, 10, 100, 1000, 10000, 100000, 1000000].filter(v => v > R_FLOOR);
  const corGrade = "rgba(74,89,118,0.8)";
  const corGradeForte = "rgba(74,89,118,1)";
  ctx.strokeStyle = corGrade;
  ctx.lineWidth = 1;
  decadas.forEach(v => {
    const r = raioNorm(v) * rExt;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  });

  // só a grade principal (4 marcações/volta) — sem subdivisões
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const rTickOut = rExt + 12, rTickIn = rExt - 4;
    ctx.strokeStyle = corGradeForte;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * rTickIn, cy + Math.sin(ang) * rTickIn);
    ctx.lineTo(cx + Math.cos(ang) * rTickOut, cy + Math.sin(ang) * rTickOut);
    ctx.stroke();
  }
  // cruz principal (0/90/180/270)
  ctx.strokeStyle = corGrade;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - rExt - 10, cy); ctx.lineTo(cx + rExt + 10, cy);
  ctx.moveTo(cx, cy - rExt - 10); ctx.lineTo(cx, cy + rExt + 10);
  ctx.stroke();
  // raios intermediários (45/135/225/315) — completam os 8 setores,
  // do limite externo até o centro, igual à cruz principal acima,
  // só que sem rótulo (apenas grade, como pedido)
  ctx.strokeStyle = corGrade;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - (rExt + 10) * Math.SQRT1_2, cy - (rExt + 10) * Math.SQRT1_2);
  ctx.lineTo(cx + (rExt + 10) * Math.SQRT1_2, cy + (rExt + 10) * Math.SQRT1_2);
  ctx.moveTo(cx - (rExt + 10) * Math.SQRT1_2, cy + (rExt + 10) * Math.SQRT1_2);
  ctx.lineTo(cx + (rExt + 10) * Math.SQRT1_2, cy - (rExt + 10) * Math.SQRT1_2);
  ctx.stroke();

  // rótulos — escala de preço com um pouco mais de contraste (decidido
  // na rodada final), rótulos angulares (ano/bloco) mais recuados
  const fontSize = Math.max(8, W * 0.0105);
  ctx.font = "600 " + (fontSize * 1.08) + "px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(164,173,196,0.62)";
  decadas.forEach(v => {
    const r = raioNorm(v) * rExt;
    const label = v >= 1000000 ? "$1M" : v >= 1000 ? ("$" + (v / 1000) + "k") : ("$" + v);
    ctx.fillText(label, cx + 4, cy - r - 2);
  });
  // modo Tempo: cada quadrante lista os anos das 5 voltas que caem
  // nele — só o topo usa o ano por extenso, os outros três já
  // começam abreviados.
  //
  // modo Blocos: uma volta completa = 1 halving = 210.000 blocos, e
  // o círculo já tem 8 raios desenhados (4 cardeais + 4 diagonais).
  // Cada um dos 8 raios recebe seu valor individual (210k/8=26.25k
  // por raio) — sem agrupar, sem "Halving N" (os pontos verdes já
  // marcam isso). Só o raio do topo é especial: como ele também é o
  // início de cada volta, lista os múltiplos de 210k das voltas
  // desenhadas, igual ao rótulo do topo no modo Tempo.
  const yearLabels = modo === "tempo"
    ? ["2009, '13, '17, '21, '25", "'10, '14, '18, '22, '26", "'11, '15, '19, '23, '27", "'12, '16, '20, '24, '28"]
    : ["0 · 210k · 420k · 630k · 840k blocos", "52.5k", "105k", "157.5k"];
  posicionarSistemaVisual(yearLabels, modo, cx, cy, rExt);

  // linha principal — traço ponto a ponto, dado real, sem suavização.
  // Espessura final validada: base × 1,7.
  const lineWBase = Math.max(3.8, W * 0.0064);
  const lineW = lineWBase * 1.7;
  const xy = [];
  pointCache = [];
  for (let i = 0; i < btcSerie.length; i++) {
    const [data, preco] = btcSerie[i];
    const p = ptoXY(cx, cy, rExt, fracVolta(data, modo), preco);
    xy.push(p);
    pointCache.push({ x: p.x, y: p.y, data, preco, bloco: Math.round(blocoNaData(data)) });
  }
  ctx.strokeStyle = "#F7931A";
  ctx.lineWidth = lineW;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(xy[0].x, xy[0].y);
  for (let i = 1; i < xy.length; i++) ctx.lineTo(xy[i].x, xy[i].y);
  ctx.stroke();

  // topos/fundos/halvings — círculo sólido, sem contorno
  function marcador(dateStr, preco, cor, raio) {
    const p = ptoXY(cx, cy, rExt, fracVolta(dateStr, modo), preco);
    ctx.beginPath(); ctx.arc(p.x, p.y, raio, 0, Math.PI * 2);
    ctx.fillStyle = cor; ctx.fill();
  }
  const raioMarcador = lineWBase * 1.15 * 1.25;
  HALVINGS.forEach(h => marcador(h.data, h.preco, "#4CAF7D", raioMarcador));
  fundos.forEach(f => marcador(f.data, f.preco, "#FF5A5F", raioMarcador));
  TOPOS.forEach(t => marcador(t.data, t.preco, "#4DA3FF", raioMarcador));
}

// posiciona os 4 rótulos temporais (topo/base/esquerda/direita) e, a
// partir deles, alinha a legenda de eventos (início = início do
// rótulo esquerdo) e o controle de modo (fim = fim do rótulo direito)
// — todos medidos ao vivo no DOM, relativos ao .spiral-frame.
//
// IMPORTANTE: a geometria (posição, fonte, cor, opacidade) é a mesma
// SEMPRE, nos dois modos — só o conteúdo do texto muda (anos no modo
// Tempo, contagem de blocos no modo Blocos). Legenda e controle são
// medidos a partir da posição real de elEsq/elDir, então continuam
// alinhados corretamente em ambos os modos.
function posicionarSistemaVisual(yearLabels, modo, cx, cy, rExt) {
  const elTopo = document.getElementById("spiral-year-top");
  const elBase = document.getElementById("spiral-year-bottom");
  const elEsq = document.getElementById("spiral-year-left");
  const elDir = document.getElementById("spiral-year-right");
  const elLegenda = document.getElementById("spiral-legend");
  const elModo = document.getElementById("spiral-modo");
  if (!elTopo || !elBase || !elEsq || !elDir) return;

  const GAP = 18;
  const empilhar = window.innerWidth < 768;
  const separador = modo === "tempo" ? ", " : " · ";
  const frameEl = canvasEl.closest(".spiral-frame");
  const frameRect = frameEl.getBoundingClientRect();
  const canvasRect = canvasEl.getBoundingClientRect();
  const originX = canvasRect.left - frameRect.left;
  const originY = canvasRect.top - frameRect.top;

  elTopo.innerHTML = yearLabels[0];
  elBase.innerHTML = yearLabels[2];
  elTopo.style.display = elBase.style.display = elEsq.style.display = elDir.style.display = "block";
  elTopo.style.visibility = elBase.style.visibility = elEsq.style.visibility = elDir.style.visibility = "visible";
  elTopo.style.left = elBase.style.left = (originX + cx) + "px";
  elTopo.style.top = "auto";
  elTopo.style.bottom = (frameRect.height - (originY + cy - rExt - GAP)) + "px";
  elBase.style.top = (originY + cy + rExt + GAP) + "px";
  elBase.style.bottom = "auto";

  if (empilhar) {
    elEsq.innerHTML = yearLabels[3].split(separador).join("<br>");
    elDir.innerHTML = yearLabels[1].split(separador).join("<br>");
    elEsq.style.left = elEsq.style.right = elEsq.style.top = "";
    elDir.style.left = elDir.style.right = elDir.style.top = "";
    elEsq.classList.add("empilhado");
    elDir.classList.add("empilhado");
  } else {
    elEsq.innerHTML = yearLabels[3];
    elDir.innerHTML = yearLabels[1];
    elEsq.classList.remove("empilhado");
    elDir.classList.remove("empilhado");
    const axisTop = originY + cy;
    const circleRightEdge = originX + cx + rExt;
    const circleLeftEdge = originX + cx - rExt;
    elDir.style.top = elEsq.style.top = axisTop + "px";
    elDir.style.left = (circleRightEdge + GAP) + "px";
    elDir.style.right = "auto";
    elEsq.style.right = (frameRect.width - circleLeftEdge + GAP) + "px";
    elEsq.style.left = "auto";
  }

  // modo Blocos, fora do mobile: os 4 raios diagonais (45/135/225/315°)
  // ganham seu próprio rótulo, centralizado exatamente na ponta do
  // raio (mesmo raio rExt+GAP usado pelos 4 cardeais, mesma fonte —
  // só a âncora é o ponto, não uma borda). No modo Tempo, ou no
  // mobile, ficam escondidos (o desenho aprovado não tem diagonais).
  const raioLabel = rExt + GAP;
  const diagonais = [
    { id: "spiral-ray-45", grausDoTopo: 45, valor: "26.25k" },
    { id: "spiral-ray-135", grausDoTopo: 135, valor: "78.75k" },
    { id: "spiral-ray-225", grausDoTopo: 225, valor: "131.25k" },
    { id: "spiral-ray-315", grausDoTopo: 315, valor: "183.75k" },
  ];
  const mostrarDiagonais = modo === "blocos" && !empilhar;
  diagonais.forEach(d => {
    const el = document.getElementById(d.id);
    if (!el) return;
    if (!mostrarDiagonais) { el.style.display = "none"; return; }
    const rad = (d.grausDoTopo * Math.PI / 180) - Math.PI / 2;
    el.innerHTML = d.valor;
    el.style.display = "block";
    el.style.left = (originX + cx + Math.cos(rad) * raioLabel) + "px";
    el.style.top = (originY + cy + Math.sin(rad) * raioLabel) + "px";
  });

  // legenda/modo seguem os rótulos laterais fora do mobile — no
  // mobile (<768px) o CSS já tira os dois de cima do gráfico e os
  // coloca abaixo, em fluxo normal (ver media query em index.html).
  if (elLegenda) {
    if (empilhar) {
      elLegenda.style.left = "";
    } else {
      const esqRect = elEsq.getBoundingClientRect();
      elLegenda.style.left = Math.round(esqRect.left - frameRect.left) + "px";
    }
  }
  if (elModo) {
    if (empilhar) {
      elModo.style.right = "";
      elModo.style.top = "";
    } else {
      elModo.style.top = "";
      const dirRect = elDir.getBoundingClientRect();
      elModo.style.right = Math.round(frameRect.right - dirRect.right) + "px";
    }
  }
}

function attachTooltip(tooltipEl) {
  canvasEl.addEventListener("mousemove", (ev) => {
    if (!pointCache.length) return;
    const rect = canvasEl.getBoundingClientRect();
    const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    let best = null, bestD = Infinity;
    for (const p of pointCache) {
      const d = (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my);
      if (d < bestD) { bestD = d; best = p; }
    }
    if (!best || bestD > (canvasEl.width * 0.035) ** 2) { tooltipEl.style.opacity = 0; return; }
    const precoFmt = best.preco.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: best.preco >= 1000 ? 0 : 2 });
    const dataFmt = new Date(best.data + "T00:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" });
    tooltipEl.innerHTML = `<b>${dataFmt}</b><br>${precoFmt}<br><span class="spiral-tooltip-muted">bloco ~${best.bloco.toLocaleString("en-US")}</span>`;
    tooltipEl.style.left = (mx + 14) + "px";
    tooltipEl.style.top = (my + 14) + "px";
    tooltipEl.style.opacity = 1;
  });
  canvasEl.addEventListener("mouseleave", () => { tooltipEl.style.opacity = 0; });
}

document.addEventListener("DOMContentLoaded", async () => {
  canvasEl = document.getElementById("bitcoin-spiral-canvas");
  const tooltipEl = document.getElementById("spiral-tooltip");

  btcSerie = await carregarHistorico();
  fundos = [...FUNDOS_FECHADOS, fundoEraAberta(btcSerie)].filter(Boolean);

  attachTooltip(tooltipEl);
  desenhar();

  document.querySelectorAll(".spiral-modo-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      state.modo = opt.dataset.modo;
      document.querySelectorAll(".spiral-modo-opt").forEach(o => {
        const ativo = o === opt;
        o.classList.toggle("ativa", ativo);
        o.querySelector("input").checked = ativo;
      });
      desenhar();
    });
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(desenhar, 120);
  });
});
