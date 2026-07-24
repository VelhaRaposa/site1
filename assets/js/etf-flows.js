/* =========================================================
   ETF-FLOWS.JS — "Para quais ETFs está entrando ou saindo dinheiro?"
   =========================================================
   100% LOCAL depois do carregamento — os dois JSONs vêm prontos de
   assets/data/etf-flows-*.json, atualizados 1x/dia por um robô do
   GitHub Actions (scripts/update_etf_flows.py + .github/workflows/
   update-etf-flows.yml). Fonte única: Farside Investors.

   ESCOPO DESTA V1: só fluxo em US$ (USD). Não há holdings, não há
   AUM, não há BTC estimado — isso fica para uma versão futura (V1.1),
   e quando entrar, precisa do mesmo cuidado de rótulo já discutido:
   nunca chamar de "holdings" ou "BTC real".

   ORDENAÇÃO: por "Total" (fluxo acumulado desde jan/2024) com sinal,
   maior para o menor — não por valor absoluto. Um ETF com resgates
   líquidos históricos (ex.: conversão de trust fechado) aparece no
   fim da lista, não no topo.

   "TOTAL" como chave especial: além dos tickers de cada ETF, tanto o
   resumo quanto cada linha diária carregam uma chave "TOTAL" — é a
   própria coluna/linha "Total" que a Farside já publica (soma de
   todos os ETFs), não algo recalculado aqui. Ela vira a linha de
   rodapé da tabela e o número de destaque do cabeçalho.
   ========================================================= */

const ETF_FLOWS_DAILY_URL = "/assets/data/etf-flows-daily.json";
const ETF_FLOWS_SUMMARY_URL = "/assets/data/etf-flows-summary.json";
const ETF_FLOWS_MAX_COLS = 8;
const ETF_FLOWS_DAILY_COLS = 7;
const MESES_ABR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

let etfFlowsDaily = [];
let etfFlowsSummary = {};
let etfFlowsModo = "diario"; // diario | semanal | mensal

// Emissor por ticker — dá contexto visual na 1a coluna (logo real + nome).
// Arquivos em assets/img/logos-etf/ (fornecidos pelo usuário, 64x64 PNG
// com fundo transparente). BTC (Grayscale Mini) usa um arquivo próprio,
// diferente do GBTC, mesmo sendo o mesmo emissor.
const ETF_ISSUERS = {
  IBIT: { nome: "BlackRock", logo: "/assets/img/logos-etf/blackrock.png" },
  FBTC: { nome: "Fidelity", logo: "/assets/img/logos-etf/fidelity.png" },
  BITB: { nome: "Bitwise", logo: "/assets/img/logos-etf/bitwise.png" },
  ARKB: { nome: "Ark Invest", logo: "/assets/img/logos-etf/ark.png" },
  BTCO: { nome: "Invesco", logo: "/assets/img/logos-etf/invesco.png" },
  EZBC: { nome: "Franklin Templeton", logo: "/assets/img/logos-etf/franklin.png" },
  BRRR: { nome: "CoinShares", logo: "/assets/img/logos-etf/coinshares.png" },
  HODL: { nome: "VanEck", logo: "/assets/img/logos-etf/vaneck.png" },
  BTCW: { nome: "WisdomTree", logo: "/assets/img/logos-etf/wisdomtree.png" },
  MSBT: { nome: "Morgan Stanley", logo: "/assets/img/logos-etf/morgan-stanley.png" },
  GBTC: { nome: "Grayscale", logo: "/assets/img/logos-etf/grayscale.png" },
  BTC: { nome: "Grayscale", logo: "/assets/img/logos-etf/grayscale-mini.png" },
};

function issuerInfo(ticker) {
  return ETF_ISSUERS[ticker] || { nome: ticker, logo: "" };
}

// Ícone de relógio (dado ainda não publicado) — usa currentColor, então
// herda a cor da célula (.pendente, ver classeFluxo) sem precisar de cor
// própria. Só aparece no lugar do antigo "—"; zero continua "0.0M".
const ICONE_PENDENTE =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

