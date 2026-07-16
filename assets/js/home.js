/* =========================================================
   HOME.JS — números e gráficos reais dos territórios de ferramenta
   =========================================================
   Não inclui comparador.js/dca.js/comparador-ciclos.js diretamente:
   cada um termina num bloco DOMContentLoaded que já parte pra
   manipular elementos específicos da própria página (ex: #valorInicial,
   #share-menu-wrap) — incluído aqui, quebraria em erro assim que
   tentasse usar um elemento que não existe na Home.

   Este arquivo replica só o mínimo de metodologia necessário pra
   mostrar um número e um gráfico reais (mesmos arquivos de dado, mesmos
   parâmetros padrão de cada ferramenta — ver comparador.js/dca.js/
   comparador-ciclos.js pra a versão completa e documentada de cada
   cálculo). fmtBRLBase e CICLO_ATUAL_FUNDO vêm de utils.js.

   Os gráficos aqui são decorativos, não analíticos: sem eixo, sem
   legenda, sem tooltip, sem interação própria (o território inteiro já
   é um link — um gráfico interativo por baixo ia disputar o clique com
   o próprio link). O papel dele é só dar corpo visual ao território,
   não deixar o visitante ler valores nele — pra isso existem as
   ferramentas de verdade.
   ========================================================= */

async function carregarJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao carregar " + url);
  return res.json();
}

// mesma busca binária "maior preço com data <= dateStr" usada em
// comparador.js/dca.js — forward-fill pra ativos sem preço todo dia
function precoAte(dateStr, hist) {
  let lo = 0, hi = hist.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (hist[mid].date <= dateStr) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans === -1 ? null : hist[ans].price;
}

function anosAtras(dataMax, anos) {
  const d = new Date(dataMax + "T00:00:00");
  d.setFullYear(d.getFullYear() - anos);
  return d.toISOString().slice(0, 10);
}

// mesma simulação de aporte periódico do Comparador/DCA: aporte mensal
// a partir de valorInicial, unidades acumuladas a preço de cada dia
function simularAporte(hist, { valorInicial = 0, aporte, inicio, fim }) {
  const datas = [];
  let cursor = inicio;
  while (cursor <= fim) { datas.push(cursor); cursor = addDays(cursor, 30); }
  if (datas[datas.length - 1] !== fim) datas.push(fim);

  let unidades = 0, totalInvestido = 0;
  const serie = [];
  datas.forEach((data, i) => {
    const preco = precoAte(data, hist);
    const aporteDoDia = i === 0 ? valorInicial + aporte : aporte;
    unidades += aporteDoDia / preco;
    totalInvestido += aporteDoDia;
    serie.push(unidades * preco);
  });
  const valorFinal = serie[serie.length - 1];
  return { totalInvestido, valorFinal, lucroPct: (valorFinal - totalInvestido) / totalInvestido * 100, serie };
}

function setStat(tool, value, label) {
  const el = document.querySelector(`.tool-stat[data-tool="${tool}"]`);
  if (!el) return;
  el.querySelector(".tool-stat-value").textContent = value;
  el.querySelector(".tool-stat-label").textContent = label;
}

// gráfico decorativo full-bleed do território — área preenchida, sem
// eixo/legenda/tooltip/interação (ver nota no topo do arquivo)
function renderTerritorioChart(canvasId, serie, cor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !serie || serie.length < 2) return;
  new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: serie.map((_, i) => i),
      datasets: [{
        data: serie,
        borderColor: cor,
        backgroundColor: cor + "35",
        borderWidth: 3,
        fill: true,
        pointRadius: 0,
        tension: 0.15,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      events: [],
      layout: { padding: 0 },
      scales: { x: { display: false }, y: { display: false } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });
}

// Comparador: mesmo padrão da ferramenta — R$1.000 + R$200/mês,
// período padrão de 1 ano (ver aplicarPeriodoRelativo(1) em
// comparador.js). Bitcoin vs. CDI porque é o benchmark mais universal
// pro público de patrimônio — os outros 3 ativos continuam só na
// ferramenta em si.
async function preencherComparador() {
  const [btc, cdi] = await Promise.all([
    carregarJSON("/assets/data/btc-history.json"),
    carregarJSON("/assets/data/cdi-history.json"),
  ]);
  const fim = [btc[btc.length - 1].date, cdi[cdi.length - 1].date].sort()[0];
  const inicio = anosAtras(fim, 1);
  const rBtc = simularAporte(btc, { valorInicial: 1000, aporte: 200, inicio, fim });
  const rCdi = simularAporte(cdi, { valorInicial: 1000, aporte: 200, inicio, fim });
  const sinal = rBtc.lucroPct >= 0 ? "+" : "";
  setStat("comparador", sinal + rBtc.lucroPct.toFixed(0) + "%",
    `Bitcoin no último ano · CDI: ${rCdi.lucroPct >= 0 ? "+" : ""}${rCdi.lucroPct.toFixed(0)}%`);
  renderTerritorioChart("chart-comparador", rBtc.serie, "#F7931A");
}

// DCA: mesmo padrão da ferramenta — R$200/mês, período padrão de 1 ano
// (ver aplicarPeriodoRelativo(1) em dca.js), sem aporte inicial (modo
// DCA puro, não Lump Sum).
async function preencherDca() {
  const btc = await carregarJSON("/assets/data/btc-history.json");
  const fim = btc[btc.length - 1].date;
  const inicio = anosAtras(fim, 1);
  const r = simularAporte(btc, { valorInicial: 0, aporte: 200, inicio, fim });
  const sinal = r.lucroPct >= 0 ? "+" : "";
  setStat("dca", fmtBRLBase(r.valorFinal, 0), `hoje, com R$200/mês no último ano (${sinal}${r.lucroPct.toFixed(0)}%)`);
  renderTerritorioChart("chart-dca", r.serie, "#3FC7B8");
}

// Ciclos: variação desde o fundo do ciclo em formação (CICLO_ATUAL_FUNDO,
// utils.js — mesma fonte usada pelo modo "Ciclo Completo" de
// comparador-ciclos.js, pra nunca divergir entre os dois).
async function preencherCiclos() {
  const dados = await carregarJSON("/assets/data/btc-history-usd.json");
  const precoAtual = dados[dados.length - 1].price;
  const mult = (precoAtual / CICLO_ATUAL_FUNDO.preco - 1) * 100;
  const sinal = mult >= 0 ? "+" : "";
  setStat("ciclos", sinal + mult.toFixed(0) + "%", "desde o fundo do ciclo atual");
  const serie = dados.filter(d => d.date >= CICLO_ATUAL_FUNDO.data).map(d => d.price);
  renderTerritorioChart("chart-ciclos", serie, "#9B7FD4");
}

document.addEventListener("DOMContentLoaded", () => {
  preencherComparador().catch(() => {});
  preencherDca().catch(() => {});
  preencherCiclos().catch(() => {});
});
