/* =========================================================
   DCA.JS — simulador de DCA e Lump Sum em Bitcoin
   =========================================================
   100% LOCAL — nenhuma chamada de rede, nenhuma API externa.
   Os dados vêm de assets/data/btc-history.json, um arquivo com
   o histórico diário de preço do Bitcoin em reais (BRL).

   COMO ATUALIZAR OS DADOS:
   Isso agora acontece sozinho, uma vez por semana, através de um robô
   do GitHub Actions (veja .github/workflows/update-btc-history.yml e o
   script scripts/update_btc_history.py). Você só precisa ativar isso
   uma vez — instruções no README.md, seção 7.

   Se preferir atualizar manualmente, também dá: basta adicionar novas
   linhas no mesmo formato ao final do arquivo, mantendo a ordem
   cronológica:
     { "date": "AAAA-MM-DD", "price": 000000.00 }

   ARQUITETURA V2 (DCA V2):
   Mesma linguagem visual e mesma UX do Comparador de Investimentos —
   pills de estratégia/frequência/período, cálculo automático (sem
   botão "Calcular"), gráfico em destaque, cards de resultado e o
   mesmo menu de compartilhar. A DCA é uma irmã direta do Comparador,
   adaptada para um único ativo (Bitcoin) e duas estratégias (DCA e
   Lump Sum) em vez de vários ativos comparados lado a lado.
   ========================================================= */

const FREQ_DIAS = { mensal: 30, semanal: 7, diaria: 1 };
const FREQ_LABEL = { mensal: "mês", semanal: "semana", diaria: "dia" };
const COR_CARTEIRA = "#F7931A";
const COR_TOTAL_INVESTIDO = "#D7DCE5"; // linha de referência, não um ativo — ver renderChart

const APORTES_LIMITE_INICIAL = 20; // evita listas com centenas de linhas abertas por padrão

let priceHistory = []; // [{date, price}], ordenado por data
let chartInstance = null;
let ultimoResultado = null;
let intervalo = null;

const state = {
  modo: "dca", // "dca" | "lump"
  valor: 200,
  frequencia: "mensal",
  inicio: null,
  fim: null,
  periodoAnos: 1, // 1 | 3 | 5 | 10 | 0 (máximo) | null (personalizado)
};

// fmtDateBR, addDays e debounce vêm de assets/js/utils.js (carregado antes
// deste arquivo). fmtBRL mantém wrapper local: esta calculadora mostra
// centavos (2 casas decimais, o padrão do Intl para BRL), diferente do
// Comparador de Investimentos, que arredonda pra inteiro.
function fmtBRL(n) {
  return fmtBRLBase(n);
}

async function loadHistory() {
  const res = await fetch("/assets/data/btc-history.json");
  if (!res.ok) throw new Error("Não foi possível carregar assets/data/btc-history.json");
  return res.json();
}

function findPrice(dateStr) {
  // busca exata primeiro
  let lo = 0, hi = priceHistory.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (priceHistory[mid].date === dateStr) return priceHistory[mid].price;
    if (priceHistory[mid].date < dateStr) lo = mid + 1;
    else hi = mid - 1;
  }
  // não achou exato: pega o mais próximo (o índice "lo" é onde entraria)
  const candidates = [priceHistory[lo - 1], priceHistory[lo]].filter(Boolean);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) =>
    Math.abs(new Date(a.date) - new Date(dateStr)) - Math.abs(new Date(b.date) - new Date(dateStr))
  );
  return candidates[0].price;
}

