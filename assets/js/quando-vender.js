/* =========================================================
   QUANDO-VENDER.JS — "Quando Vender Bitcoin?"
   100% local, mesmo padrão das outras ferramentas do site: sem API,
   sem backend, dados de assets/data/btc-history-usd.json.

   ARQUITETURA — leia antes de mexer:
   O MVP só coleta 1 aporte do usuário (BTC atual + preço médio
   opcional), mas todo o motor de cálculo abaixo é escrito em cima de
   listas de aportes/vendas, nunca de uma variável única de "posição".
   Isso é proposital: o produto pode evoluir para múltiplos aportes,
   histórico de compras/vendas reais e preço médio dinâmico sem reescrever
   nenhuma função aqui — só passar a alimentar `aportes` com mais de 1
   item. Ver docs/roadmap-v2.md.

   As regras dos 3 perfis e a tabela de ciclos são exatamente as
   validadas em docs/produto-quando-vender-bitcoin.md,
   docs/perfis-de-investidor.md e docs/recorrencia-e-mvp-final.md —
   nenhuma regra nova foi introduzida na implementação.
   ========================================================= */

const HISTORICO_URL = "/assets/data/btc-history-usd.json";

// mesma tabela congelada do Comparador de Ciclos (ver README, seção 9,
// e assets/js/comparador-ciclos.js). Duplicada aqui de propósito — não
// importamos o arquivo do Comparador porque ele automaticamente desenha
// um gráfico e espera elementos de DOM que não existem nesta página.
// Qualquer atualização daquela tabela precisa ser replicada aqui.
const CICLOS = [
  { id: "2011-2013", fundo: { data: "2011-11-22", preco: 2.30 },  topo: { data: "2013-12-05", preco: 1137 } },
  { id: "2015-2017", fundo: { data: "2015-01-14", preco: 152 },   topo: { data: "2017-12-17", preco: 19783 } },
  { id: "2018-2021", fundo: { data: "2018-12-07", preco: 3122 },  topo: { data: "2021-11-10", preco: 68789 } },
  { id: "2022-2025", fundo: { data: "2022-11-21", preco: 15476 }, topo: { data: "2025-10-06", preco: 126296 } },
];

// último fundo de ciclo CONFIRMADO — referência fixa da Tela Ciclo Atual
// (ver docs/recorrencia-e-mvp-final.md, exemplo real usado nos 3 perfis).
// Não é o fundo provisório do ciclo em andamento (esse ainda não tem
// consenso de mercado formado — ver README, seção 9).
const CICLO_ATUAL_FUNDO_DATA = "2022-11-21";
const CICLO_ATUAL_FUNDO_PRECO = 15476;

// ---------- perfis (mesmos parâmetros de docs/perfis-de-investidor.md,
// com o piso de idade corrigido para ser recorrente — correção descrita
// em docs/recorrencia-e-mvp-final.md, §2, "buraco que o exemplo real
// expôs": sem isso, a Tela Ciclo Atual fica sem próximo gatilho em bear
// markets longos, exatamente quando mais importa) ----------
const PERFIS = {
  preservacao: {
    id: "preservacao",
    nome: "Preservação",
    icone: "🛡",
    frase: "Recuperar 100% do capital investido o mais cedo possível. Prioriza eliminar risco.",
    tetoEventoRecuperacao: 0.50,
    trimPosRecuperacao: 0.05,
    pisoIdade: { marcos: [], recorrencia: null },
  },
  equilibrio: {
    id: "equilibrio",
    nome: "Equilíbrio",
    icone: "⚖",
    frase: "Recupera capital e mantém a maior parte da posição. Busca equilíbrio entre participação na alta e realização.",
    tetoEventoRecuperacao: 0.15,
    trimPosRecuperacao: 0,
    pisoIdade: { marcos: [[18, 0.10], [24, 0.20], [30, 0.30]], recorrencia: { intervaloMeses: 12, incremento: 0.05, teto: 0.60 } },
  },
  conviccao: {
    id: "conviccao",
    nome: "Convicção",
    icone: "💎",
    frase: "Realizações menores. Aceita maior volatilidade para preservar mais BTC.",
    tetoEventoRecuperacao: 0,
    trimPosRecuperacao: 0,
    pisoIdade: { marcos: [[24, 0.05], [36, 0.10]], recorrencia: { intervaloMeses: 12, incremento: 0.05, teto: 0.30 } },
  },
};

