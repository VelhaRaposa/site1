/* =========================================================
   COMPARADOR-CICLOS.JS — "Onde estamos no ciclo atual do Bitcoin?"
   =========================================================
   100% LOCAL — nenhuma chamada de rede no navegador. A série usada é
   assets/data/btc-history-usd.json (BTC/USD, não BRL — comparar ciclos
   do Bitcoin com uma série em reais distorce datas de topo/fundo e
   magnitude por causa do câmbio; ver README).

   V1: datas de topo e fundo de cada ciclo são valores fixos abaixo,
   validados manualmente contra a série real — sem detecção automática.

   METODOLOGIA:
   - Cada ciclo é definido por um par fundo→topo (uma alta completa).
   - A cor de cada ciclo é fixa nos dois modos; o rótulo exibido (ex.
     "2011–2013") reflete o intervalo relevante em cada modo.
   - Ciclo de Alta: D+0 = fundo do próprio ciclo, eixo Y = múltiplo desde
     o fundo.
   - Ciclo de Baixa: D+0 = topo do próprio ciclo, eixo Y = múltiplo desde
     o topo, terminando no fundo do ciclo SEGUINTE (a queda que sucede a
     alta).
   - O ciclo mais recente ("atual") ainda não tem topo confirmado — por
     isso ele só aparece no modo Ciclo de Alta (rótulo "2026*", ainda em
     andamento); no modo Ciclo de Baixa ele não é exibido, e quem carrega
     a queda em andamento é o ciclo anterior ("2025*", cujo fundo mais
     recente é provisório).
   - Deliberadamente sem painel de interpretação (ciclo mais parecido,
     média histórica etc.) — o gráfico e os cards mostram os dados,
     sem tentar concluir nada por conta própria.
   ========================================================= */

const HISTORICO_URL = "/assets/data/btc-history-usd.json";

// datas e preços validados contra a série real em USD — fundo/topo de
// cada ciclo, na ordem cronológica. A cor é o identificador visual fixo
// de cada ciclo; o rótulo exibido é calculado em rotuloCiclo().
const CICLOS = [
  { id: "2011", cor: "#3E7CB1",
    fundo: { data: "2011-11-22", preco: 2.30 },
    topo:  { data: "2013-12-05", preco: 1136.90 } },
  { id: "2015", cor: "#4CAF7D",
    fundo: { data: "2015-01-15", preco: 172.00 },
    topo:  { data: "2017-12-17", preco: 19279.90 } },
  { id: "2018", cor: "#E1615B",
    fundo: { data: "2018-12-16", preco: 3231.91 },
    topo:  { data: "2021-11-09", preco: 67562.17 } },
  { id: "2022", cor: "#9B7FD4",
    fundo: { data: "2022-11-22", preco: 15759.61 },
    topo:  { data: "2025-10-07", preco: 124776.68 } },
  { id: "atual", cor: "#F7931A",
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
  ciclosAtivos: new Set(CICLOS.map(c => c.id)),
};

/* ---------- utilidades ---------- */
function fmtUSD(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 });
}
function anoDe(dataStr) {
  return dataStr.slice(0, 4);
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
    id: ciclo.id, cor: ciclo.cor, emAndamento,
    fundo: ciclo.fundo,
    topo: ciclo.topo || { data: fimData, preco: precoFinal, provisorio: true },
    dias, altaPct,
    pontos: pontos.map(p => ({ n: p.n, mult: p.preco / ciclo.fundo.preco, preco: p.preco })),
  };
}