/* ---------- simulação ---------- */
function simular({ modo, valor, frequencia, inicio, fim }) {
  const rows = [];
  const chartLabels = [];
  const chartInvestido = [];
  const chartValor = [];

  let totalInvestido = 0;
  let totalBTC = 0;

  if (modo === "lump") {
    const precoCompra = findPrice(inicio);
    totalInvestido = valor;
    totalBTC = valor / precoCompra;

    rows.push({
      date: inicio, preco: precoCompra, aportado: valor,
      btcComprado: totalBTC, btcAcumulado: totalBTC, patrimonio: totalBTC * precoCompra,
    });

    // snapshots mensais pra tabela e gráfico
    let cursor = inicio;
    while (cursor <= fim) {
      const preco = findPrice(cursor);
      chartLabels.push(cursor);
      chartInvestido.push(totalInvestido);
      chartValor.push(totalBTC * preco);
      if (cursor !== inicio) {
        rows.push({
          date: cursor, preco, aportado: 0,
          btcComprado: 0, btcAcumulado: totalBTC, patrimonio: totalBTC * preco,
        });
      }
      cursor = addDays(cursor, 30);
    }
  } else {
    const stepDias = FREQ_DIAS[frequencia];

    let cursor = inicio;
    while (cursor <= fim) {
      const preco = findPrice(cursor);
      const btcComprado = valor / preco;
      totalBTC += btcComprado;
      totalInvestido += valor;

      rows.push({
        date: cursor, preco, aportado: valor,
        btcComprado, btcAcumulado: totalBTC, patrimonio: totalBTC * preco,
      });
      chartLabels.push(cursor);
      chartInvestido.push(totalInvestido);
      chartValor.push(totalBTC * preco);

      cursor = addDays(cursor, stepDias);
    }
  }

  const precoFinal = findPrice(fim);
  const valorAtual = totalBTC * precoFinal;
  const lucro = valorAtual - totalInvestido;
  const lucroPct = totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0;
  const precoMedio = totalInvestido / (totalBTC || 1);

  return { rows, chartLabels, chartInvestido, chartValor, totalInvestido, totalBTC, valorAtual, lucro, lucroPct, precoMedio };
}

/* ---------- URL de estado ---------- */
function lerEstadoDaURL() {
  const p = new URLSearchParams(location.search);
  if (!p.has("inicio")) return null;
  return {
    modo: p.get("modo") === "lump" ? "lump" : "dca",
    valor: parseFloat(p.get("valor")) || 200,
    frequencia: p.get("freq") || "mensal",
    inicio: p.get("inicio"),
    fim: p.get("fim"),
  };
}
function escreverEstadoNaURL() {
  const p = new URLSearchParams();
  p.set("modo", state.modo);
  p.set("valor", state.valor);
  p.set("freq", state.frequencia);
  p.set("inicio", state.inicio);
  p.set("fim", state.fim);
  history.replaceState(null, "", "?" + p.toString());
}

/* ---------- texto de compartilhamento ---------- */
const LINK_CALCULADORA_VISIVEL = "caiogare.com.br/calculadora";
const LINK_CALCULADORA_COMPLETO = "https://caiogare.com.br/calculadora";

function descricaoPeriodo() {
  if (state.periodoAnos === 0) return `desde ${fmtDateBR(state.inicio)}`;
  if (state.periodoAnos) return `nos últimos ${state.periodoAnos} ano${state.periodoAnos > 1 ? "s" : ""}`;
  return `de ${fmtDateBR(state.inicio)} a ${fmtDateBR(state.fim)}`;
}

// frase inicial aleatória do compartilhamento — positiva quando a
// rentabilidade passa de 5%, negativa caso contrário.
const FRASES_HEADLINE_POSITIVAS = [
  "E eles estão certos.",
  "Desta vez funcionou.",
  "Meu patrimônio concorda.",
  "Quem teve paciência agradece.",
];
const FRASES_HEADLINE_NEGATIVAS = [
  "Só não falam que temos que comprar lenço.",
  "Mas ninguém diz quando que para de chorar.",
  "Meu patrimônio discorda.",
  "Eu poderia ter deixado na poupança.",
];
function headlineAleatoria(lucroPct) {
  const lista = lucroPct > 5 ? FRASES_HEADLINE_POSITIVAS : FRASES_HEADLINE_NEGATIVAS;
  const frase = lista[Math.floor(Math.random() * lista.length)];
  return `Todo mundo fala para comprar Bitcoin.\n\n${frase}`;
}

