/* =========================================================
   COMPARADOR-CICLOS.JS — "Onde estamos no ciclo atual do Bitcoin?"
   =========================================================
   100% LOCAL — nenhuma chamada de rede no navegador. A série usada é
   assets/data/btc-history-usd.json (BTC/USD, não BRL — comparar ciclos
   do Bitcoin com uma série em reais distorce datas de topo/fundo e
   magnitude por causa do câmbio; ver README).

   V1: datas e preços de topo/fundo de cada ciclo são valores fixos
   ("congelados") abaixo — não vêm da série de preço carregada em
   tempo real, e sim de um consenso de mercado definido manualmente
   (imprensa financeira / Bitstamp / Coinbase / CoinMarketCap), com
   prioridade sobre a precisão histórica bruta de qualquer índice
   único. Ver README, seção 9, para a tabela completa com fontes. Os
   halvings (assets/js/halvings.js) seguem a mesma filosofia — ver
   README, seção 11.

   Os dias ENTRE o fundo e o topo de cada ciclo continuam vindo da
   série real (assets/data/btc-history-usd.json) — só os extremos são
   sobrescritos pelo preço congelado, para o gráfico sempre começar
   exatamente em 0% e terminar exatamente na porcentagem oficial.

   METODOLOGIA — 3 modos, todos derivados do MESMO array CICLOS (mais
   HALVINGS, só para o alinhamento por halving):
   - Ciclo de Alta: D+0 = fundo do próprio ciclo, eixo Y = múltiplo desde
     o fundo. Só exibe ciclos já completos (com topo confirmado) — o
     ciclo mais recente ("atual"), cujo fundo ainda é provisório, não
     aparece aqui para não sugerir um fundo confirmado que não existe.
   - Ciclo de Baixa: D+0 = topo do próprio ciclo, eixo Y = múltiplo desde
     o topo, terminando no fundo do ciclo SEGUINTE (a queda que sucede a
     alta) — ou em ultimaData, se esse fundo ainda for provisório (queda
     em andamento, sem fundo confirmado).
   - Ciclo Completo (V2): Alta + Baixa emendados numa linha só, do fundo
     de uma era até o fundo da era seguinte — D+0 = fundo, eixo Y =
     múltiplo desde o fundo, mantido em todo o trecho (inclusive na
     perna de baixa, que já vem calculada relativa ao topo — por isso é
     recalculada aqui em relação ao fundo, usando o preço absoluto que
     cada ponto já carrega). Tem uma segunda metodologia de alinhamento,
     opcional: em vez do fundo de preço, usa o halving como D+0 (mesma
     lógica de ancorar extremos no valor congelado, dias intermediários
     vêm da série real) — POSIÇÃO EDITORIAL: fundo continua sendo o
     padrão e a definição principal de "início de ciclo" deste site;
     halving é uma lente alternativa, não substitui a metodologia
     principal (ver README, seção 11, e a decisão de produto que
     acompanha esta implementação).
   - Sem painel de interpretação (ciclo mais parecido, média histórica
     etc.) e sem cards de detalhe — só o gráfico e uma legenda de cor,
     para o gráfico ser o produto, não a interface em volta dele.
   ========================================================= */

const HISTORICO_URL = "/assets/data/btc-history-usd.json";

// marcos canônicos de cada ciclo — congelados por decisão editorial
// (consenso de mercado), não recalculados da série real. Ver README,
// seção 9, para a tabela com a fonte de cada valor. A cor é o
// identificador visual fixo de cada ciclo; o rótulo exibido é
// calculado em rotuloCiclo().
const CICLOS = [
  { id: "2011", cor: "#3E7CB1",
    fundo: { data: "2011-11-22", preco: 2.30 },
    topo:  { data: "2013-12-05", preco: 1137 } },
  { id: "2015", cor: "#4CAF7D",
    fundo: { data: "2015-01-14", preco: 152 },
    topo:  { data: "2017-12-17", preco: 19783 } },
  { id: "2018", cor: "#E1615B",
    fundo: { data: "2018-12-07", preco: 3122 },
    topo:  { data: "2021-11-10", preco: 68789 } },
  { id: "2022", cor: "#9B7FD4",
    fundo: { data: "2022-11-21", preco: 15476 },
    topo:  { data: "2025-10-06", preco: 126296 } },
  { id: "atual", cor: "#F7931A",
    fundo: { data: "2026-07-01", preco: 58534.28, provisorio: true },
    topo: null },
];