// ciclo em queda = topo do próprio ciclo -> fundo do ciclo SEGUINTE
// (a queda que sucede a alta desse ciclo). O último ciclo ("atual") ainda
// não tem topo confirmado, então não gera linha de Ciclo de Baixa.
function construirCicloDown(ciclo, proximoCiclo, mapa) {
  if (!ciclo.topo) return null;
  const fundoAlvo = proximoCiclo.fundo;
  const pontos = serieEntreDatas(mapa, ciclo.topo.data, fundoAlvo.data);
  const precoFinal = pontos[pontos.length - 1].preco;
  const dias = diasEntre(ciclo.topo.data, fundoAlvo.data);
  const quedaPct = (precoFinal / ciclo.topo.preco - 1) * 100;
  return {
    id: ciclo.id, cor: ciclo.cor,
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
  cicloDownPorId["atual"] = null; // sem topo confirmado — não existe queda para o ciclo atual
}

// rótulo exibido do ciclo no modo atual — mostra origem e destino
// (ex. "2011–2013"), ou só o ano de início com asterisco quando o
// ciclo ainda está em andamento (ex. "2026*"). Retorna null quando o
// ciclo não tem dado nesse modo (ex. "atual" no modo de Baixa).
function rotuloCiclo(id) {
  if (state.modo === "up") {
    const d = cicloUpPorId[id];
    return d.emAndamento ? `${anoDe(d.fundo.data)}*` : `${anoDe(d.fundo.data)}–${anoDe(d.topo.data)}`;
  }
  const d = cicloDownPorId[id];
  if (!d) return null;
  return d.provisorio ? `${anoDe(d.topo.data)}*` : `${anoDe(d.topo.data)}–${anoDe(d.fundo.data)}`;
}

// ciclos com dado disponível no modo atual, na ordem cronológica fixa
// (5 no modo de Alta, 4 no modo de Baixa — "atual" fica de fora até ter
// um topo confirmado)
function entidadesDoModo() {
  return CICLOS.filter(c => rotuloCiclo(c.id) !== null);
}

/* ---------- render: legenda ---------- */
function renderLegenda(el, onToggle) {
  el.innerHTML = entidadesDoModo().map(c => `
    <span class="legenda-item ${state.ciclosAtivos.has(c.id) ? "" : "inativo"}" data-id="${c.id}" role="button" tabindex="0">
      ${dotHtml(c.cor)}${rotuloCiclo(c.id)}
    </span>
  `).join("");
  el.querySelectorAll(".legenda-item").forEach(item => {
    item.addEventListener("click", () => onToggle(item.dataset.id));
  });
}

/* ---------- render: cards de ciclo (ordem cronológica fixa) ---------- */
function renderCardsCiclos(el) {
  el.innerHTML = entidadesDoModo().map(c => {
    const ativo = state.ciclosAtivos.has(c.id);
    const rotulo = rotuloCiclo(c.id);
    const nota = "* ciclo em andamento";
    if (state.modo === "up") {
      const d = cicloUpPorId[c.id];
      return `
        <div class="card-ativo ${ativo ? "" : "inativo"}" data-id="${c.id}">
          <div class="nome">${dotHtml(c.cor)}${rotulo}</div>
          <div class="pct" style="color:${c.cor}">${fmtPct(d.altaPct)}</div>
          <div class="valor-linha">Fundo: ${fmtUSD(d.fundo.preco)}</div>
          <div class="valor-linha">Topo: ${fmtUSD(d.topo.preco)}</div>
          <div class="valor-linha">D+${d.dias}</div>
          <div class="valor-nota">${d.emAndamento ? nota : "&nbsp;"}</div>
        </div>`;
    }
    const d = cicloDownPorId[c.id];
    return `
      <div class="card-ativo ${ativo ? "" : "inativo"}" data-id="${c.id}">
        <div class="nome">${dotHtml(c.cor)}${rotulo}</div>
        <div class="pct" style="color:${c.cor}">${fmtPct(d.quedaPct)}</div>
        <div class="valor-linha">Topo: ${fmtUSD(d.topo.preco)}</div>
        <div class="valor-linha">Fundo: ${fmtUSD(d.fundo.preco)}</div>
        <div class="valor-linha">D+${d.dias}</div>
        <div class="valor-nota">${d.provisorio ? nota : "&nbsp;"}</div>
      </div>`;
  }).join("");
}

/* ---------- render: gráfico ---------- */
// linha vertical "estamos aqui" — só existe no modo de Alta, marcando o
// dia de hoje no ciclo em andamento (no modo de Baixa não há queda em
// andamento agora: o fundo mais recente já foi encontrado, ver topo do
// arquivo).
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

  const datasets = entidadesDoModo()
    .filter(c => state.ciclosAtivos.has(c.id))
    .map(c => {
      const d = state.modo === "up" ? cicloUpPorId[c.id] : cicloDownPorId[c.id];
      const isAtual = c.id === "atual";
      return {
        label: rotuloCiclo(c.id),
        data: d.pontos.map(p => ({ x: p.n, y: p.mult, preco: p.preco })),
        borderColor: c.cor,
        backgroundColor: c.cor,
        borderWidth: isAtual ? 3.2 : 1.8,
        pointRadius: 0,
        pointBackgroundColor: c.cor,
        tension: 0.08,
        order: isAtual ? 0 : 1, // ciclo atual desenhado por último (acima das demais)
      };
    });

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
          type: "logarithmic", // fixa — é o padrão correto para comparar ciclos de magnitudes tão diferentes
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

  chartInstance.$linhaHojeN = state.modo === "up" ? cicloUpPorId["atual"].dias : null;
  chartInstance.update();
}

/* ---------- compartilhamento ---------- */
const LINK_VISIVEL = "caiogare.com.br/comparador-ciclos";
const LINK_COMPLETO = "https://caiogare.com.br/comparador-ciclos";

function mensagemCompartilhamento() {
  const modoLabel = state.modo === "up" ? "Ciclo de Alta" : "Ciclo de Baixa";
  const atual = cicloUpPorId["atual"];
  const linhas = [
    `📊 Onde estamos no ciclo do Bitcoin?`,
    ``,
    `Modo: ${modoLabel}`,
    `Ciclo atual (${rotuloCiclo("atual") || "2026*"}): D+${atual.dias}`,
    `Desde o fundo: ${fmtPct(atual.altaPct)}`,
    ``, "👇", LINK_VISIVEL,
  ];
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
  const shareMenuWrap = document.getElementById("share-menu-wrap");
  const shareMenu = document.getElementById("share-menu");
  const btnCompartilhar = document.getElementById("btn-compartilhar");

  historicoMap = await carregarHistorico();
  construirTodosOsCiclos(historicoMap);

  function renderTudo() {
    document.querySelectorAll(".modo-pill").forEach(b => b.classList.toggle("active", b.dataset.modo === state.modo));
    renderLegenda(legendaEl, onToggleCiclo);
    renderChart(canvasEl);
    renderCardsCiclos(cardsEl);
    escreverEstadoNaURL();
  }

  // sem mínimo de ciclos visíveis — o usuário pode esconder todos, deixar
  // só um, ou qualquer combinação
  function onToggleCiclo(id) {
    if (state.ciclosAtivos.has(id)) {
      state.ciclosAtivos.delete(id);
    } else {
      state.ciclosAtivos.add(id);
    }
    renderTudo();
  }

  document.querySelectorAll(".modo-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      state.modo = btn.dataset.modo;
      renderTudo();
    });
  });

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
