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
const MESES_ABR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

let etfFlowsDaily = [];
let etfFlowsSummary = {};
let etfFlowsModo = "diario"; // diario | semanal | mensal

function fmtUsdM(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  const sinal = v > 0 ? "+" : v < 0 ? "-" : "";
  if (abs >= 1000) return `${sinal}${(abs / 1000).toFixed(1)}B`;
  return `${sinal}${abs.toFixed(1)}M`;
}

function classeFluxo(v) {
  if (v === null || v === undefined) return "neutro";
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
    return etfFlowsDaily
      .slice(-ETF_FLOWS_MAX_COLS)
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

// Nome não pode ser "renderHeader" — nav.js já usa esse nome globalmente
// para montar o cabeçalho/menu do site (script sem módulos, escopo
// global compartilhado); antes da correção, essa colisão fazia esta
// função rodar em vez da de nav.js, e o menu do site sumia.
function renderStats() {
  const totals = etfFlowsSummary.totals || {};
  const ultimoDia = etfFlowsDaily.length ? etfFlowsDaily[etfFlowsDaily.length - 1] : null;

  document.getElementById("etf-flows-total-geral").textContent = fmtUsdM(totals.TOTAL);
  document.getElementById("etf-flows-hoje").textContent = ultimoDia ? fmtUsdM(ultimoDia.flows.TOTAL) : "—";

  const collectedAt = etfFlowsSummary.collected_at;
  let atualizadoTxt = "—";
  if (collectedAt) {
    const d = new Date(collectedAt);
    atualizadoTxt = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  }
  document.getElementById("etf-flows-atualizado").textContent = atualizadoTxt;
}

function render() {
  const totals = etfFlowsSummary.totals || {};
  const tickers = (etfFlowsSummary.tickers || []).slice();
  tickers.sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0));

  const colunas = construirColunas(etfFlowsModo);

  const thead = document.getElementById("etf-flows-thead");
  const tbody = document.getElementById("etf-flows-tbody");
  const tfoot = document.getElementById("etf-flows-tfoot");

  thead.innerHTML =
    `<tr><th class="etf-flows-col-etf">ETF</th>` +
    `<th class="etf-flows-col-total" title="Soma dos fluxos líquidos desde jan/2024.">Total <span class="etf-flows-info">ⓘ</span></th>` +
    colunas.map((c) => `<th>${c.label}${c.partial ? " *" : ""}</th>`).join("") +
    `</tr>`;

  tbody.innerHTML = tickers
    .map((ticker) => {
      const total = totals[ticker];
      const cells = colunas
        .map((c) => {
          const v = somaFlows(c.rows, ticker);
          return `<td class="${classeFluxo(v)}">${fmtUsdM(v)}</td>`;
        })
        .join("");
      return (
        `<tr><td class="etf-flows-col-etf">${ticker}</td>` +
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
    `<tr class="etf-flows-linha-total"><td class="etf-flows-col-etf">TOTAL</td>` +
    `<td class="etf-flows-col-total etf-flows-destaque ${classeFluxo(totals.TOTAL)}">${fmtUsdM(totals.TOTAL)}</td>` +
    totalCells +
    `</tr>`;

  const nota = document.getElementById("etf-flows-nota-parcial");
  if (nota) nota.style.display = colunas.some((c) => c.partial) ? "" : "none";
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

  renderStats();
  render();
  initModoSwitch();
}

document.addEventListener("DOMContentLoaded", initEtfFlows);