function fmtUsdM(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return ICONE_PENDENTE;
  const abs = Math.abs(v);
  const sinal = v > 0 ? "+" : v < 0 ? "-" : "";
  if (abs >= 1000) return `${sinal}${(abs / 1000).toFixed(1)}B`;
  return `${sinal}${abs.toFixed(1)}M`;
}

function classeFluxo(v) {
  if (v === null || v === undefined) return "pendente";
  if (v > 0) return "positivo";
  if (v < 0) return "negativo";
  return "neutro";
}

function isoWeekInfo(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7; // segunda=0 ... domingo=6
  target.setUTCDate(target.getUTCDate() - dayNr + 3); // quinta-feira da mesma semana
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const week = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000));
  return { year: target.getUTCFullYear(), week };
}

// soma os valores não-nulos de uma lista de linhas diárias, para uma
// chave (ticker ou "TOTAL"). Se nenhum dia do período tiver dado, o
// resultado é null (dia sem dado != fluxo zero, mesmo agregado).
function somaFlows(rows, key) {
  let soma = null;
  for (const row of rows) {
    const v = row.flows[key];
    if (v === null || v === undefined) continue;
    soma = (soma === null ? 0 : soma) + v;
  }
  return soma;
}

// Constrói as colunas do modo ativo: cada coluna é {label, rows, partial}.
// Sempre as mais recentes primeiro, no máximo ETF_FLOWS_MAX_COLS colunas —
// mas pode ter menos enquanto o histórico coletado ainda for curto (a
// tabela cresce sozinha a cada dia que o robô roda, não é um bug).
function construirColunas(modo) {
  if (modo === "diario") {
    // O dia corrente nunca aparece no modo Diário, mesmo com dados parciais
    // já publicados — só passa a aparecer no dia seguinte. Não é uma checagem
    // de "coluna vazia": é sempre a data de hoje, incondicionalmente.
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    return etfFlowsDaily
      .filter((row) => row.date !== hojeStr)
      .slice(-ETF_FLOWS_DAILY_COLS)
      .reverse()
      .map((row) => {
        const [, m, d] = row.date.split("-").map(Number);
        return { label: `${String(d).padStart(2, "0")} ${MESES_ABR[m - 1]}`, rows: [row], partial: false };
      });
  }

  if (modo === "semanal") {
    const buckets = new Map();
    for (const row of etfFlowsDaily) {
      const { year, week } = isoWeekInfo(row.date);
      const key = `${year}-W${week}`;
      if (!buckets.has(key)) buckets.set(key, { label: `W${week}`, rows: [] });
      buckets.get(key).rows.push(row);
    }
    return Array.from(buckets.values()).slice(-ETF_FLOWS_MAX_COLS).reverse();
  }

  // mensal
  const buckets = new Map();
  const hoje = etfFlowsDaily.length ? etfFlowsDaily[etfFlowsDaily.length - 1].date : null;
  const mesAtual = hoje ? hoje.slice(0, 7) : null; // "YYYY-MM"
  for (const row of etfFlowsDaily) {
    const ym = row.date.slice(0, 7);
    if (!buckets.has(ym)) {
      const [y, m] = ym.split("-").map(Number);
      const label = `${MESES_ABR[m - 1]}/${String(y).slice(2)}`;
      buckets.set(ym, { label, rows: [], partial: ym === mesAtual });
    }
    buckets.get(ym).rows.push(row);
  }
  return Array.from(buckets.values()).slice(-ETF_FLOWS_MAX_COLS).reverse();
}

