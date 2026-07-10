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
   ========================================================= */

const ATIVOS = [
  { id: "btc",      nome: "Bitcoin",  arquivo: "/assets/data/btc-history.json",      cor: "#F2A93B" },
  { id: "cdi",      nome: "CDI",      arquivo: "/assets/data/cdi-history.json",      cor: "#7C879C" },
  { id: "ibovespa", nome: "Ibovespa", arquivo: "/assets/data/ibovespa-history.json", cor: "#4CAF7D" },
  { id: "ouro",     nome: "Ouro",     arquivo: "/assets/data/gold-history.json",     cor: "#C9A227" },
  { id: "sp500",    nome: "S&P 500",  arquivo: "/assets/data/sp500-history.json",    cor: "#5B8DEF" },
];

const FREQ_DIAS = { mensal: 30, semanal: 7, diaria: 1 };

let historicos = {}; // id -> [{date, price}] ordenado por data
let chartInstance = null;
let ultimoResultado = null; // guardado para os botões de compartilhar

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
  if (ans === -1) return null; // dateStr é anterior a todo o histórico
  return hist[ans].price;
}

function ativosComDados() {
  return ATIVOS.filter(a => historicos[a.id] && historicos[a.id].length > 0);
}

// intervalo de datas em que TODOS os ativos selecionados têm dado —
// evita comparar um ativo fora do período em que ele existe.
function intervaloUtilizavel(idsSelecionados) {
  const hists = idsSelecionados.map(id => historicos[id]).filter(h => h && h.length > 0);
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

/* ---------- simulação ---------- */
function simular({ valorInicial, aporte, frequencia, inicio, fim, idsSelecionados }) {
  const stepDias = FREQ_DIAS[frequencia];

  // datas de aporte idênticas para todos os ativos
  const datas = [];
  let cursor = inicio;
  while (cursor <= fim) {
    datas.push(cursor);
    cursor = addDays(cursor, stepDias);
  }
  if (datas[datas.length - 1] !== fim) datas.push(fim);

  const totalInvestido = valorInicial + aporte * (datas.length - 1);

  const resultadosPorAtivo = {};
  const seriePorAtivo = {}; // id -> [{date, valor}]

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
    idsSelecionados: (p.get("ativos") || ATIVOS.map(a => a.id).join(",")).split(","),
  };
}

function escreverEstadoNaURL(inputs) {
  const p = new URLSearchParams();
  p.set("valor", inputs.valorInicial);
  p.set("aporte", inputs.aporte);
  p.set("freq", inputs.frequencia);
  p.set("inicio", inputs.inicio);
  p.set("fim", inputs.fim);
  p.set("ativos", inputs.idsSelecionados.join(","));
  history.replaceState(null, "", "?" + p.toString());
}

/* ---------- render ---------- */
function renderRanking(el, resultadosPorAtivo, idsSelecionados) {
  const ordenado = idsSelecionados
    .map(id => ({ ...resultadosPorAtivo[id], ativo: ATIVOS.find(a => a.id === id) }))
    .sort((a, b) => b.valorFinal - a.valorFinal);

  el.innerHTML = ordenado.map((r, i) => `
    <div class="ranking-row">
      <span class="ranking-badge">${rankBadge(i)}</span>
      <span class="ranking-nome" style="border-color:${r.ativo.cor}">${r.ativo.nome}</span>
      <span class="ranking-valor">${fmtBRL(r.valorFinal)}</span>
      <span class="ranking-pct" style="color:${r.lucroPct >= 0 ? 'var(--green)' : 'var(--red)'}">${r.lucroPct >= 0 ? '+' : ''}${r.lucroPct.toFixed(1)}%</span>
      <span class="ranking-lucro" style="color:${r.lucro >= 0 ? 'var(--green)' : 'var(--red)'}">${r.lucro >= 0 ? '+' : ''}${fmtBRL(r.lucro)}</span>
    </div>
  `).join("");

  return ordenado;
}