function corpoMensagem(r) {
  const emoji = r.lucro >= 0 ? "🚀" : "📉";
  const headline = headlineAleatoria(r.lucroPct);

  const estrategia = state.modo === "lump"
    ? `💰 Aporte único: ${fmtBRL(state.valor)}`
    : `💰 ${fmtBRL(state.valor)}/${FREQ_LABEL[state.frequencia]}`;

  const detalhes = [
    estrategia,
    `💵 Total investido: ${fmtBRL(r.totalInvestido)}`,
    `${emoji} Valor hoje: ${fmtBRL(r.valorAtual)} (${r.lucroPct > 0 ? "+" : ""}${r.lucroPct.toFixed(0)}%)`,
  ].join("\n");
  const periodo = `📅 ${descricaoPeriodo()}`;

  return `${headline}\n\n${detalhes}\n\n${periodo}`;
}
function mensagemCompartilhamento(r) {
  return `${corpoMensagem(r)}\n\n👇\n${LINK_CALCULADORA_VISIVEL}`;
}

// copiarTexto vem de assets/js/utils.js

/* ---------- render ---------- */
function renderCards(el, r, fim) {
  const corLucro = r.lucro >= 0 ? "var(--green)" : "var(--red)";
  el.innerHTML = `
    <div class="card-ativo">
      <div class="nome">Total investido</div>
      <div class="pct" style="color:var(--text-primary)">${fmtBRL(r.totalInvestido)}</div>
    </div>
    <div class="card-ativo">
      <div class="nome">Bitcoin acumulado</div>
      <div class="pct" style="color:var(--accent)">${r.totalBTC.toFixed(6)}</div>
      <div class="valor">BTC</div>
    </div>
    <div class="card-ativo">
      <div class="nome">Preço médio</div>
      <div class="pct" style="color:var(--text-primary)">${fmtBRL(r.precoMedio)}</div>
    </div>
    <div class="card-ativo">
      <div class="nome">Valor atual</div>
      <div class="pct" style="color:${corLucro}">${fmtBRL(r.valorAtual)}</div>
      <div class="valor">em ${fmtDateBR(fim)}</div>
    </div>
    <div class="card-ativo">
      <div class="nome">Rentabilidade</div>
      <div class="pct" style="color:${corLucro}">${r.lucroPct >= 0 ? "+" : ""}${r.lucroPct.toFixed(1)}%</div>
    </div>
    <div class="card-ativo">
      <div class="nome">Lucro</div>
      <div class="pct" style="color:${corLucro}">${r.lucro >= 0 ? "+" : ""}${fmtBRL(r.lucro)}</div>
    </div>
  `;
}

function renderChart(canvasEl, r) {
  const ctx = canvasEl.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const passo = Math.max(1, Math.ceil(r.chartLabels.length / 400));
  const idx = [];
  for (let i = 0; i < r.chartLabels.length; i += passo) idx.push(i);
  if (idx[idx.length - 1] !== r.chartLabels.length - 1) idx.push(r.chartLabels.length - 1);

  const labels = idx.map(i => fmtDateBR(r.chartLabels[i]));

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Valor da carteira",
          data: idx.map(i => r.chartValor[i]),
          borderColor: COR_CARTEIRA,
          backgroundColor: COR_CARTEIRA,
          borderWidth: 2.2,
          pointRadius: 0,
          pointBackgroundColor: COR_CARTEIRA,
          tension: 0.12,
        },
        {
          label: "Total investido",
          data: idx.map(i => r.chartInvestido[i]),
          borderColor: "rgba(215,220,229,0.45)", // tom próximo de --text-secondary (#D7DCE5), bem mais fraco que a carteira — linha de referência, não uma série concorrendo visualmente
          backgroundColor: COR_TOTAL_INVESTIDO,
          pointBackgroundColor: COR_TOTAL_INVESTIDO,
          borderDash: [6, 4], // tracejado mais evidente que o da carteira (que não tem dash nenhum)
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          grid: { color: "#1F2634" },
          ticks: { color: "#D7DCE5", maxTicksLimit: 8, font: { family: "JetBrains Mono", size: 10 } },
        },
        y: {
          grid: { color: "#1F2634" },
          ticks: {
            color: "#D7DCE5",
            font: { family: "JetBrains Mono", size: 10 },
            callback: (v) => "R$ " + (v / 1000).toFixed(0) + " mil",
          },
        },
      },
      plugins: {
        legend: { display: false }, // legenda própria (estática) fica fora do canvas
        tooltip: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          backgroundColor: "#10141F",
          borderColor: "#2B3448",
          borderWidth: 1,
          titleColor: "#F2F3F5",
          bodyColor: "#8B93A7",
          callbacks: { label: (item) => item.dataset.label + ": " + fmtBRL(item.raw) },
        },
      },
    },
  });
}