function render() {
  const totals = etfFlowsSummary.totals || {};
  const tickers = (etfFlowsSummary.tickers || []).slice();
  tickers.sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0));

  const colunas = construirColunas(etfFlowsModo);

  const thead = document.getElementById("etf-flows-thead");
  const tbody = document.getElementById("etf-flows-tbody");
  const tfoot = document.getElementById("etf-flows-tfoot");

  // 4 colunas independentes (rank / logo / ticker / emissor) em vez de
  // uma célula combinada — pedido explícito pra parecer menos planilha
  // e mais um terminal financeiro. Total deixou de ser sticky (só as
  // 4 primeiras colunas ficam fixas agora, por pedido explícito).
  // Cabeçalho unificado: Logo+ETF+Emissor viram um único "ETF" (colspan=3)
  // — pedido explícito pra tratar as três colunas como um bloco só de
  // identidade, sem rótulos individuais "Logo"/"Emissor". O corpo da
  // tabela continua com as 3 células separadas (cada uma com sua própria
  // largura/alinhamento/sticky, nada disso muda).
  thead.innerHTML =
    `<tr>` +
    `<th class="etf-flows-col-rank">#</th>` +
    `<th class="etf-flows-col-identidade" colspan="3">ETF</th>` +
    `<th class="etf-flows-col-total" title="Soma dos fluxos líquidos desde jan/2024.">Total <span class="etf-flows-info">ⓘ</span></th>` +
    colunas.map((c) => `<th>${c.label}${c.partial ? " *" : ""}</th>`).join("") +
    `</tr>`;

  tbody.innerHTML = tickers
    .map((ticker, idx) => {
      const info = issuerInfo(ticker);
      const total = totals[ticker];
      const cells = colunas
        .map((c) => {
          const v = somaFlows(c.rows, ticker);
          return `<td class="${classeFluxo(v)}">${fmtUsdM(v)}</td>`;
        })
        .join("");
      return (
        `<tr>` +
        `<td class="etf-flows-col-rank">#${idx + 1}</td>` +
        `<td class="etf-flows-col-logo"><img class="etf-flows-logo" src="${info.logo}" alt="${info.nome}" loading="lazy"></td>` +
        `<td class="etf-flows-col-ticker">${ticker}</td>` +
        `<td class="etf-flows-col-emissor">${info.nome}</td>` +
        `<td class="etf-flows-col-total ${classeFluxo(total)}">${fmtUsdM(total)}</td>` +
        cells +
        `</tr>`
      );
    })
    .join("");

  const totalCells = colunas
    .map((c) => {
      const v = somaFlows(c.rows, "TOTAL");
      return `<td class="${classeFluxo(v)}">${fmtUsdM(v)}</td>`;
    })
    .join("");
  tfoot.innerHTML =
    `<tr class="etf-flows-linha-total">` +
    `<td class="etf-flows-col-rank"></td>` +
    `<td class="etf-flows-col-logo"></td>` +
    `<td class="etf-flows-col-ticker">TOTAL</td>` +
    `<td class="etf-flows-col-emissor"></td>` +
    `<td class="etf-flows-col-total etf-flows-destaque ${classeFluxo(totals.TOTAL)}">${fmtUsdM(totals.TOTAL)}</td>` +
    totalCells +
    `</tr>`;

  const nota = document.getElementById("etf-flows-nota-parcial");
  if (nota) nota.style.display = colunas.some((c) => c.partial) ? "" : "none";
}

/* ---------- gráfico de fluxo acumulado (abaixo da tabela) ----------
   Usa exclusivamente etfFlowsDaily (já carregado para a tabela) — soma
   progressiva do campo TOTAL de cada dia. Não depende do modo ativo da
   tabela (diário/semanal/mensal) nem é afetado por ele. */
let etfFlowsChartInstance = null;

