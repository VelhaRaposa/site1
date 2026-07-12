/* =========================================================
   COMPARADOR-CICLOS.JS — "Onde estamos no ciclo atual do Bitcoin?"
   =========================================================
   100% LOCAL — nenhuma chamada de rede no navegador. A série usada é
   assets/data/btc-history-usd.json (BTC/USD, não BRL — comparar ciclos
   do Bitcoin com uma série em reais distorce datas de topo/fundo e
   magnitude por causa do câmbio; ver README).

   V1: datas de topo e fundo de cada ciclo são valores fixos abaixo,
   validados manualmente contra a série real — sem detecção automática.

   METODOLOGIA (ver documento de arquitetura da ferramenta):
   - Cada ciclo é definido por um par fundo→topo (uma alta completa).
   - O rótulo, a cor e a posição de cada ciclo são fixos nos dois modos.
   - Cycle Up: D+0 = fundo do próprio ciclo, eixo Y = múltiplo desde o fundo.
   - Cycle Down: D+0 = topo do próprio ciclo, eixo Y = múltiplo desde o
     topo, terminando no fundo do ciclo SEGUINTE (a queda que sucede a alta).
   - "Atual" ainda não tem topo confirmado — por isso não existe linha de
     Cycle Down para ele (fica "aguardando topo"); nesse modo, o ciclo
     "2022" é quem carrega a queda em andamento (termina no fundo
     provisório do ciclo atual).
   ========================================================= */

const HISTORICO_URL = "/assets/data/btc-history-usd.json";

// datas e preços validados contra a série real em USD (ver conversa de
// arquitetura) — fundo/topo de cada ciclo, na ordem cronológica
const CICLOS = [
  { id: "2011", nome: "2011", cor: "#3E7CB1",
    fundo: { data: "2011-11-22", preco: 2.30 },
    topo:  { data: "2013-12-05", preco: 1136.90 } },
  { id: "2015", nome: "2015", cor: "#4CAF7D",
    fundo: { data: "2015-01-15", preco: 172.00 },
    topo:  { data: "2017-12-17", preco: 19279.90 } },
  { id: "2018", nome: "2018", cor: "#E1615B",
    fundo: { data: "2018-12-16", preco: 3231.91 },
    topo:  { data: "2021-11-09", preco: 67562.17 } },
  { id: "2022", nome: "2022", cor: "#D9A441",
    fundo: { data: "2022-11-22", preco: 15759.61 },
    topo:  { data: "2025-10-07", preco: 124776.68 } },
  { id: "atual", nome: "Atual", cor: "#F7931A",
    fundo: { data: "2026-07-01", preco: 58534.28, provisorio: true },
    topo: null },
];

let chartInstance = null;
let historicoMap = null;
let ultimaData = null;
let cicloUpPorId = {};
let cicloDownPorId = {};

const state = {
  modo: "up", // "up" | "down"
  escala: "log", // "log" | "linear"
  ciclosAtivos: new Set(CICLOS.map(c => c.id)),
};