// cores fixas por halving, mesma paleta e mesma ordem de CICLOS (ids
// diferentes, sem correspondência 1:1 com as eras de preço — não reusar
// a MESMA cor com o mesmo significado seria enganoso, mas usar a
// paleta na mesma ordem mantém a identidade visual da ferramenta).
// HALVINGS em si vem de assets/js/halvings.js, carregado antes deste
// arquivo — não duplicado aqui.
const CORES_HALVING = { "2012": "#3E7CB1", "2016": "#4CAF7D", "2020": "#E1615B", "2024": "#9B7FD4" };

let chartInstance = null;
let historicoMap = null;
let ultimaData = null;
let cicloUpPorId = {};
let cicloDownPorId = {};
let cicloCompletoFundoPorId = {};
let cicloCompletoHalvingPorId = {};

const state = {
  modo: "completo", // "completo" | "up" | "down"
  alinhamento: "fundo", // "fundo" | "halving" — só relevante quando modo === "completo"
  ciclosAtivos: new Set([...CICLOS.map(c => c.id).filter(id => id !== "atual"), ...HALVINGS.map(h => h.id)]),
};

/* ---------- utilidades ---------- */
function fmtUSD(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 });
}
function anoDe(dataStr) {
  return dataStr.slice(0, 4);
}
// addDays e dotHtml vêm de assets/js/utils.js
function diasEntre(d0, d1) {
  return Math.round((new Date(d1 + "T00:00:00") - new Date(d0 + "T00:00:00")) / 86400000);
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
  // ancora os extremos no preço congelado (tabela oficial) — os dias
  // intermediários seguem vindo da série real, já que não temos um
  // preço congelado dia a dia, só nos marcos de fundo/topo
  pontos[0].preco = ciclo.fundo.preco;
  if (!emAndamento) pontos[pontos.length - 1].preco = ciclo.topo.preco;
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
// Quando o fundo do próximo ciclo é provisório (queda ainda em andamento,
// sem fundo confirmado), a série não para nesse marco congelado — ela
// segue até ultimaData, com o mesmo tratamento usado em construirCicloUp
// para um ciclo em andamento: só o ponto inicial é ancorado no preço
// congelado (o topo, aqui confirmado), o final fica com o preço real
// mais recente da série.
function construirCicloDown(ciclo, proximoCiclo, mapa) {
  if (!ciclo.topo) return null;
  const fundoAlvo = proximoCiclo.fundo;
  const emAndamento = !!fundoAlvo.provisorio;
  const fimData = emAndamento ? ultimaData : fundoAlvo.data;
  const pontos = serieEntreDatas(mapa, ciclo.topo.data, fimData);
  // mesmo ancoramento nos extremos congelados que o Ciclo de Alta
  pontos[0].preco = ciclo.topo.preco;
  if (!emAndamento) pontos[pontos.length - 1].preco = fundoAlvo.preco;
  const precoFinal = pontos[pontos.length - 1].preco;
  const dias = diasEntre(ciclo.topo.data, fimData);
  const quedaPct = (precoFinal / ciclo.topo.preco - 1) * 100;
  return {
    id: ciclo.id, cor: ciclo.cor,
    topo: ciclo.topo,
    fundo: emAndamento ? { data: fimData, preco: precoFinal, provisorio: true } : fundoAlvo,
    dias, quedaPct,
    provisorio: emAndamento,
    pontos: pontos.map(p => ({ n: p.n, mult: p.preco / ciclo.topo.preco, preco: p.preco })),
  };
}

// Ciclo Completo (alinhamento Fundo) = Alta + Baixa da MESMA era emendados
// numa linha só, sem recalcular nada da série — reaproveita cicloUpPorId
// e cicloDownPorId já prontos. O eixo Y da perna de baixa (que
// internamente é relativa ao TOPO) é reexpresso relativo ao FUNDO desta
// função, usando o preço absoluto que cada ponto já carrega (não uma
// conversão de razão — o preço bruto de cada dia não muda). O primeiro
// ponto da perna de baixa é descartado porque é o mesmo dia (o topo) já
// incluído como último ponto da perna de alta.
function construirCicloCompletoFundo(id) {
  const up = cicloUpPorId[id];
  const down = cicloDownPorId[id];
  const offset = up.dias;
  const pontos = [
    ...up.pontos,
    ...down.pontos.slice(1).map(p => ({ n: offset + p.n, mult: p.preco / up.fundo.preco, preco: p.preco })),
  ];
  return {
    id, cor: up.cor,
    emAndamento: !!down.provisorio,
    fundoInicio: up.fundo,
    fundoFim: down.fundo,
    dias: offset + down.dias,
    pontos,
  };
}

// Ciclo Completo (alinhamento Halving) = mesmo princípio do alinhamento
// por Fundo, mas D+0 é o dia do halving, não o menor preço do ciclo.
// halving -> halving seguinte (ou até ultimaData, se for o mais recente,
// sem halving seguinte ainda). Mesmo ancoramento de extremos no preço
// congelado (assets/js/halvings.js) que fundo/topo já usam.
function construirCicloCompletoHalving(halving, proximoHalving, mapa) {
  const emAndamento = !proximoHalving;
  const fimData = emAndamento ? ultimaData : proximoHalving.data;
  const pontos = serieEntreDatas(mapa, halving.data, fimData);
  pontos[0].preco = halving.preco;
  if (!emAndamento) pontos[pontos.length - 1].preco = proximoHalving.preco;
  const precoFinal = pontos[pontos.length - 1].preco;
  const dias = diasEntre(halving.data, fimData);
  return {
    id: halving.id, cor: CORES_HALVING[halving.id],
    emAndamento,
    halvingInicio: halving,
    halvingFim: proximoHalving || { data: fimData, preco: precoFinal, provisorio: true },
    dias,
    pontos: pontos.map(p => ({ n: p.n, mult: p.preco / halving.preco, preco: p.preco })),
  };
}

function construirTodosOsCiclos(mapa) {
  CICLOS.forEach(c => { cicloUpPorId[c.id] = construirCicloUp(c, mapa); });
  for (let i = 0; i < CICLOS.length - 1; i++) {
    cicloDownPorId[CICLOS[i].id] = construirCicloDown(CICLOS[i], CICLOS[i + 1], mapa);
  }
  cicloDownPorId["atual"] = null; // sem topo confirmado — não existe queda para o ciclo atual

  CICLOS.filter(c => c.id !== "atual").forEach(c => {
    cicloCompletoFundoPorId[c.id] = construirCicloCompletoFundo(c.id);
  });
  HALVINGS.forEach((h, i) => {
    cicloCompletoHalvingPorId[h.id] = construirCicloCompletoHalving(h, HALVINGS[i + 1] || null, mapa);
  });
}

/* ---------- seleção de dados pelo modo/alinhamento atual ---------- */
function idsDoModoAtual() {
  if (state.modo === "completo" && state.alinhamento === "halving") return HALVINGS.map(h => h.id);
  return CICLOS.map(c => c.id).filter(id => id !== "atual");
}
function dadosPorId(id) {
  if (state.modo === "up") return cicloUpPorId[id];
  if (state.modo === "down") return cicloDownPorId[id];
  return state.alinhamento === "halving" ? cicloCompletoHalvingPorId[id] : cicloCompletoFundoPorId[id];
}

// rótulo exibido do ciclo no modo/alinhamento atual — mostra origem e
// destino (ex. "2011–2013"), ou o ano de início com asterisco quando o
// ciclo ainda está em andamento (ex. "2025*"). Retorna null quando o
// ciclo não deve aparecer (ex. Ciclo de Baixa não existe para "atual",
// sem topo confirmado).
function rotuloCiclo(id) {
  const d = dadosPorId(id);
  if (!d) return null;
  if (state.modo === "up") return `${anoDe(d.fundo.data)}–${anoDe(d.topo.data)}`;
  if (state.modo === "down") return d.provisorio ? `${anoDe(d.topo.data)}*` : `${anoDe(d.topo.data)}–${anoDe(d.fundo.data)}`;
  if (state.alinhamento === "halving") {
    return d.emAndamento ? `${anoDe(d.halvingInicio.data)}–atual*` : `${anoDe(d.halvingInicio.data)}–${anoDe(d.halvingFim.data)}`;
  }
  return d.emAndamento ? `${anoDe(d.fundoInicio.data)}–atual*` : `${anoDe(d.fundoInicio.data)}–${anoDe(d.fundoFim.data)}`;
}

// ciclos com dado disponível no modo/alinhamento atual, na ordem
// cronológica fixa
function entidadesDoModo() {
  return idsDoModoAtual().filter(id => rotuloCiclo(id) !== null);
}

/* ---------- render: legenda (única informação abaixo do gráfico) ---------- */
function renderLegenda(el, onToggle) {
  el.innerHTML = entidadesDoModo().map(id => {
    const d = dadosPorId(id);
    return `
    <span class="legenda-item ${state.ciclosAtivos.has(id) ? "" : "inativo"}" data-id="${id}" role="button" tabindex="0">
      ${dotHtml(d.cor)}${rotuloCiclo(id)}
    </span>
  `;
  }).join("");
  el.querySelectorAll(".legenda-item").forEach(item => {
    item.addEventListener("click", () => onToggle(item.dataset.id));
  });
}

function tituloEixoY() {
  if (state.modo === "up") return "Valorização desde o fundo";
  if (state.modo === "down") return "Queda desde o topo";
  return state.alinhamento === "halving" ? "Múltiplo desde o halving" : "Múltiplo desde o fundo";
}

/* ---------- render: gráfico ---------- */
function renderChart(canvasEl) {
  const ctx = canvasEl.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const datasets = entidadesDoModo()
    .filter(id => state.ciclosAtivos.has(id))
    .map(id => {
      const d = dadosPorId(id);
      const emDestaque = !!(d.emAndamento || d.provisorio); // ciclo/era ainda em formação, sem marco final confirmado
      return {
        label: rotuloCiclo(id),
        data: d.pontos.map(p => ({ x: p.n, y: p.mult, preco: p.preco })),
        borderColor: d.cor,
        backgroundColor: d.cor,
        borderWidth: emDestaque ? 3.2 : 1.8,
        pointRadius: 0,
        pointBackgroundColor: d.cor,
        tension: 0.08,
        order: emDestaque ? 0 : 1,
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
            text: tituloEixoY(),
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
}

/* ---------- estado na URL ---------- */
function lerEstadoDaURL() {
  const p = new URLSearchParams(location.search);
  const modo = p.get("modo");
  const alinhamento = p.get("alinhamento");
  return {
    modo: (modo === "up" || modo === "down" || modo === "completo") ? modo : null,
    alinhamento: alinhamento === "halving" ? "halving" : null,
  };
}
function escreverEstadoNaURL() {
  const p = new URLSearchParams();
  p.set("modo", state.modo);
  if (state.modo === "completo" && state.alinhamento === "halving") p.set("alinhamento", "halving");
  history.replaceState(null, "", "?" + p.toString());
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const legendaEl = document.getElementById("legenda-ciclos");
  const canvasEl = document.getElementById("ciclos-chart-canvas");
  const alinhamentoToggleEl = document.getElementById("alinhamento-toggle");
  const divisorAlinhamentoEl = document.getElementById("divisor-alinhamento");

  historicoMap = await carregarHistorico();
  construirTodosOsCiclos(historicoMap);

  function renderTudo() {
    document.querySelectorAll(".modo-pill").forEach(b => b.classList.toggle("active", b.dataset.modo === state.modo));
    const mostrarAlinhamento = state.modo === "completo";
    alinhamentoToggleEl.hidden = !mostrarAlinhamento;
    divisorAlinhamentoEl.hidden = !mostrarAlinhamento;
    document.querySelectorAll(".alinhamento-opt").forEach(el => {
      const ativo = el.dataset.alinhamento === state.alinhamento;
      el.classList.toggle("ativo", ativo);
      el.querySelector("input").checked = ativo;
    });
    renderLegenda(legendaEl, onToggleCiclo);
    renderChart(canvasEl);
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
  document.querySelectorAll(".alinhamento-opt").forEach(el => {
    el.addEventListener("click", () => {
      state.alinhamento = el.dataset.alinhamento;
      renderTudo();
    });
  });

  const estadoURL = lerEstadoDaURL();
  if (estadoURL.modo) state.modo = estadoURL.modo;
  if (estadoURL.alinhamento) state.alinhamento = estadoURL.alinhamento;

  renderTudo();
});
