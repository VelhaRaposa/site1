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