/* ---------- utilidades ---------- */
function fmtUSD(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 });
}
function fmtDateBR(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function diasEntre(d0, d1) {
  return Math.round((new Date(d1 + "T00:00:00") - new Date(d0 + "T00:00:00")) / 86400000);
}
function dotHtml(cor) {
  return `<span class="legenda-dot" style="background:${cor}"></span>`;
}
function fmtPct(pct) {
  const sinal = pct >= 0 ? "+" : "";
  return `${sinal}${pct.toLocaleString("pt-BR", { maximumFractionDigits: pct >= 1000 || pct <= -100 ? 0 : 1 })}%`;
}

/* ---------- dados ---------- */
async function carregarHistorico() {
  const res = await fetch(HISTORICO_URL);
  const dados = await res.json();
  const mapa = new Map();
  dados.forEach(d => mapa.set(d.date, d.price));
  ultimaData = dados[dados.length - 1].date;
  return mapa;
}

// extrai a série diária entre duas datas (inclusive) como [{n, price}] —
// a série USD é diária e sem lacunas (Bitcoin negocia todo dia do ano)
function serieEntreDatas(mapa, dataInicio, dataFim) {
  const pontos = [];
  let cursor = dataInicio;
  let n = 0;
  while (cursor <= dataFim) {
    const preco = mapa.get(cursor);
    if (preco != null) pontos.push({ n, preco });
    cursor = addDays(cursor, 1);
    n++;
  }
  return pontos;
}

function construirCicloUp(ciclo, mapa) {
  const emAndamento = !ciclo.topo;
  const fimData = emAndamento ? ultimaData : ciclo.topo.data;
  const pontos = serieEntreDatas(mapa, ciclo.fundo.data, fimData);
  const precoFinal = pontos[pontos.length - 1].preco;
  const dias = diasEntre(ciclo.fundo.data, fimData);
  const altaPct = (precoFinal / ciclo.fundo.preco - 1) * 100;
  return {
    id: ciclo.id, nome: ciclo.nome, cor: ciclo.cor, emAndamento,
    fundo: ciclo.fundo,
    topo: ciclo.topo || { data: fimData, preco: precoFinal, provisorio: true },
    dias, altaPct,
    pontos: pontos.map(p => ({ n: p.n, mult: p.preco / ciclo.fundo.preco, preco: p.preco })),
  };
}

// ciclo em queda = topo do próprio ciclo -> fundo do ciclo SEGUINTE
// (a queda que sucede a alta desse ciclo). O último ciclo ("atual") ainda
// não tem topo confirmado, então não gera linha de Cycle Down.
function construirCicloDown(ciclo, proximoCiclo, mapa) {
  if (!ciclo.topo) return null;
  const fundoAlvo = proximoCiclo.fundo;
  const pontos = serieEntreDatas(mapa, ciclo.topo.data, fundoAlvo.data);
  const precoFinal = pontos[pontos.length - 1].preco;
  const dias = diasEntre(ciclo.topo.data, fundoAlvo.data);
  const quedaPct = (precoFinal / ciclo.topo.preco - 1) * 100;
  return {
    id: ciclo.id, nome: ciclo.nome, cor: ciclo.cor,
    topo: ciclo.topo, fundo: fundoAlvo, dias, quedaPct,
    provisorio: !!fundoAlvo.provisorio,
    pontos: pontos.map(p => ({ n: p.n, mult: p.preco / ciclo.topo.preco, preco: p.preco })),
  };
}

function construirTodosOsCiclos(mapa) {
  CICLOS.forEach(c => { cicloUpPorId[c.id] = construirCicloUp(c, mapa); });
  for (let i = 0; i < CICLOS.length - 1; i++) {
    cicloDownPorId[CICLOS[i].id] = construirCicloDown(CICLOS[i], CICLOS[i + 1], mapa);
  }
  cicloDownPorId["atual"] = null; // aguardando topo confirmado
}

function ciclosAtivosOrdenados() {
  return CICLOS.filter(c => state.ciclosAtivos.has(c.id));
}

/* ---------- "estamos aqui" ---------- */
// no modo Cycle Up, a referência é sempre o ciclo "atual" (fundo -> hoje);
// no modo Cycle Down, não existe queda em andamento agora (o fundo mais
// recente já foi encontrado) — a referência vira o ciclo "2022", cuja
// queda terminou no fundo provisório do ciclo atual.
function referenciaEstamosAqui() {
  if (state.modo === "up") {
    const c = cicloUpPorId["atual"];
    return { dia: c.dias, cor: c.cor };
  }
  const c = cicloDownPorId["2022"];
  return { dia: diasEntre(c.topo.data, ultimaData), cor: c.cor };
}

/* ---------- "ciclo mais parecido" ----------
   Compara a trajetória (log do múltiplo, dia a dia) do ciclo de
   referência do modo atual com a de cada ciclo histórico completo, no
   mesmo intervalo de dias. A diferença é resumida num erro quadrático
   médio (RMSE); o valor de similaridade é normalizado entre 0% (mais
   diferente do conjunto) e 100% (mais parecido do conjunto) — fórmula
   simples e pública, sem caixa-preta. */
function rmseLogMult(pontosA, pontosB) {
  const n = Math.min(pontosA.length, pontosB.length);
  if (n < 2) return null;
  let soma = 0;
  for (let i = 0; i < n; i++) {
    const diff = Math.log(pontosA[i].mult) - Math.log(pontosB[i].mult);
    soma += diff * diff;
  }
  return { rmse: Math.sqrt(soma / n), diasComparados: n };
}

function cicloMaisParecido() {
  let alvo, candidatos;
  if (state.modo === "up") {
    alvo = cicloUpPorId["atual"];
    candidatos = CICLOS.filter(c => c.id !== "atual").map(c => cicloUpPorId[c.id]);
  } else {
    alvo = cicloDownPorId["2022"];
    candidatos = ["2011", "2015", "2018"].map(id => cicloDownPorId[id]);
  }
  const resultados = candidatos
    .map(c => ({ ciclo: c, comp: rmseLogMult(alvo.pontos, c.pontos) }))
    .filter(r => r.comp);
  if (resultados.length === 0) return null;

  const rmses = resultados.map(r => r.comp.rmse);
  const min = Math.min(...rmses), max = Math.max(...rmses);
  resultados.forEach(r => {
    r.similaridade = max === min ? 100 : 100 * (1 - (r.comp.rmse - min) / (max - min));
  });
  resultados.sort((a, b) => b.similaridade - a.similaridade);
  const melhor = resultados[0];
  return {
    nome: melhor.ciclo.nome, cor: melhor.ciclo.cor,
    similaridade: melhor.similaridade,
    diasComparados: melhor.comp.diasComparados,
    poucosDias: melhor.comp.diasComparados < 30,
  };
}

/* ---------- render: legenda ---------- */
function renderLegenda(el, onToggle) {
  el.innerHTML = CICLOS.map(c => {
    const semDados = state.modo === "down" && !cicloDownPorId[c.id];
    const inativo = !state.ciclosAtivos.has(c.id) || semDados;
    return `
    <span class="legenda-item ${inativo ? "inativo" : ""}" data-id="${c.id}" role="button" tabindex="0">
      ${dotHtml(c.cor)}${c.nome}
    </span>`;
  }).join("");
  el.querySelectorAll(".legenda-item").forEach(item => {
    item.addEventListener("click", () => onToggle(item.dataset.id));
  });
}

/* ---------- render: cards de ciclo (linha 1, ordem cronológica fixa) ---------- */
function renderCardsCiclos(el) {
  el.style.setProperty("--n-cards", CICLOS.length);
  el.innerHTML = CICLOS.map(c => {
    const ativo = state.ciclosAtivos.has(c.id);
    if (state.modo === "up") {
      const d = cicloUpPorId[c.id];
      const topoLabel = d.emAndamento ? "Topo (em andamento)" : "Topo";
      return `
        <div class="card-ativo ${ativo ? "" : "inativo"}" data-id="${c.id}">
          <div class="nome">${dotHtml(c.cor)}${c.nome}</div>
          <div class="pct" style="color:${c.cor}">${fmtPct(d.altaPct)}</div>
          <div class="valor">Fundo: ${fmtUSD(d.fundo.preco)}${d.fundo.provisorio ? "*" : ""}<br>${topoLabel}: ${fmtUSD(d.topo.preco)}<br>D+${d.dias}</div>
        </div>`;
    }
    const d = cicloDownPorId[c.id];
    if (!d) {
      return `
        <div class="card-ativo inativo" data-id="${c.id}">
          <div class="nome">${dotHtml(c.cor)}${c.nome}</div>
          <div class="pct" style="color:var(--text-tertiary);font-size:.95rem;">Aguardando topo</div>
          <div class="valor">Ainda sem topo confirmado acima de ${fmtUSD(CICLOS.find(x=>x.id==='2022').topo.preco)}</div>
        </div>`;
    }
    return `
      <div class="card-ativo ${ativo ? "" : "inativo"}" data-id="${c.id}">
        <div class="nome">${dotHtml(c.cor)}${c.nome}</div>
        <div class="pct" style="color:${c.cor}">${fmtPct(d.quedaPct)}</div>
        <div class="valor">Topo: ${fmtUSD(d.topo.preco)}<br>Fundo: ${fmtUSD(d.fundo.preco)}${d.provisorio ? "*" : ""}<br>D+${d.dias}${d.provisorio ? " (em aberto)" : ""}</div>
      </div>`;
  }).join("");
}

/* ---------- render: painel de análise (linha 2) ---------- */
function renderPainelAnalise(el) {
  const ref = referenciaEstamosAqui();
  const atualUp = cicloUpPorId["atual"];
  const desdeFundo = atualUp.altaPct;
  const topo2022 = CICLOS.find(c => c.id === "2022").topo;
  const desdeTopo = (mapaUltimoPreco() / topo2022.preco - 1) * 100;

  const parecido = cicloMaisParecido();

  const diasUp = CICLOS.filter(c => c.id !== "atual").map(c => cicloUpPorId[c.id].dias);
  const diaMedioTopo = Math.round(diasUp.reduce((a, b) => a + b, 0) / diasUp.length);
  const diasDown = ["2011", "2015", "2018"].map(id => cicloDownPorId[id].dias);
  const diaMedioFundo = Math.round(diasDown.reduce((a, b) => a + b, 0) / diasDown.length);

  let faixaLabel, faixaMaior, faixaMenor;
  if (state.modo === "up") {
    const altas = CICLOS.filter(c => c.id !== "atual").map(c => ({ nome: c.nome, v: cicloUpPorId[c.id].altaPct }));
    altas.sort((a, b) => b.v - a.v);
    faixaLabel = "Maior/menor alta";
    faixaMaior = `${altas[0].nome}: ${fmtPct(altas[0].v)}`;
    faixaMenor = `${altas[altas.length - 1].nome}: ${fmtPct(altas[altas.length - 1].v)}`;
  } else {
    const quedas = ["2011", "2015", "2018"].map(id => ({ nome: cicloDownPorId[id].nome, v: cicloDownPorId[id].quedaPct }));
    quedas.sort((a, b) => a.v - b.v);
    faixaLabel = "Maior/menor queda";
    faixaMaior = `${quedas[0].nome}: ${fmtPct(quedas[0].v)}`;
    faixaMenor = `${quedas[quedas.length - 1].nome}: ${fmtPct(quedas[quedas.length - 1].v)}`;
  }

  const tempoMedia = state.modo === "up" ? diaMedioTopo : diaMedioFundo;
  const tempoAtual = state.modo === "up" ? atualUp.dias : cicloDownPorId["2022"].dias;

  el.innerHTML = `
    <div class="card-analise">
      <div class="card-analise-label">Estamos Aqui</div>
      <div class="card-analise-valor">D+${ref.dia}</div>
      <div class="card-analise-sub">Desde o fundo: ${fmtPct(desdeFundo)}<br>Desde o topo (2025): ${fmtPct(desdeTopo)}</div>
    </div>
    <div class="card-analise">
      <div class="card-analise-label">Ciclo Mais Parecido</div>
      ${parecido ? `
        <div class="card-analise-valor" style="color:${parecido.cor}">${parecido.nome}</div>
        <div class="card-analise-sub">Similaridade: ${parecido.similaridade.toFixed(0)}%${parecido.poucosDias ? "<br><em>poucos dias de dados ainda</em>" : ""}</div>
      ` : `<div class="card-analise-valor">—</div>`}
    </div>
    <div class="card-analise">
      <div class="card-analise-label">Média Histórica</div>
      <div class="card-analise-valor">D+${diaMedioTopo}</div>
      <div class="card-analise-sub">Dia médio do topo<br>Dia médio do fundo: D+${diaMedioFundo}</div>
    </div>
    <div class="card-analise">
      <div class="card-analise-label">${faixaLabel}</div>
      <div class="card-analise-valor" style="font-size:1.1rem;">${faixaMaior}</div>
      <div class="card-analise-sub">${faixaMenor}</div>
    </div>
    <div class="card-analise">
      <div class="card-analise-label">Tempo de Ciclo</div>
      <div class="card-analise-valor">D+${tempoAtual}</div>
      <div class="card-analise-sub">Média histórica: D+${tempoMedia}</div>
    </div>
  `;
}

function mapaUltimoPreco() {
  return historicoMap.get(ultimaData);
}

/* ---------- render: gráfico ---------- */
const linhaHojePlugin = {
  id: "linhaHoje",
  afterDraw(chart) {
    const n = chart.$linhaHojeN;
    if (n == null) return;
    const { ctx, chartArea, scales } = chart;
    const x = scales.x.getPixelForValue(n);
    if (x < chartArea.left || x > chartArea.right) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#C5CCD8";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = x > chartArea.right - 90 ? "right" : "left";
    ctx.fillText(`estamos aqui · D+${n}`, x + (ctx.textAlign === "right" ? -6 : 6), chartArea.top + 12);
    ctx.restore();
  },
};
if (typeof Chart !== "undefined" && !Chart.registry.plugins.get("linhaHoje")) {
  Chart.register(linhaHojePlugin);
}

function renderChart(canvasEl) {
  const ctx = canvasEl.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const ativos = ciclosAtivosOrdenados();
  const datasets = ativos.map(c => {
    const d = state.modo === "up" ? cicloUpPorId[c.id] : cicloDownPorId[c.id];
    if (!d) return null;
    const isAtual = c.id === "atual" && state.modo === "up";
    return {
      label: c.nome,
      data: d.pontos.map(p => ({ x: p.n, y: p.mult, preco: p.preco })),
      borderColor: c.cor,
      backgroundColor: c.cor,
      borderWidth: isAtual ? 3.2 : 1.8,
      pointRadius: 0,
      pointBackgroundColor: c.cor,
      tension: 0.08,
      order: isAtual ? 0 : 1, // ciclo atual desenhado por último (acima das demais)
    };
  }).filter(Boolean);

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          type: "linear",
          grid: { color: "#1F2634" },
          ticks: {
            color: "#D7DCE5", maxTicksLimit: 8,
            font: { family: "JetBrains Mono", size: 10 },
            callback: (v) => `D+${v}`,
          },
          title: { display: true, text: "Dias corridos desde o marco (D+0)", color: "#8B93A7", font: { family: "JetBrains Mono", size: 10 } },
        },
        y: {
          type: state.escala === "log" ? "logarithmic" : "linear",
          grid: { color: "#1F2634" },
          ticks: {
            color: "#D7DCE5",
            font: { family: "JetBrains Mono", size: 10 },
            callback: (v) => {
              const pct = (v - 1) * 100;
              return (pct >= 0 ? "+" : "") + Math.round(pct).toLocaleString("pt-BR") + "%";
            },
          },
          title: {
            display: true,
            text: state.modo === "up" ? "Valorização desde o fundo" : "Queda desde o topo",
            color: "#8B93A7", font: { family: "JetBrains Mono", size: 10 },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          usePointStyle: true, pointStyle: "circle", boxWidth: 8, boxHeight: 8,
          backgroundColor: "#10141F", borderColor: "#2B3448", borderWidth: 1,
          titleColor: "#F2F3F5", bodyColor: "#8B93A7",
          callbacks: {
            title: (items) => `D+${items[0].raw.x}`,
            label: (item) => {
              const pct = (item.raw.y - 1) * 100;
              return `${item.dataset.label}: ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% (${fmtUSD(item.raw.preco)})`;
            },
          },
        },
      },
    },
  });

  const ref = referenciaEstamosAqui();
  chartInstance.$linhaHojeN = ref.dia;
  chartInstance.update();
}