function renderChart(canvasEl, datas, seriePorAtivo, idsSelecionados, totalInvestidoSerie) {
  const ctx = canvasEl.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  // downsample: se houver muitos pontos (aporte diário em período longo),
  // mostra no máximo ~400 no gráfico — o cálculo em si continua exato,
  // só a linha desenhada é mais leve.
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
        legend: { labels: { color: "#F2F3F5", font: { family: "Inter", size: 12 } } },
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

function fraseCompartilhamento(ordenado, inputs) {
  const partes = ordenado.map(r => `${fmtBRL(r.valorFinal)} em ${r.ativo.nome}`);
  const total = fmtBRL(inputs.valorInicial + inputs.aporte);
  return `Se eu tivesse investido de ${fmtDateBR(inputs.inicio)} a ${fmtDateBR(inputs.fim)}, meu dinheiro teria virado: ${partes.join(", ")}.`;
}

async function copiarTexto(texto, botao, textoOriginal) {
  try {
    await navigator.clipboard.writeText(texto);
    botao.textContent = "Copiado!";
  } catch (e) {
    botao.textContent = "Não foi possível copiar";
  }
  setTimeout(() => { botao.textContent = textoOriginal; }, 1800);
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("comparador-form");
  const errorEl = document.getElementById("comparador-error");
  const rankingEl = document.getElementById("comparador-ranking");
  const notaEl = document.getElementById("comparador-nota");
  const notaCambioEl = document.getElementById("comparador-nota-cambio");
  const chartWrap = document.getElementById("comparador-chart-wrap");
  const canvasEl = document.getElementById("comparador-chart-canvas");
  const shareBlock = document.getElementById("comparador-share");
  const infoEl = document.getElementById("comparador-data-info");

  const valorInicialInput = document.getElementById("valorInicial");
  const aporteInput = document.getElementById("aporte");
  const inicioInput = document.getElementById("inicio");
  const fimInput = document.getElementById("fim");
  const ativoCheckboxes = () => Array.from(document.querySelectorAll(".ativo-checkbox"));

  await loadTodosHistoricos();

  const disponiveis = ativosComDados();
  if (disponiveis.length < 2) {
    errorEl.innerHTML = "Os dados históricos do comparador ainda estão sendo carregados pela primeira vez — volte em alguns dias. (O Bitcoin já está disponível na <a href=\"/calculadora/\">calculadora dedicada</a> enquanto isso.)";
    form.querySelector("button[type=submit]").disabled = true;
    return;
  }

  // desmarca e desabilita ativos sem dado ainda
  ativoCheckboxes().forEach(cb => {
    if (!historicos[cb.value] || historicos[cb.value].length === 0) {
      cb.checked = false;
      cb.disabled = true;
      cb.closest("label").title = "Dados ainda não disponíveis para este ativo.";
    }
  });

  const idsIniciais = disponiveis.map(a => a.id);
  const intervalo = intervaloUtilizavel(idsIniciais);
  inicioInput.min = intervalo.min;
  inicioInput.max = intervalo.max;
  fimInput.min = intervalo.min;
  fimInput.max = intervalo.max;
  infoEl.textContent = `Dados disponíveis de ${fmtDateBR(intervalo.min)} até ${fmtDateBR(intervalo.max)}.`;

  // atalhos de período
  document.querySelectorAll(".periodo-atalho").forEach(btn => {
    btn.addEventListener("click", () => {
      const anos = parseInt(btn.dataset.anos, 10);
      fimInput.value = intervalo.max;
      if (anos === 0) {
        inicioInput.value = intervalo.min; // "máximo"
      } else {
        const d = new Date(intervalo.max + "T00:00:00");
        d.setFullYear(d.getFullYear() - anos);
        const alvo = d.toISOString().slice(0, 10);
        inicioInput.value = alvo < intervalo.min ? intervalo.min : alvo;
      }
      form.requestSubmit();
    });
  });

  function calcular(inputsForcados) {
    errorEl.textContent = "";

    const idsSelecionados = inputsForcados
      ? inputsForcados.idsSelecionados
      : ativoCheckboxes().filter(cb => cb.checked).map(cb => cb.value);

    if (idsSelecionados.length < 2) {
      errorEl.textContent = "Selecione pelo menos 2 ativos para comparar.";
      return;
    }

    const inputs = inputsForcados || {
      valorInicial: parseFloat(valorInicialInput.value) || 0,
      aporte: parseFloat(aporteInput.value) || 0,
      frequencia: document.querySelector('input[name="frequencia"]:checked').value,
      inicio: inicioInput.value,
      fim: fimInput.value,
      idsSelecionados,
    };

    if (!inputs.inicio || !inputs.fim || inputs.inicio >= inputs.fim) {
      errorEl.textContent = "A data inicial precisa ser antes da data final.";
      return;
    }

    // aplica de volta nos campos, caso tenha vindo da URL
    valorInicialInput.value = inputs.valorInicial;
    aporteInput.value = inputs.aporte;
    inicioInput.value = inputs.inicio;
    fimInput.value = inputs.fim;
    document.querySelector(`input[name="frequencia"][value="${inputs.frequencia}"]`).checked = true;
    ativoCheckboxes().forEach(cb => { cb.checked = inputs.idsSelecionados.includes(cb.value); });

    try {
      const { datas, totalInvestido, resultadosPorAtivo, seriePorAtivo } = simular(inputs);
      const totalInvestidoSerie = datas.map((_, i) =>
        i === 0 ? inputs.valorInicial + inputs.aporte : inputs.valorInicial + inputs.aporte * (i + 1)
      );

      const ordenado = renderRanking(rankingEl, resultadosPorAtivo, inputs.idsSelecionados);

      const vencedor = ordenado[0];
      const perdedor = ordenado[ordenado.length - 1];
      notaEl.textContent = `No período selecionado, ${vencedor.ativo.nome} teve o maior valor final (${fmtBRL(vencedor.valorFinal)}) e ${perdedor.ativo.nome} o menor (${fmtBRL(perdedor.valorFinal)}). Total investido: ${fmtBRL(totalInvestido)}.`;

      const temCambio = inputs.idsSelecionados.includes("sp500") || inputs.idsSelecionados.includes("ouro");
      notaCambioEl.style.display = temCambio ? "block" : "none";

      renderChart(canvasEl, datas, seriePorAtivo, inputs.idsSelecionados, totalInvestidoSerie);
      chartWrap.style.display = "block";
      shareBlock.style.display = "flex";

      ultimoResultado = { ordenado, inputs };
      escreverEstadoNaURL(inputs);
    } catch (err) {
      errorEl.textContent = "Não foi possível calcular. Detalhe técnico: " + err.message;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calcular();
  });

  document.getElementById("btn-copiar-link").addEventListener("click", (e) => {
    copiarTexto(location.href, e.target, "Copiar link desta simulação");
  });
  document.getElementById("btn-copiar-frase").addEventListener("click", (e) => {
    if (!ultimoResultado) return;
    const frase = fraseCompartilhamento(ultimoResultado.ordenado, ultimoResultado.inputs);
    copiarTexto(frase, e.target, "Copiar frase pronta");
  });
  document.getElementById("btn-baixar-grafico").addEventListener("click", () => {
    if (!chartInstance) return;
    const a = document.createElement("a");
    a.href = chartInstance.toBase64Image();
    a.download = "comparador-investimentos.png";
    a.click();
  });

  // estado inicial: vem da URL (compartilhada) ou padrão de 5 anos
  const estadoURL = lerEstadoDaURL();
  if (estadoURL) {
    calcular(estadoURL);
  } else {
    const d = new Date(intervalo.max + "T00:00:00");
    d.setFullYear(d.getFullYear() - 5);
    const cincoAnos = d.toISOString().slice(0, 10);
    inicioInput.value = cincoAnos < intervalo.min ? intervalo.min : cincoAnos;
    fimInput.value = intervalo.max;
    calcular();
  }
});
