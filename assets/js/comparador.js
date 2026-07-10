/* =========================================================
   COMPARADOR.JS — "Onde seu dinheiro teria rendido mais?"
   =========================================================
   100% LOCAL — nenhuma chamada de rede, nenhuma API externa no
   navegador. Os cinco históricos vêm de assets/data/*-history.json,
   já prontos e em reais (BRL) ou como índice comparável (CDI).

   COMO OS DADOS SÃO ATUALIZADOS:
   Uma vez por semana, um robô do GitHub Actions roda os scripts em
   scripts/update_*.py e commita os arquivos atualizados (veja
   .github/workflows/update-market-history.yml e o README, seção 8).

   REGRA DE COMPARAÇÃO HONESTA:
   Bitcoin negocia todo dia do calendário; CDI, Ibovespa, S&P 500 e
   Ouro só têm preço em dias úteis de seus mercados. Para que "mesmo
   valor, mesma data" continue valendo em qualquer frequência de
   aporte, todo aporte acontece na mesma data de calendário para os
   cinco ativos — nos dias sem pregão de um ativo específico, usa-se o
   último preço conhecido dele (forward-fill).

   ARQUITETURA V4:
   Gráfico + pódio (top 3, altura fixa) dividem a mesma linha de tela;
   o ranking completo dos 5 ativos fica atrás de um botão, sempre
   abaixo do bloco gráfico+pódio — nunca cresce às custas do gráfico.
   Período é a interação principal (abas). Valor/aporte ficam
   colapsados numa frase, editável sob demanda. Ativos se ligam/
   desligam pela legenda do gráfico, não por uma checklist no
   formulário. Cálculo é automático (debounce nos campos de texto,
   imediato nos controles de clique único).
   ========================================================= */

const ATIVOS = [
  { id: "btc",      nome: "Bitcoin",  arquivo: "/assets/data/btc-history.json",      cor: "#F2A93B" },
  { id: "cdi",      nome: "CDI",      arquivo: "/assets/data/cdi-history.json",      cor: "#7C879C" },
  { id: "ibovespa", nome: "Ibovespa", arquivo: "/assets/data/ibovespa-history.json", cor: "#4CAF7D" },
  { id: "ouro",     nome: "Ouro",     arquivo: "/assets/data/gold-history.json",     cor: "#C9A227" },
  { id: "sp500",    nome: "S&P 500",  arquivo: "/assets/data/sp500-history.json",    cor: "#5B8DEF" },
];

const FREQ_DIAS = { mensal: 30, semanal: 7, diaria: 1 };
const FREQ_LABEL = { mensal: "mês", semanal: "semana", diaria: "dia" };

let historicos = {}; // id -> [{date, price}] ordenado por data
let chartInstance = null;
let ultimoResultado = null; // guardado para o menu de compartilhar
let intervalo = null; // {min, max} — calculado uma vez a partir dos ativos com dado

const state = {
  valorInicial: 1000,
  aporte: 200,
  frequencia: "mensal",
  inicio: null,
  fim: null,
  periodoAnos: 5, // 1 | 5 | 10 | 0 (máximo) | null (modo "datas exatas")
  ativosAtivos: new Set(ATIVOS.map(a => a.id)),
};

function fmtBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
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
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function loadHistorico(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

async function loadTodosHistoricos() {
  const entradas = await Promise.all(ATIVOS.map(a => loadHistorico(a.arquivo)));
  ATIVOS.forEach((a, i) => { historicos[a.id] = entradas[i]; });
}

// último preço conhecido em ou antes de dateStr (forward-fill dos dias sem pregão)
function findPriceOnOrBefore(dateStr, hist) {
  if (!hist || hist.length === 0) return null;
  let lo = 0, hi = hist.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (hist[mid].date <= dateStr) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  if (ans === -1) return null;
  return hist[ans].price;
}

function ativosComDados() {
  return ATIVOS.filter(a => historicos[a.id] && historicos[a.id].length > 0);
}

function intervaloUtilizavel(ids) {
  const hists = ids.map(id => historicos[id]).filter(h => h && h.length > 0);
  if (hists.length === 0) return null;
  const min = hists.map(h => h[0].date).reduce((a, b) => (a > b ? a : b));
  const max = hists.map(h => h[h.length - 1].date).reduce((a, b) => (a < b ? a : b));
  return { min, max };
}

function rankBadge(i) {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `${i + 1}º`;
}

function ativosAtivosOrdenados() {
  return ATIVOS.filter(a => state.ativosAtivos.has(a.id)).map(a => a.id);
}

/* ---------- simulação ---------- */
function simular({ valorInicial, aporte, frequencia, inicio, fim, idsSelecionados }) {
  const stepDias = FREQ_DIAS[frequencia];

  const datas = [];
  let cursor = inicio;
  while (cursor <= fim) {
    datas.push(cursor);
    cursor = addDays(cursor, stepDias);
  }
  if (datas[datas.length - 1] !== fim) datas.push(fim);

  const totalInvestido = valorInicial + aporte * (datas.length - 1);

  const resultadosPorAtivo = {};
  const seriePorAtivo = {};

  idsSelecionados.forEach(id => {
    const hist = historicos[id];
    let unidades = 0;
    const serie = [];

    datas.forEach((data, i) => {
      const preco = findPriceOnOrBefore(data, hist);
      const aporteDoDia = i === 0 ? valorInicial + aporte : aporte;
      unidades += aporteDoDia / preco;
      serie.push({ date: data, valor: unidades * preco });
    });

    const valorFinal = serie[serie.length - 1].valor;
    const lucro = valorFinal - totalInvestido;
    resultadosPorAtivo[id] = {
      id,
      valorFinal,
      lucro,
      lucroPct: totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0,
    };
    seriePorAtivo[id] = serie;
  });

  return { datas, totalInvestido, resultadosPorAtivo, seriePorAtivo };
}

/* ---------- URL de estado ---------- */
function lerEstadoDaURL() {
  const p = new URLSearchParams(location.search);
  if (!p.has("inicio")) return null;
  return {
    valorInicial: parseFloat(p.get("valor")) || 1000,
    aporte: parseFloat(p.get("aporte")) || 200,
    frequencia: p.get("freq") || "mensal",
    inicio: p.get("inicio"),
    fim: p.get("fim"),
    ativosAtivos: new Set((p.get("ativos") || ATIVOS.map(a => a.id).join(",")).split(",")),
  };
}

function escreverEstadoNaURL() {
  const p = new URLSearchParams();
  p.set("valor", state.valorInicial);
  p.set("aporte", state.aporte);
  p.set("freq", state.frequencia);
  p.set("inicio", state.inicio);
  p.set("fim", state.fim);
  p.set("ativos", ativosAtivosOrdenados().join(","));
  history.replaceState(null, "", "?" + p.toString());
}

/* ---------- render ---------- */
function ordenarResultados(resultadosPorAtivo, ids) {
  return ids
    .map(id => ({ ...resultadosPorAtivo[id], ativo: ATIVOS.find(a => a.id === id) }))
    .sort((a, b) => b.valorFinal - a.valorFinal);
}

function dotHtml(cor) {
  return `<span class="legenda-dot" style="background:${cor}"></span>`;
}

function renderPodio(el, ordenado) {
  const top = ordenado.slice(0, 3);
  el.innerHTML = top.map((r, i) => `
    <div class="podio-item ${i === 0 ? 'podio-item--primeiro' : ''}">
      <div class="medalha">${rankBadge(i)}</div>
      <div class="nome">${dotHtml(r.ativo.cor)}${r.ativo.nome}</div>
      <div class="pct" style="color:${r.lucroPct >= 0 ? 'var(--green)' : 'var(--red)'}">${r.lucroPct >= 0 ? '+' : ''}${r.lucroPct.toFixed(1)}%</div>
      <div class="valor">${fmtBRL(r.valorFinal)}</div>
    </div>
  `).join("");
}

function renderRankingCompleto(el, ordenado) {
  el.innerHTML = `
    <table class="ranking-completo">
      <thead><tr><th></th><th>Ativo</th><th>Quanto virou</th><th>Retorno</th></tr></thead>
      <tbody>
        ${ordenado.map((r, i) => `
          <tr>
            <td>${rankBadge(i)}</td>
            <td>${dotHtml(r.ativo.cor)}${r.ativo.nome}</td>
            <td>${fmtBRL(r.valorFinal)}</td>
            <td style="color:${r.lucroPct >= 0 ? 'var(--green)' : 'var(--red)'}">${r.lucroPct >= 0 ? '+' : ''}${r.lucroPct.toFixed(1)}%</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderLegenda(el, onToggle) {
  const disponiveis = ATIVOS.filter(a => historicos[a.id] && historicos[a.id].length > 0);
  el.innerHTML = disponiveis.map(a => `
    <span class="legenda-item ${state.ativosAtivos.has(a.id) ? '' : 'inativo'}" data-id="${a.id}" role="button" tabindex="0">
      ${dotHtml(a.cor)}${a.nome}
    </span>
  `).join("");
  el.querySelectorAll(".legenda-item").forEach(item => {
    item.addEventListener("click", () => onToggle(item.dataset.id));
  });
}

function renderChart(canvasEl, datas, seriePorAtivo, idsSelecionados, totalInvestidoSerie) {
  const ctx = canvasEl.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const passo = Math.max(1, Math.ceil(datas.length / 400));
  const idx = [];
  for (let i = 0; i < datas.length; i += passo) idx.push(i);
  if (idx[idx.length - 1] !== datas.length - 1) idx.push(datas.length - 1);

  const labels = idx.map(i => fmtDateBR(datas[i]));

  const datasets = idsSelecionados.map(id => {
    const ativo = ATIVOS.find(a => a.id === id);
    return {
      label: ativo.nome,
      data: idx.map(i => seriePorAtivo[id][i].valor),
      borderColor: ativo.cor,
      backgroundColor: "transparent",
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.12,
    };
  });

  datasets.push({
    label: "Total investido",
    data: idx.map(i => totalInvestidoSerie[i]),
    borderColor: "rgba(139,147,167,0.35)",
    borderDash: [4, 4],
    borderWidth: 1,
    pointRadius: 0,
    fill: false,
    tension: 0,
  });

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          grid: { color: "#1F2634" },
          ticks: { color: "#8B93A7", maxTicksLimit: 8, font: { family: "JetBrains Mono", size: 10 } },
        },
        y: {
          grid: { color: "#1F2634" },
          ticks: {
            color: "#8B93A7",
            font: { family: "JetBrains Mono", size: 10 },
            callback: (v) => "R$" + (v / 1000).toFixed(0) + "k",
          },
        },
      },
      plugins: {
        legend: { display: false }, // legenda própria (clicável) fica fora do canvas
        tooltip: {
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

function fraseCompartilhamento(ordenado) {
  const medalhas = ["🥇", "🥈", "🥉"];
  const linhas = ordenado.slice(0, 3).map((r, i) =>
    `${medalhas[i]} ${r.ativo.nome} ${r.lucroPct >= 0 ? '+' : ''}${r.lucroPct.toFixed(0)}%`
  );
  return `Entre ${fmtDateBR(state.inicio)} e ${fmtDateBR(state.fim)}, com ${fmtBRL(state.valorInicial)} iniciais e ${fmtBRL(state.aporte)}/${FREQ_LABEL[state.frequencia]}:\n\n${linhas.join("\n")}\n\nSimule o seu período: ${location.href}`;
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

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const errorEl = document.getElementById("comparador-error");
  const podioEl = document.getElementById("comparador-podio");
  const legendaEl = document.getElementById("legenda-ativos");
  const notaCambioEl = document.getElementById("comparador-nota-cambio");
  const chartWrap = document.getElementById("comparador-chart-canvas-wrap");
  const canvasEl = document.getElementById("comparador-chart-canvas");
  const shareBlock = document.getElementById("comparador-share");
  const infoEl = document.getElementById("comparador-data-info");
  const rankingToggleBtn = document.getElementById("btn-ranking-completo");
  const rankingPainel = document.getElementById("ranking-completo-painel");
  const rankingCorpo = document.getElementById("ranking-completo-corpo");

  const premissasTexto = document.getElementById("premissas-texto");
  const premissasEditar = document.getElementById("premissas-editar");
  const btnEditarPremissas = document.getElementById("btn-editar-premissas");
  const valorInicialInput = document.getElementById("valorInicial");
  const aporteInput = document.getElementById("aporte");

  const datasExatasPainel = document.getElementById("datas-exatas");
  const btnDatasExatas = document.getElementById("btn-datas-exatas");
  const inicioInput = document.getElementById("inicio");
  const fimInput = document.getElementById("fim");

  const shareMenuWrap = document.getElementById("share-menu-wrap");
  const shareMenu = document.getElementById("share-menu");
  const btnCompartilhar = document.getElementById("btn-compartilhar");

  await loadTodosHistoricos();

  const disponiveis = ativosComDados();
  if (disponiveis.length < 2) {
    errorEl.innerHTML = "Os dados históricos do comparador ainda estão sendo carregados pela primeira vez — volte em alguns dias. (O Bitcoin já está disponível na <a href=\"/calculadora/\">calculadora dedicada</a> enquanto isso.)";
    document.querySelectorAll(".periodo-tab").forEach(b => b.disabled = true);
    return;
  }

  state.ativosAtivos = new Set(disponiveis.map(a => a.id));
  intervalo = intervaloUtilizavel(disponiveis.map(a => a.id));
  inicioInput.min = intervalo.min;
  inicioInput.max = intervalo.max;
  fimInput.min = intervalo.min;
  fimInput.max = intervalo.max;
  infoEl.textContent = `Dados disponíveis de ${fmtDateBR(intervalo.min)} até ${fmtDateBR(intervalo.max)}.`;

  function atualizarPremissasTexto() {
    premissasTexto.textContent = `Simulando ${fmtBRL(state.valorInicial)} iniciais + ${fmtBRL(state.aporte)}/${FREQ_LABEL[state.frequencia]}`;
  }

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
    document.querySelectorAll(".periodo-tab").forEach(b => b.classList.toggle("active", parseInt(b.dataset.anos, 10) === anos));
    inicioInput.value = state.inicio;
    fimInput.value = state.fim;
  }

  function calcular() {
    errorEl.textContent = "";
    const idsSelecionados = ativosAtivosOrdenados();

    if (idsSelecionados.length < 2 || !state.inicio || !state.fim || state.inicio >= state.fim) {
      return;
    }

    try {
      const { datas, totalInvestido, resultadosPorAtivo, seriePorAtivo } = simular({
        valorInicial: state.valorInicial,
        aporte: state.aporte,
        frequencia: state.frequencia,
        inicio: state.inicio,
        fim: state.fim,
        idsSelecionados,
      });
      const totalInvestidoSerie = datas.map((_, i) =>
        i === 0 ? state.valorInicial + state.aporte : state.valorInicial + state.aporte * (i + 1)
      );

      const ordenado = ordenarResultados(resultadosPorAtivo, idsSelecionados);

      renderPodio(podioEl, ordenado);
      renderRankingCompleto(rankingCorpo, ordenado);
      rankingToggleBtn.textContent = `Ver ranking completo (${idsSelecionados.length} ativos) ${rankingPainel.style.display === "block" ? "▴" : "▾"}`;

      const temCambio = idsSelecionados.includes("sp500") || idsSelecionados.includes("ouro");
      notaCambioEl.style.display = temCambio ? "block" : "none";

      renderChart(canvasEl, datas, seriePorAtivo, idsSelecionados, totalInvestidoSerie);
      chartWrap.style.display = "block";
      shareBlock.style.display = "block";

      ultimoResultado = { ordenado, totalInvestido };
      escreverEstadoNaURL();
    } catch (err) {
      errorEl.textContent = "Não foi possível calcular. Detalhe técnico: " + err.message;
    }
  }
  const calcularDebounced = debounce(calcular, 400);

  // ---------- abas de período ----------
  document.querySelectorAll(".periodo-tab:not(.periodo-tab--secundario)").forEach(btn => {
    btn.addEventListener("click", () => {
      datasExatasPainel.style.display = "none";
      aplicarPeriodoRelativo(parseInt(btn.dataset.anos, 10));
      calcular();
    });
  });

  // ---------- datas exatas ----------
  btnDatasExatas.addEventListener("click", () => {
    inicioInput.value = state.inicio;
    fimInput.value = state.fim;
    datasExatasPainel.style.display = datasExatasPainel.style.display === "block" ? "none" : "block";
  });
  [inicioInput, fimInput].forEach(inp => {
    inp.addEventListener("change", () => {
      if (!inicioInput.value || !fimInput.value || inicioInput.value >= fimInput.value) return;
      state.periodoAnos = null;
      state.inicio = inicioInput.value;
      state.fim = fimInput.value;
      document.querySelectorAll(".periodo-tab").forEach(b => b.classList.remove("active"));
      calcular();
    });
  });

  // ---------- premissas (valor/aporte/frequência), colapsadas por padrão ----------
  btnEditarPremissas.addEventListener("click", () => {
    premissasEditar.style.display = premissasEditar.style.display === "block" ? "none" : "block";
  });
  valorInicialInput.addEventListener("input", () => {
    state.valorInicial = parseFloat(valorInicialInput.value) || 0;
    atualizarPremissasTexto();
    calcularDebounced();
  });
  aporteInput.addEventListener("input", () => {
    state.aporte = parseFloat(aporteInput.value) || 0;
    atualizarPremissasTexto();
    calcularDebounced();
  });
  document.querySelectorAll('input[name="frequencia"]').forEach(radio => {
    radio.addEventListener("change", () => {
      state.frequencia = radio.value;
      atualizarPremissasTexto();
      calcular();
    });
  });

  // ---------- legenda clicável (liga/desliga ativos) ----------
  function onToggleAtivo(id) {
    if (state.ativosAtivos.has(id)) {
      if (state.ativosAtivos.size <= 2) return; // nunca menos de 2 ativos comparados
      state.ativosAtivos.delete(id);
    } else {
      state.ativosAtivos.add(id);
    }
    renderLegenda(legendaEl, onToggleAtivo);
    calcular();
  }
  renderLegenda(legendaEl, onToggleAtivo);

  // ---------- ranking completo ----------
  rankingToggleBtn.addEventListener("click", () => {
    const abrindo = rankingPainel.style.display !== "block";
    rankingPainel.style.display = abrindo ? "block" : "none";
    const n = ativosAtivosOrdenados().length;
    rankingToggleBtn.textContent = `Ver ranking completo (${n} ativos) ${abrindo ? "▴" : "▾"}`;
  });

  // ---------- menu de compartilhar ----------
  btnCompartilhar.addEventListener("click", (e) => {
    e.stopPropagation();
    shareMenu.style.display = shareMenu.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", (e) => {
    if (!shareMenuWrap.contains(e.target)) shareMenu.style.display = "none";
  });
  document.getElementById("btn-copiar-historia").addEventListener("click", (e) => {
    if (!ultimoResultado) return;
    copiarTexto(fraseCompartilhamento(ultimoResultado.ordenado), e.target, "Copiar resultado pronto");
  });
  document.getElementById("btn-copiar-link").addEventListener("click", (e) => {
    copiarTexto(location.href, e.target, "Copiar link");
  });
  document.getElementById("btn-baixar-grafico").addEventListener("click", () => {
    if (!chartInstance) return;
    const a = document.createElement("a");
    a.href = chartInstance.toBase64Image();
    a.download = "comparador-investimentos.png";
    a.click();
  });

  // ---------- estado inicial: URL compartilhada ou padrão de 5 anos ----------
  const estadoURL = lerEstadoDaURL();
  if (estadoURL) {
    state.valorInicial = estadoURL.valorInicial;
    state.aporte = estadoURL.aporte;
    state.frequencia = estadoURL.frequencia;
    state.inicio = estadoURL.inicio;
    state.fim = estadoURL.fim;
    state.periodoAnos = null;
    state.ativosAtivos = new Set([...estadoURL.ativosAtivos].filter(id => historicos[id] && historicos[id].length > 0));
    if (state.ativosAtivos.size < 2) state.ativosAtivos = new Set(disponiveis.map(a => a.id));
    valorInicialInput.value = state.valorInicial;
    aporteInput.value = state.aporte;
    document.querySelector(`input[name="frequencia"][value="${state.frequencia}"]`).checked = true;
    inicioInput.value = state.inicio;
    fimInput.value = state.fim;
    renderLegenda(legendaEl, onToggleAtivo);
  } else {
    aplicarPeriodoRelativo(5);
  }
  atualizarPremissasTexto();
  calcular();
});