// ---------- utilidades de data/formatação ----------
function mesesEntre(d0, d1) {
  return (new Date(d1) - new Date(d0)) / 86400000 / 30.4375;
}
function fmtUSD(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 });
}
function fmtPct(n, casas = 0) {
  return `${n.toFixed(casas)}%`;
}
function fmtData(d) {
  const [ano, mes, dia] = d.split("-");
  return `${dia}/${mes}/${ano}`;
}

// ---------- carregamento dos dados históricos ----------
let PRECOS = null;
let DATAS_ORDENADAS = null;
let ULTIMA_DATA = null;

async function carregarHistorico() {
  if (PRECOS) return;
  const res = await fetch(HISTORICO_URL);
  const dados = await res.json();
  PRECOS = {};
  dados.forEach(d => { if (d.price > 0) PRECOS[d.date] = d.price; });
  DATAS_ORDENADAS = Object.keys(PRECOS).sort();
  ULTIMA_DATA = DATAS_ORDENADAS[DATAS_ORDENADAS.length - 1];
}

function athAntesDe(dataInicio) {
  let ath = 0;
  for (const d of DATAS_ORDENADAS) {
    if (d >= dataInicio) break;
    if (PRECOS[d] > ath) ath = PRECOS[d];
  }
  return ath;
}

function datasNoIntervalo(d0, d1) {
  return DATAS_ORDENADAS.filter(d => d >= d0 && d <= d1);
}

// ---------- piso de idade (recorrente além do último marco definido) ----------
function alvoIdade(perfil, idadeMeses) {
  const { marcos, recorrencia } = perfil.pisoIdade;
  if (marcos.length === 0) return 0;
  let alvo = 0;
  for (const [marco, pct] of marcos) {
    if (idadeMeses >= marco) alvo = pct;
  }
  if (recorrencia) {
    const [ultimoMarco, ultimoPct] = marcos[marcos.length - 1];
    if (idadeMeses > ultimoMarco) {
      const passos = Math.floor((idadeMeses - ultimoMarco) / recorrencia.intervaloMeses);
      alvo = Math.min(recorrencia.teto, ultimoPct + passos * recorrencia.incremento);
    }
  }
  return alvo;
}

// próximo marco de idade a partir de hoje — usado no campo "próximo
// gatilho" da Tela Ciclo Atual; null quando o perfil não tem piso de
// idade (Preservação) ou já atingiu o teto de recorrência.
function proximoMarcoIdade(perfil, idadeAtual) {
  const { marcos, recorrencia } = perfil.pisoIdade;
  if (marcos.length === 0) return null;
  for (const [marco, pct] of marcos) {
    if (idadeAtual < marco) return { meses: marco, alvo: pct };
  }
  const [ultimoMarco, ultimoPct] = marcos[marcos.length - 1];
  if (!recorrencia) return null;
  const passosAtuais = Math.floor((idadeAtual - ultimoMarco) / recorrencia.intervaloMeses);
  const alvoAtual = Math.min(recorrencia.teto, ultimoPct + passosAtuais * recorrencia.incremento);
  if (alvoAtual >= recorrencia.teto) return null;
  const proximoMeses = ultimoMarco + (passosAtuais + 1) * recorrencia.intervaloMeses;
  const proximoAlvo = Math.min(recorrencia.teto, ultimoPct + (passosAtuais + 1) * recorrencia.incremento);
  return { meses: proximoMeses, alvo: proximoAlvo };
}