function formatarDataLonga(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MESES_ABR[m - 1].toLowerCase()} ${y}`;
}

function fmtUsdBilhoes(milhoes) {
  return `US$ ${(milhoes / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bilhões`;
}

// dia sem dado (TOTAL null) não soma nada — o acumulado fica igual ao do
// dia anterior, não é tratado como fluxo zero retroativo.
function construirSerieAcumulada() {
  let acumulado = 0;
  return etfFlowsDaily.map((row, i) => {
    const v = row.flows.TOTAL;
    if (v !== null && v !== undefined) acumulado += v;
    return { n: i, data: row.date, acumulado };
  });
}

// índice do primeiro dia de cada mês presente na série — marcações
// candidatas do eixo X (sempre alinhadas a um início de mês, nunca no
// meio de um mês).
function indicesInicioDeMes(serie) {
  const indices = [];
  let mesAnterior = null;
  serie.forEach((p, i) => {
    const mes = p.data.slice(0, 7);
    if (mes !== mesAnterior) {
      indices.push(i);
      mesAnterior = mes;
    }
  });
  return indices;
}

// reduz a lista de inícios de mês a ~ALVO marcações bem distribuídas por
// toda a série (mesma ideia da Farside: poucas datas, espalhadas do
// início ao fim, não uma a cada mês) — sempre inclui o primeiro e o
// último mês disponível.
function escolherTicksEspacados(indicesMes, alvo) {
  if (indicesMes.length <= alvo) return indicesMes;
  const passo = (indicesMes.length - 1) / (alvo - 1);
  const escolhidos = new Set();
  for (let i = 0; i < alvo; i++) {
    escolhidos.add(indicesMes[Math.round(i * passo)]);
  }
  return Array.from(escolhidos).sort((a, b) => a - b);
}

function renderEtfFlowsChart() {
  const canvasEl = document.getElementById("etf-flows-chart-canvas");
  if (!canvasEl || typeof Chart === "undefined") return;

  const serie = construirSerieAcumulada();
  if (!serie.length) return;

  const marcosMes = escolherTicksEspacados(indicesInicioDeMes(serie), 8);

  if (etfFlowsChartInstance) etfFlowsChartInstance.destroy();
  const ctx = canvasEl.getContext("2d");
  etfFlowsChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          data: serie.map((p) => ({ x: p.n, y: p.acumulado / 1000, data: p.data })),
          borderColor: "#F7931A",
          backgroundColor: "#F7931A",
          borderWidth: 2.5,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          type: "linear",
          bounds: "data",
          min: 0,
          max: serie.length - 1,
          grid: { display: false },
          afterBuildTicks: (axis) => {
            axis.ticks = marcosMes.map((n) => ({ value: n }));
          },
          ticks: {
            color: "#D7DCE5",
            font: { family: "JetBrains Mono", size: 10 },
            callback: (v) => {
              const p = serie[v];
              if (!p) return "";
              const [y, m] = p.data.split("-");
              return `${MESES_ABR[Number(m) - 1]}/${y.slice(2)}`;
            },
          },
        },
        y: {
          grid: { color: "#1F2634" },
          ticks: {
            color: "#D7DCE5",
            font: { family: "JetBrains Mono", size: 10 },
            callback: (v) => `${Math.round(v)}B`,
          },
        },
      },
      plugins: {
        legend: { display: false },
        watermark: { enabled: true, opacity: 0.04 },
        tooltip: {
          displayColors: false,
          backgroundColor: "#10141F",
          borderColor: "#2B3448",
          borderWidth: 1,
          titleColor: "#F2F3F5",
          bodyColor: "#8B93A7",
          callbacks: {
            title: (items) => formatarDataLonga(items[0].raw.data),
            label: (item) => fmtUsdBilhoes(item.raw.y * 1000),
          },
        },
      },
    },
  });
}

function initModoSwitch() {
  document.querySelectorAll(".etf-flows-modo button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      etfFlowsModo = btn.dataset.modo;
      document.querySelectorAll(".etf-flows-modo button").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
  });
}

async function initEtfFlows() {
  const el = document.getElementById("etf-flows-app");
  if (!el) return;
  try {
    const [dailyRes, summaryRes] = await Promise.all([fetch(ETF_FLOWS_DAILY_URL), fetch(ETF_FLOWS_SUMMARY_URL)]);
    etfFlowsDaily = await dailyRes.json();
    etfFlowsSummary = await summaryRes.json();
  } catch (e) {
    document.getElementById("etf-flows-erro").textContent =
      "Não foi possível carregar os dados agora. Tente novamente em instantes.";
    return;
  }

  if (!etfFlowsDaily.length || !etfFlowsSummary.tickers) {
    document.getElementById("etf-flows-erro").textContent =
      "Ainda não há dados coletados. A primeira coleta roda automaticamente em breve.";
    return;
  }

  render();
  initModoSwitch();
  renderEtfFlowsChart();
}

document.addEventListener("DOMContentLoaded", initEtfFlows);
