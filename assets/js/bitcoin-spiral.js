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
  ctx.font = fontSize + "px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(139,147,167,0.4)";
  // modo Tempo: cada quadrante lista os anos das 5 voltas que caem
  // nele — só o topo usa o ano por extenso, os outros três já
  // começam abreviados. Uma linha só, sempre, na mesma posição (fora
  // da área útil) que os rótulos já usavam antes — sem empilhar, sem
  // fallback: a mesma regra simples do rótulo do topo, replicada
  // pros outros três lados.
  const yearLabels = modo === "tempo"
    ? ["2009, '13, '17, '21, '25", "'10, '14, '18, '22, '26", "'11, '15, '19, '23, '27", "'12, '16, '20, '24, '28"]
    : ["0", "52.5k", "105k", "157.5k"];
  const pos = [
    { x: cx, y: Math.max(cy - rExt - 16, fontSize + 2), align: "center" },
    { x: cx, y: Math.min(cy + rExt + 24, H - 4), align: "center" },
  ];
  // topo/base ficam no canvas, como sempre
  ctx.textAlign = pos[0].align; ctx.fillText(yearLabels[0], pos[0].x, pos[0].y);
  ctx.textAlign = pos[1].align; ctx.fillText(yearLabels[2], pos[1].x, pos[1].y);
  ctx.textAlign = "left";
  // esquerda/direita: o texto (5 anos) não cabe desenhado dentro do
  // canvas a poucos px do círculo — ficam fora dele, como elementos
  // HTML posicionados por medição real do DOM, ancorados no eixo
  // horizontal (y=cy) e a GAP px do círculo externo. No mobile viram
  // uma coluna empilhada na mesma margem estreita.
  const elEsq = document.getElementById("spiral-year-left");
  const elDir = document.getElementById("spiral-year-right");
  if (elEsq && elDir) {
    if (modo === "tempo") {
      const GAP = 18;
      const empilhar = window.innerWidth <= 640;
      if (empilhar) {
        elEsq.innerHTML = yearLabels[3].split(", ").join("<br>");
        elDir.innerHTML = yearLabels[1].split(", ").join("<br>");
        elEsq.style.left = elEsq.style.right = elEsq.style.top = "";
        elDir.style.left = elDir.style.right = elDir.style.top = "";
        elEsq.classList.add("empilhado");
        elDir.classList.add("empilhado");
      } else {
        elEsq.innerHTML = yearLabels[3];
        elDir.innerHTML = yearLabels[1];
        elEsq.classList.remove("empilhado");
        elDir.classList.remove("empilhado");
        const frameEl = canvasEl.closest(".spiral-frame");
        const frameRect = frameEl.getBoundingClientRect();
        const canvasRect = canvasEl.getBoundingClientRect();
        const axisTop = canvasRect.top - frameRect.top + cy;
        const circleRightEdge = canvasRect.left - frameRect.left + cx + rExt;
        const circleLeftEdge = canvasRect.left - frameRect.left + cx - rExt;
        elDir.style.top = elEsq.style.top = axisTop + "px";
        elDir.style.left = (circleRightEdge + GAP) + "px";
        elDir.style.right = "auto";
        elEsq.style.right = (frameRect.width - circleLeftEdge + GAP) + "px";
        elEsq.style.left = "auto";
      }
      elEsq.style.display = elDir.style.display = "block";
    } else {
      elEsq.style.display = elDir.style.display = "none";
    }
  }

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

function atualizarHint(hintEl) {
  hintEl.textContent = state.modo === "tempo"
    ? "1 volta ≈ 4 anos · ancorado em 2009"
    : "1 volta = 210.000 blocos · sempre exato";
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
  const hintEl = document.getElementById("spiral-hint");

  btcSerie = await carregarHistorico();
  fundos = [...FUNDOS_FECHADOS, fundoEraAberta(btcSerie)].filter(Boolean);

  attachTooltip(tooltipEl);
  atualizarHint(hintEl);
  desenhar();

  document.querySelectorAll(".spiral-alin-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      state.modo = opt.dataset.modo;
      document.querySelectorAll(".spiral-alin-opt").forEach(o => {
        const ativo = o === opt;
        o.classList.toggle("ativa", ativo);
        o.querySelector("input").checked = ativo;
      });
      atualizarHint(hintEl);
      desenhar();
    });
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(desenhar, 120);
  });
});
