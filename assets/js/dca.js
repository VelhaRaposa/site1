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

   OBSERVAÇÃO IMPORTANTE: a "data final" máxima disponível para
   simulação é sempre a última data presente no arquivo — o próprio
   formulário ajusta isso automaticamente.
   ========================================================= */

let currentMode = "dca";
let priceHistory = []; // [{date, price}], ordenado por data
let chartInstance = null;

async function loadHistory() {
  const res = await fetch("assets/data/btc-history.json");
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

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDateBR(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("dca-form");
  const resultEl = document.getElementById("dca-result");
  const errorEl = document.getElementById("dca-error");
  const chartWrap = document.getElementById("dca-chart-canvas-wrap");
  const tableSection = document.getElementById("dca-table-section");
  const tableBody = document.getElementById("dca-table-body");
  const infoEl = document.getElementById("dca-data-info");

  try {
    priceHistory = await loadHistory();
  } catch (e) {
    errorEl.textContent = "Não foi possível carregar os dados históricos locais (" + e.message + "). Verifique se o arquivo assets/data/btc-history.json existe.";
    form.querySelector("button[type=submit]").disabled = true;
    return;
  }

  const minDate = priceHistory[0].date;
  const maxDate = priceHistory[priceHistory.length - 1].date;

  const inicioInput = document.getElementById("inicio");
  const fimInput = document.getElementById("fim");
  inicioInput.min = minDate;
  inicioInput.max = maxDate;
  fimInput.min = minDate;
  fimInput.max = maxDate;

  // datas padrão: últimos 6 meses disponíveis no arquivo local
  fimInput.value = maxDate;
  const seisMesesAntes = new Date(maxDate + "T00:00:00");
  seisMesesAntes.setMonth(seisMesesAntes.getMonth() - 6);
  inicioInput.value = seisMesesAntes.toISOString().slice(0, 10) < minDate ? minDate : seisMesesAntes.toISOString().slice(0, 10);

  infoEl.textContent = `Dados disponíveis de ${fmtDateBR(minDate)} até ${fmtDateBR(maxDate)}.`;

  // alterna entre abas DCA / Lump Sum
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      document.getElementById("campo-valor-dca").style.display = currentMode === "dca" ? "block" : "none";
      document.getElementById("campo-valor-lump").style.display = currentMode === "lump" ? "block" : "none";
    });
  });

  function renderChart(labels, investidoSerie, valorSerie) {
    chartWrap.style.display = "block";
    const ctx = document.getElementById("dca-chart-canvas").getContext("2d");
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Valor da carteira",
            data: valorSerie,
            borderColor: "#F7931A",
            backgroundColor: "rgba(247,147,26,0.08)",
            borderWidth: 2.5,
            pointRadius: 0,
            fill: true,
            tension: 0.15,
          },
          {
            label: "Total investido",
            data: investidoSerie,
            borderColor: "#5B6478",
            borderDash: [4, 4],
            borderWidth: 1.5,
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
            callbacks: {
              label: (item) => item.dataset.label + ": " + fmtBRL(item.raw),
            },
          },
        },
      },
    });
  }

  function renderTable(rows) {
    tableSection.style.display = "block";
    tableBody.innerHTML = rows.map(r => `
      <tr>
        <td>${fmtDateBR(r.date)}</td>
        <td>${fmtBRL(r.preco)}</td>
        <td>${fmtBRL(r.aportado)}</td>
        <td>${r.btcComprado.toFixed(8)}</td>
        <td>${r.btcAcumulado.toFixed(8)}</td>
        <td>${fmtBRL(r.patrimonio)}</td>
      </tr>
    `).join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    resultEl.innerHTML = "";
    chartWrap.style.display = "none";
    tableSection.style.display = "none";

    const inicio = inicioInput.value;
    const fim = fimInput.value;

    if (!inicio || !fim || inicio >= fim) {
      errorEl.textContent = "A data inicial precisa ser antes da data final.";
      return;
    }

    try {
      const precoFinal = findPrice(fim);
      const rows = [];
      const chartLabels = [];
      const chartInvestido = [];
      const chartValor = [];

      let totalInvestido = 0;
      let totalBTC = 0;

      if (currentMode === "lump") {
        const valorTotal = parseFloat(document.getElementById("valor-lump").value);
        const precoCompra = findPrice(inicio);
        totalInvestido = valorTotal;
        totalBTC = valorTotal / precoCompra;

        rows.push({
          date: inicio, preco: precoCompra, aportado: valorTotal,
          btcComprado: totalBTC, btcAcumulado: totalBTC, patrimonio: totalBTC * precoCompra,
        });

        // snapshots mensais pra tabela e gráfico
        let cursor = inicio;
        while (cursor <= fim) {
          const preco = findPrice(cursor);
          chartLabels.push(fmtDateBR(cursor));
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
        const valorPeriodo = parseFloat(document.getElementById("valor").value);
        const freq = document.getElementById("frequencia").value;
        const stepDays = freq === "daily" ? 1 : freq === "weekly" ? 7 : 30;

        let cursor = inicio;
        while (cursor <= fim) {
          const preco = findPrice(cursor);
          const btcComprado = valorPeriodo / preco;
          totalBTC += btcComprado;
          totalInvestido += valorPeriodo;

          rows.push({
            date: cursor, preco, aportado: valorPeriodo,
            btcComprado, btcAcumulado: totalBTC, patrimonio: totalBTC * preco,
          });
          chartLabels.push(fmtDateBR(cursor));
          chartInvestido.push(totalInvestido);
          chartValor.push(totalBTC * preco);

          cursor = addDays(cursor, stepDays);
        }
      }

      const valorAtual = totalBTC * precoFinal;
      const lucro = valorAtual - totalInvestido;
      const lucroPct = totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0;
      const precoMedio = totalInvestido / (totalBTC || 1);

      resultEl.innerHTML = `
        <div class="grid grid-3">
          <div class="stat"><div class="num">${fmtBRL(totalInvestido)}</div><div class="label">total investido</div></div>
          <div class="stat"><div class="num">${totalBTC.toFixed(6)}</div><div class="label">BTC acumulado</div></div>
          <div class="stat"><div class="num">${fmtBRL(precoMedio)}</div><div class="label">preço médio de compra</div></div>
          <div class="stat"><div class="num" style="color:${lucro >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtBRL(valorAtual)}</div><div class="label">valor em ${fmtDateBR(fim)}</div></div>
          <div class="stat"><div class="num" style="color:${lucroPct >= 0 ? 'var(--green)' : 'var(--red)'}">${lucroPct >= 0 ? '+' : ''}${lucroPct.toFixed(1)}%</div><div class="label">rentabilidade</div></div>
          <div class="stat"><div class="num" style="color:${lucro >= 0 ? 'var(--green)' : 'var(--red)'}">${lucro >= 0 ? '+' : ''}${fmtBRL(lucro)}</div><div class="label">rentabilidade em R$</div></div>
        </div>
      `;

      renderChart(chartLabels, chartInvestido, chartValor);
      renderTable(rows);

    } catch (err) {
      errorEl.textContent = "Não foi possível calcular. Detalhe técnico: " + err.message;
    }
  });
});