// ---------- motor de simulação (porta fiel dos backtests em Python já
// validados nos documentos anteriores — nenhuma regra nova aqui) ----------
function simularPerfil(perfilKey, aporte, dataInicio, dataFim) {
  const perfil = PERFIS[perfilKey];
  const capital = aporte.btc * aporte.precoUsd;
  let btc = aporte.btc;
  let usd = 0;
  let runningAth = athAntesDe(dataInicio);
  const vendas = [];
  let mesesRecuperacao = null;

  for (const d of datasNoIntervalo(dataInicio, dataFim)) {
    const p = PRECOS[d];
    const idade = mesesEntre(dataInicio, d);

    if (p > runningAth) {
      runningAth = p;
      if (usd < capital) {
        const faltante = capital - usd;
        const tetoBtc = btc * perfil.tetoEventoRecuperacao;
        const venda = Math.min(faltante / p, tetoBtc, btc);
        if (venda > 1e-9) {
          btc -= venda; usd += venda * p;
          vendas.push({ data: d, preco: p, btc: venda, motivo: "recuperacao" });
          if (usd >= capital && mesesRecuperacao === null) mesesRecuperacao = idade;
        }
      } else if (perfil.trimPosRecuperacao > 0) {
        const venda = btc * perfil.trimPosRecuperacao;
        btc -= venda; usd += venda * p;
        vendas.push({ data: d, preco: p, btc: venda, motivo: "trim" });
      }
    }

    const vendidoTotalFracao = 1 - (btc / aporte.btc);
    const alvo = alvoIdade(perfil, idade);
    if (alvo > vendidoTotalFracao + 1e-9) {
      const fracaoRestante = 1 - vendidoTotalFracao;
      const venda = fracaoRestante > 1e-9 ? btc * ((alvo - vendidoTotalFracao) / fracaoRestante) : 0;
      if (venda > 1e-9) {
        btc -= venda; usd += venda * p;
        vendas.push({ data: d, preco: p, btc: venda, motivo: "idade" });
        if (usd >= capital && mesesRecuperacao === null) mesesRecuperacao = idade;
      }
    }
  }

  return { btcRestante: btc, usdRealizado: usd, capital, vendas, runningAth, mesesRecuperacao };
}

// ---------- Tela de Resultado: backtest contra os 4 ciclos históricos.
// Assume, para os 4 ciclos, que a posição atual do usuário foi comprada
// no FUNDO daquele ciclo específico (não no preço médio real dele) — é
// a mesma simplificação metodológica de docs/perfis-de-investidor.md,
// necessária para comparar ciclos de magnitudes muito diferentes de
// forma justa. ----------
function rodarBacktestHistorico(perfilKey, btcAtual) {
  return CICLOS.map(ciclo => {
    const aporte = { btc: btcAtual, precoUsd: ciclo.fundo.preco };
    const r = simularPerfil(perfilKey, aporte, ciclo.fundo.data, ciclo.topo.data);
    const valorBtcRestante = r.btcRestante * ciclo.topo.preco;
    const patrimonioTopo = r.usdRealizado + valorBtcRestante;
    const hodlTopo = btcAtual * ciclo.topo.preco;
    return {
      ciclo: ciclo.id,
      capitalRecuperadoPct: r.usdRealizado / r.capital * 100,
      btcRestante: r.btcRestante,
      exposicaoPct: patrimonioTopo > 0 ? valorBtcRestante / patrimonioTopo * 100 : 0,
      patrimonioTopo,
      hodlTopo,
    };
  });
}