function linhaTabela(r) {
  return `
    <tr>
      <td>${fmtDateBR(r.date)}</td>
      <td>${fmtBRL(r.preco)}</td>
      <td>${fmtBRL(r.aportado)}</td>
      <td>${r.btcComprado.toFixed(8)}</td>
      <td>${r.btcAcumulado.toFixed(8)}</td>
      <td>${fmtBRL(r.patrimonio)}</td>
    </tr>
  `;
}

function renderTable(tableSection, tableBody, btnMostrarTodos, rows) {
  tableSection.style.display = "block";
  const temExcedente = rows.length > APORTES_LIMITE_INICIAL;
  const linhasIniciais = temExcedente ? rows.slice(0, APORTES_LIMITE_INICIAL) : rows;
  tableBody.innerHTML = linhasIniciais.map(linhaTabela).join("");

  if (temExcedente) {
    btnMostrarTodos.style.display = "inline-flex";
    btnMostrarTodos.textContent = `Mostrar todos (${rows.length})`;
    btnMostrarTodos.onclick = () => {
      tableBody.innerHTML = rows.map(linhaTabela).join("");
      btnMostrarTodos.style.display = "none";
    };
  } else {
    btnMostrarTodos.style.display = "none";
  }
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const errorEl = document.getElementById("dca-error");
  const cardsEl = document.getElementById("dca-cards");
  const chartWrap = document.getElementById("dca-chart-canvas-wrap");
  const canvasEl = document.getElementById("dca-chart-canvas");
  const shareBlock = document.getElementById("dca-share");
  const infoEl = document.getElementById("dca-data-info");

  const grupoFrequencia = document.getElementById("grupo-frequencia");
  const labelValor = document.getElementById("label-valor");
  const valorInput = document.getElementById("valor");

  const datasExatasPainel = document.getElementById("datas-exatas");
  const inicioInput = document.getElementById("inicio");
  const fimInput = document.getElementById("fim");

  const tableSection = document.getElementById("dca-table-section");
  const tableBody = document.getElementById("dca-table-body");
  const btnMostrarTodos = document.getElementById("dca-table-show-all");

  const shareMenuWrap = document.getElementById("share-menu-wrap");
  const shareMenu = document.getElementById("share-menu");
  const btnCompartilhar = document.getElementById("btn-compartilhar");

  try {
    priceHistory = await loadHistory();
  } catch (e) {
    errorEl.textContent = "Não foi possível carregar os dados históricos locais (" + e.message + "). Verifique se o arquivo assets/data/btc-history.json existe.";
    document.querySelectorAll(".pill").forEach(b => b.disabled = true);
    return;
  }

  intervalo = { min: priceHistory[0].date, max: priceHistory[priceHistory.length - 1].date };
  inicioInput.min = intervalo.min;
  inicioInput.max = intervalo.max;
  fimInput.min = intervalo.min;
  fimInput.max = intervalo.max;
  infoEl.textContent = `Dados disponíveis de ${fmtDateBR(intervalo.min)} até ${fmtDateBR(intervalo.max)}.`;

  function aplicarPeriodoRelativo(anos) {
    state.periodoAnos = anos;
    state.fim = intervalo.max;
    if (anos === 0) {
      state.inicio = intervalo.min;
    } else {
      const d = new Date(intervalo.max + "T00:00:00");
      d.setFullYear(d.getFullYear() - anos);
      const alvo = d.toISOString().slice(0, 10);
      state.inicio = alvo < intervalo.min ? intervalo.min : alvo;
    }
    document.querySelectorAll(".periodo-pill").forEach(b =>
      b.classList.toggle("active", parseInt(b.dataset.anos, 10) === anos)
    );
    datasExatasPainel.style.display = "none";
    inicioInput.value = state.inicio;
    fimInput.value = state.fim;
  }

  function aplicarModo(modo) {
    state.modo = modo;
    document.querySelectorAll(".modo-pill").forEach(b => b.classList.toggle("active", b.dataset.modo === modo));
    grupoFrequencia.style.display = modo === "lump" ? "none" : "block";
    labelValor.textContent = modo === "lump" ? "Valor investido (R$)" : "Valor do aporte (R$)";
  }

  function calcular() {
    errorEl.textContent = "";
    if (!state.inicio || !state.fim || state.inicio >= state.fim) return;

    try {
      const r = simular({
        modo: state.modo,
        valor: state.valor,
        frequencia: state.frequencia,
        inicio: state.inicio,
        fim: state.fim,
      });

      renderCards(cardsEl, r, state.fim);
      renderChart(canvasEl, r);
      chartWrap.style.display = "block";
      shareBlock.style.display = "flex";
      renderTable(tableSection, tableBody, btnMostrarTodos, r.rows);

      ultimoResultado = r;
      escreverEstadoNaURL();
    } catch (err) {
      errorEl.textContent = "Não foi possível calcular. Detalhe técnico: " + err.message;
    }
  }
  const calcularDebounced = debounce(calcular, 400);

  // ---------- estratégia (DCA / Lump Sum) ----------
  document.querySelectorAll(".modo-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      aplicarModo(btn.dataset.modo);
      calcular();
    });
  });

  // ---------- frequência ----------
  document.querySelectorAll(".freq-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".freq-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.frequencia = btn.dataset.freq;
      calcular();
    });
  });

  // ---------- período (inclui a pill "Personalizado") ----------
  document.querySelectorAll(".periodo-pill:not(.periodo-pill--personalizado)").forEach(btn => {
    btn.addEventListener("click", () => {
      aplicarPeriodoRelativo(parseInt(btn.dataset.anos, 10));
      calcular();
    });
  });
  const btnPersonalizado = document.querySelector(".periodo-pill--personalizado");
  btnPersonalizado.addEventListener("click", () => {
    document.querySelectorAll(".periodo-pill").forEach(b => b.classList.remove("active"));
    btnPersonalizado.classList.add("active");
    inicioInput.value = state.inicio;
    fimInput.value = state.fim;
    datasExatasPainel.style.display = "block";
  });
  [inicioInput, fimInput].forEach(inp => {
    inp.addEventListener("change", () => {
      if (!inicioInput.value || !fimInput.value || inicioInput.value >= fimInput.value) return;
      state.periodoAnos = null;
      state.inicio = inicioInput.value;
      state.fim = fimInput.value;
      calcular();
    });
  });

  // ---------- valor ----------
  valorInput.addEventListener("input", () => {
    state.valor = parseFloat(valorInput.value) || 0;
    calcularDebounced();
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
    if (!ultimoResultado) return;
    copiarTexto(mensagemCompartilhamento(ultimoResultado), e.target, "Copiar resultado");
  });
  document.getElementById("btn-share-x").addEventListener("click", () => {
    if (!ultimoResultado) return;
    const url = "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(corpoMensagem(ultimoResultado)) +
      "&url=" + encodeURIComponent(LINK_CALCULADORA_COMPLETO);
    window.open(url, "_blank", "noopener");
    shareMenu.style.display = "none";
  });
  document.getElementById("btn-share-whatsapp").addEventListener("click", () => {
    if (!ultimoResultado) return;
    const url = "https://wa.me/?text=" + encodeURIComponent(mensagemCompartilhamento(ultimoResultado));
    window.open(url, "_blank", "noopener");
    shareMenu.style.display = "none";
  });

  // ---------- estado inicial: URL compartilhada ou padrão (DCA, mensal, 1 ano) ----------
  const estadoURL = lerEstadoDaURL();
  if (estadoURL) {
    state.valor = estadoURL.valor;
    state.frequencia = estadoURL.frequencia;
    state.inicio = estadoURL.inicio;
    state.fim = estadoURL.fim;
    state.periodoAnos = null;
    aplicarModo(estadoURL.modo);
    valorInput.value = state.valor;
    document.querySelectorAll(".freq-pill").forEach(b => b.classList.toggle("active", b.dataset.freq === state.frequencia));
    inicioInput.value = state.inicio;
    fimInput.value = state.fim;
  } else {
    aplicarModo("dca");
    document.querySelectorAll(".freq-pill").forEach(b => b.classList.toggle("active", b.dataset.freq === state.frequencia));
    aplicarPeriodoRelativo(1);
  }
  calcular();
});