/* ---------- compartilhamento ---------- */
const LINK_VISIVEL = "caiogare.com.br/comparador-ciclos";
const LINK_COMPLETO = "https://caiogare.com.br/comparador-ciclos";

function mensagemCompartilhamento() {
  const ref = referenciaEstamosAqui();
  const atualUp = cicloUpPorId["atual"];
  const desdeTopo = (mapaUltimoPreco() / CICLOS.find(c => c.id === "2022").topo.preco - 1) * 100;
  const parecido = cicloMaisParecido();
  const modoLabel = state.modo === "up" ? "Cycle Up" : "Cycle Down";

  const linhas = [
    `📊 Onde estamos no ciclo do Bitcoin?`,
    ``,
    `Modo: ${modoLabel}`,
    `Hoje: D+${ref.dia}`,
    `Desde o fundo: ${fmtPct(atualUp.altaPct)}`,
    `Desde o topo (2025): ${fmtPct(desdeTopo)}`,
  ];
  if (parecido) linhas.push(`Ciclo mais parecido: ${parecido.nome} (${parecido.similaridade.toFixed(0)}%)`);
  linhas.push("", "👇", LINK_VISIVEL);
  return linhas.join("\n");
}

async function copiarTexto(texto, feedbackEl, textoOriginal) {
  try {
    await navigator.clipboard.writeText(texto);
    feedbackEl.textContent = "Copiado!";
  } catch (e) {
    feedbackEl.textContent = "Não foi possível copiar";
  }
  setTimeout(() => { feedbackEl.textContent = textoOriginal; }, 1800);
}