// ---------- Tela Ciclo Atual: roda o perfil desde o fundo do último
// ciclo confirmado até hoje, sem parar no topo confirmado — o estado
// "vivo" do produto. ----------
function rodarCicloAtual(perfilKey, btcAtual, precoMedioInformado) {
  const precoMedio = precoMedioInformado > 0 ? precoMedioInformado : CICLO_ATUAL_FUNDO_PRECO;
  const aporte = { btc: btcAtual, precoUsd: precoMedio };
  const r = simularPerfil(perfilKey, aporte, CICLO_ATUAL_FUNDO_DATA, ULTIMA_DATA);
  const perfil = PERFIS[perfilKey];

  const precoHoje = PRECOS[ULTIMA_DATA];
  const idadeHoje = mesesEntre(CICLO_ATUAL_FUNDO_DATA, ULTIMA_DATA);
  const valorBtcRestante = r.btcRestante * precoHoje;
  const patrimonioHoje = r.usdRealizado + valorBtcRestante;
  const capitalRecuperadoPct = r.usdRealizado / r.capital * 100;
  const exposicaoPct = patrimonioHoje > 0 ? valorBtcRestante / patrimonioHoje * 100 : 0;

  const gatilhoIdade = proximoMarcoIdade(perfil, idadeHoje);
  const faltaAltaPct = r.runningAth > precoHoje ? (r.runningAth / precoHoje - 1) * 100 : 0;

  const ultimaAcao = r.vendas.length ? r.vendas[r.vendas.length - 1] : null;

  return {
    precoHoje, patrimonioHoje, capitalRecuperadoPct, exposicaoPct,
    btcRestante: r.btcRestante, runningAth: r.runningAth, faltaAltaPct,
    gatilhoIdade, idadeHoje, ultimaAcao, perfilKey,
  };
}

// ======================= RENDERIZAÇÃO / UI =======================

let perfilAtivo = "equilibrio";

function selecionarPerfil(perfilKey) {
  perfilAtivo = perfilKey;
  document.querySelectorAll("[data-perfil-card]").forEach(el => {
    el.classList.toggle("perfil-card--ativo", el.dataset.perfilCard === perfilKey);
  });
  const chip = document.getElementById("qvb-chip-perfil");
  if (chip) chip.textContent = `${PERFIS[perfilKey].icone} ${PERFIS[perfilKey].nome}`;
}

function motivoLabel(motivo) {
  if (motivo === "recuperacao") return "recuperação de capital";
  if (motivo === "idade") return "piso de idade";
  if (motivo === "trim") return "realização contínua pós-recuperação";
  return motivo;
}

async function aoSubmeterOnboarding(ev) {
  ev.preventDefault();
  const erroEl = document.getElementById("qvb-erro");
  erroEl.textContent = "";

  const btcAtual = parseFloat(document.getElementById("qvb-btc").value);
  const precoMedio = parseFloat(document.getElementById("qvb-preco-medio").value) || 0;

  if (!btcAtual || btcAtual <= 0) {
    erroEl.textContent = "Informe quanto Bitcoin você tem hoje (um número maior que zero).";
    return;
  }

  await carregarHistorico();

  renderResultado(btcAtual);
  renderCicloAtual(btcAtual, precoMedio);

  document.getElementById("resultado").hidden = false;
  document.getElementById("ciclo-atual").hidden = false;
  document.getElementById("resultado").scrollIntoView({ behavior: "smooth" });
}

function renderResultado(btcAtual) {
  const resultados = rodarBacktestHistorico(perfilAtivo, btcAtual);
  const perfil = PERFIS[perfilAtivo];
  const principal = resultados[resultados.length - 1]; // ciclo mais recente confirmado (2022→2025)

  document.getElementById("qvb-resultado-frase").textContent =
    `Se você tivesse seguido o perfil ${perfil.nome} desde o fundo do ciclo de 2022 até o topo de 2025, ` +
    `teria recuperado ${fmtPct(principal.capitalRecuperadoPct)} do que investiu e ainda manteria ` +
    `${fmtPct(principal.exposicaoPct)} do patrimônio em Bitcoin.`;

  document.getElementById("qvb-stat-capital").textContent = fmtPct(principal.capitalRecuperadoPct);
  document.getElementById("qvb-stat-exposicao").textContent = fmtPct(principal.exposicaoPct);
  const protecao = principal.patrimonioTopo - principal.hodlTopo;
  document.getElementById("qvb-stat-protecao").textContent = `${protecao >= 0 ? "+" : ""}${fmtUSD(protecao)}`;

  const outrosCorpo = document.getElementById("qvb-outros-ciclos-corpo");
  outrosCorpo.innerHTML = resultados.slice(0, -1).map(r => `
    <tr>
      <td>${r.ciclo}</td>
      <td>${fmtPct(r.capitalRecuperadoPct)}</td>
      <td>${fmtPct(r.exposicaoPct)}</td>
      <td>${(r.patrimonioTopo - r.hodlTopo) >= 0 ? "+" : ""}${fmtUSD(r.patrimonioTopo - r.hodlTopo)}</td>
    </tr>
  `).join("");
}

