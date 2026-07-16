/* =========================================================
   UTILS.JS — utilitários genéricos compartilhados entre as
   ferramentas do site (Comparador, Calculadora DCA, Comparador de
   Ciclos, Quando Vender Bitcoin?).
   =========================================================
   Carregar este arquivo ANTES do script de cada ferramenta.

   Contém apenas funções puramente utilitárias, sem nenhuma lógica
   específica de ferramenta (simulação, renderização de gráfico,
   estado de URL, texto de compartilhamento etc. continuam em cada
   arquivo próprio, de propósito — ver auditoria de estrutura).
   ========================================================= */

// fundo do ciclo atual do Bitcoin (em formação, sem topo confirmado) —
// fonte única usada pelo Comparador de Ciclos e pelo preview de dado
// real da Home, pra nunca divergir entre os dois. Ver README, seção 9,
// pra fonte do valor e critério de atualização.
const CICLO_ATUAL_FUNDO = { data: "2026-07-01", preco: 58534.28 };

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDateBR(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// núcleo do formato de moeda BRL — cada ferramenta decide o número de
// casas decimais que faz sentido pra ela (ex: Comparador arredonda pra
// inteiro, DCA mostra centavos), por isso o parâmetro é opcional.
function fmtBRLBase(n, maximumFractionDigits) {
  const opts = { style: "currency", currency: "BRL" };
  if (maximumFractionDigits !== undefined) opts.maximumFractionDigits = maximumFractionDigits;
  return n.toLocaleString("pt-BR", opts);
}

// acha o menor número de casas decimais (0 a 2) que faz os ticks de um eixo
// não colidirem no rótulo formatado — evita duplicatas tipo "R$ 3 mil" duas
// vezes seguidas quando dois ticks arredondam pro mesmo valor exibido
function decimalsSemColisao(ticksArray, valueToNumber) {
  if (!ticksArray || ticksArray.length < 2) return 0;
  // ticks com o mesmo valor bruto (comum em escala log, onde o topo de uma
  // década e a base da próxima coincidem) sempre vão colidir, com qualquer
  // número de casas decimais — não contam como colisão real, só o tick
  // duplicado some no autoSkip do próprio Chart.js
  const vistos = new Set();
  const ticksUnicos = ticksArray.filter(t => (vistos.has(t.value) ? false : vistos.add(t.value)));
  if (ticksUnicos.length < 2) return 0;
  for (let d = 0; d <= 2; d++) {
    const labels = ticksUnicos.map(t => valueToNumber(t).toFixed(d));
    if (new Set(labels).size === labels.length) return d;
  }
  return 2;
}

function dotHtml(cor) {
  return `<span class="legenda-dot" style="background:${cor}"></span>`;
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