/* ---------- estado na URL ---------- */
function lerEstadoDaURL() {
  const p = new URLSearchParams(location.search);
  const modo = p.get("modo");
  return modo === "up" || modo === "down" ? modo : null;
}
function escreverEstadoNaURL() {
  const p = new URLSearchParams();
  p.set("modo", state.modo);
  history.replaceState(null, "", "?" + p.toString());
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const legendaEl = document.getElementById("legenda-ciclos");
  const canvasEl = document.getElementById("ciclos-chart-canvas");
  const cardsEl = document.getElementById("ciclos-cards");
  const painelEl = document.getElementById("ciclos-painel-analise");
  const shareMenuWrap = document.getElementById("share-menu-wrap");
  const shareMenu = document.getElementById("share-menu");
  const btnCompartilhar = document.getElementById("btn-compartilhar");
  const subtituloModoEl = document.getElementById("ciclos-subtitulo-modo");

  historicoMap = await carregarHistorico();
  construirTodosOsCiclos(historicoMap);

  function renderTudo() {
    document.querySelectorAll(".modo-pill").forEach(b => b.classList.toggle("active", b.dataset.modo === state.modo));
    document.querySelectorAll(".escala-pill").forEach(b => b.classList.toggle("active", b.dataset.escala === state.escala));
    subtituloModoEl.textContent = state.modo === "up" ? "Valorização percentual desde o fundo de cada ciclo." : "Queda percentual desde o topo de cada ciclo.";
    renderChart(canvasEl);
    renderCardsCiclos(cardsEl);
    renderPainelAnalise(painelEl);
    escreverEstadoNaURL();
  }

  function onToggleCiclo(id) {
    if (state.ciclosAtivos.has(id)) {
      if (state.ciclosAtivos.size <= 2) return; // sempre pelo menos 2 ciclos visíveis
      state.ciclosAtivos.delete(id);
    } else {
      state.ciclosAtivos.add(id);
    }
    renderLegenda(legendaEl, onToggleCiclo);
    renderTudo();
  }

  document.querySelectorAll(".modo-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      state.modo = btn.dataset.modo;
      renderTudo();
    });
  });
  document.querySelectorAll(".escala-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      state.escala = btn.dataset.escala;
      renderTudo();
    });
  });

  renderLegenda(legendaEl, onToggleCiclo);

  // ---------- menu de compartilhar ----------
  btnCompartilhar.addEventListener("click", (e) => {
    e.stopPropagation();
    shareMenu.style.display = shareMenu.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", (e) => {
    if (!shareMenuWrap.contains(e.target)) shareMenu.style.display = "none";
  });
  document.getElementById("btn-copiar-resultado").addEventListener("click", (e) => {
    copiarTexto(mensagemCompartilhamento(), e.target, "Copiar resultado");
  });
  document.getElementById("btn-share-x").addEventListener("click", () => {
    const url = "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(mensagemCompartilhamento().replace(LINK_VISIVEL, "").trim()) +
      "&url=" + encodeURIComponent(LINK_COMPLETO);
    window.open(url, "_blank", "noopener");
    shareMenu.style.display = "none";
  });
  document.getElementById("btn-share-whatsapp").addEventListener("click", () => {
    const url = "https://wa.me/?text=" + encodeURIComponent(mensagemCompartilhamento());
    window.open(url, "_blank", "noopener");
    shareMenu.style.display = "none";
  });

  const modoURL = lerEstadoDaURL();
  if (modoURL) state.modo = modoURL;

  renderTudo();
});