function renderCicloAtual(btcAtual, precoMedio) {
  const r = rodarCicloAtual(perfilAtivo, btcAtual, precoMedio);
  const perfil = PERFIS[perfilAtivo];

  document.getElementById("qvb-ca-capital").textContent = fmtPct(r.capitalRecuperadoPct);
  document.getElementById("qvb-ca-exposicao").textContent = fmtPct(r.exposicaoPct);

  // próximo gatilho — mostra preço e idade quando os dois existirem
  const blocos = [];
  if (r.faltaAltaPct > 0.05) {
    blocos.push(`<p><strong>Por preço:</strong> novo recorde histórico acima de ${fmtUSD(r.runningAth)} (faltam ${fmtPct(r.faltaAltaPct, 1)} de alta).</p>`);
  } else {
    blocos.push(`<p><strong>Por preço:</strong> qualquer novo recorde acima do preço de hoje (${fmtUSD(r.precoHoje)}) já dispara a regra.</p>`);
  }
  if (r.gatilhoIdade) {
    const faltamMeses = r.gatilhoIdade.meses - r.idadeHoje;
    blocos.push(`<p><strong>Por idade do ciclo:</strong> aos ${r.gatilhoIdade.meses} meses, sua regra realiza até ${fmtPct(r.gatilhoIdade.alvo * 100)} da posição original (faltam ${faltamMeses.toFixed(1)} meses).</p>`);
  } else {
    blocos.push(`<p><strong>Por idade do ciclo:</strong> nenhum piso adicional programado para este perfil.</p>`);
  }
  document.getElementById("qvb-ca-gatilho").innerHTML = blocos.join("");

  const ultimaEl = document.getElementById("qvb-ca-ultima-acao");
  if (r.ultimaAcao) {
    ultimaEl.textContent = `${fmtData(r.ultimaAcao.data)} · preço ${fmtUSD(r.ultimaAcao.preco)} — ${motivoLabel(r.ultimaAcao.motivo)}, realizou ${fmtPct(r.ultimaAcao.btc / btcAtual * 100, 1)} da posição original.`;
  } else {
    ultimaEl.textContent = "Nenhuma ação simulada ainda desde o fundo do ciclo de 2022.";
  }

  const proximaEl = document.getElementById("qvb-ca-proxima-acao");
  if (r.gatilhoIdade && (!r.faltaAltaPct || r.gatilhoIdade.meses - r.idadeHoje < 6)) {
    proximaEl.textContent = `Aos ${r.gatilhoIdade.meses} meses de idade do ciclo, sua regra realizaria até ${fmtPct(r.gatilhoIdade.alvo * 100)} da posição original, independente do preço.`;
  } else {
    proximaEl.textContent = `Se o preço romper ${fmtUSD(r.runningAth)}, sua regra do perfil ${perfil.nome} realizaria parte do que resta da posição.`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-perfil-card]").forEach(el => {
    el.querySelector("[data-acao='escolher-perfil']").addEventListener("click", () => {
      selecionarPerfil(el.dataset.perfilCard);
      document.getElementById("onboarding").scrollIntoView({ behavior: "smooth" });
    });
  });

  selecionarPerfil(perfilAtivo);

  document.getElementById("qvb-form-onboarding").addEventListener("submit", aoSubmeterOnboarding);
});
