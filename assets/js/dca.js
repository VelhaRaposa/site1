/* =========================================================
   DCA.JS — simulador de DCA e Lump Sum em Bitcoin
   Usa a API gratuita da CryptoCompare (sem chave, sem limite de
   período). Não precisa editar este arquivo.
   ========================================================= */

let currentMode = "dca";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dca-form");
  const resultEl = document.getElementById("dca-result");
  const errorEl = document.getElementById("dca-error");
  const chartWrap = document.getElementById("dca-chart-wrap");

  // datas padrão: últimos 6 meses
  const fim = new Date();
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - 6);
  document.getElementById("fim").value = fim.toISOString().slice(0, 10);
  document.getElementById("inicio").value = inicio.toISOString().slice(0, 10);

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

  /* Busca preços diários históricos na CryptoCompare, paginando de
     2000 em 2000 dias (limite por chamada) até cobrir o período
     inteiro pedido. */
  async function fetchPrices(fromDate, toDate) {
    let allPoints = [];
    let toTs = Math.floor(toDate.getTime() / 1000);
    const fromTs = Math.floor(fromDate.getTime() / 1000);
    let safety = 0;

    while (safety < 10) {
      safety++;
      const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=BRL&limit=2000&toTs=${toTs}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.Response !== "Success" || !data.Data || !data.Data.Data || data.Data.Data.length === 0) {
        throw new Error("falha");
      }
      const points = data.Data.Data.map(d => [d.time * 1000, d.close]).filter(p => p[1] > 0);
      allPoints = points.concat(allPoints);

      const earliest = points[0][0] / 1000;
      if (earliest <= fromTs || points.length < 2) break;
      toTs = earliest - 86400;
    }

    const filtered = allPoints.filter(p => p[0] >= fromTs * 1000 - 86400000 && p[0] <= toTs * 1000 + 86400000 * 2000);
    if (filtered.length === 0) throw new Error("vazio");
    return filtered;
  }

  function closestPrice(prices, targetTs) {
    let closest = prices[0];
    let minDiff = Math.abs(prices[0][0] - targetTs);
    for (const p of prices) {
      const diff = Math.abs(p[0] - targetTs);
      if (diff < minDiff) { minDiff = diff; closest = p; }
    }
    return closest[1];
  }

  function renderChart(points) {
    const w = 640, h = 260, pad = 36;
    const maxY = Math.max(...points.map(p => Math.max(p.investido, p.valor))) * 1.08 || 1;
    const minTs = points[0].ts, maxTs = points[points.length - 1].ts;
    const spanTs = (maxTs - minTs) || 1;

    const x = (ts) => pad + ((ts - minTs) / spanTs) * (w - pad * 2);
    const y = (v) => h - pad - (v / maxY) * (h - pad * 2);

    const linePath = (key) => points.map((p, i) =>
      (i === 0 ? "M" : "L") + x(p.ts).toFixed(1) + "," + y(p[key]).toFixed(1)
    ).join(" ");

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
      const yy = h - pad - f * (h - pad * 2);
      return `<line x1="${pad}" y1="${yy}" x2="${w - pad}" y2="${yy}" stroke="#1F2634" stroke-width="1"/>`;
    }).join("");

    chartWrap.innerHTML = `
      <svg id="dca-chart" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}
        <path d="${linePath('investido')}" fill="none" stroke="#5B6478" stroke-width="1.5" stroke-dasharray="4 4"/>
        <path d="${linePath('valor')}" fill="none" stroke="#F7931A" stroke-width="2.5"/>
      </svg>
      <div style="display:flex;gap:20px;font-size:.78rem;color:var(--text-muted);margin-top:10px;">
        <span><span style="display:inline-block;width:10px;height:10px;background:#F7931A;border-radius:2px;margin-right:6px;"></span>Valor da carteira</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:#5B6478;border-radius:2px;margin-right:6px;"></span>Total investido</span>
      </div>
    `;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    resultEl.innerHTML = `<p style="color:var(--text-muted);">Calculando…</p>`;
    chartWrap.innerHTML = "";

    const inicioDate = new Date(document.getElementById("inicio").value + "T00:00:00");
    const fimDate = new Date(document.getElementById("fim").value + "T00:00:00");
    const hoje = new Date();

    if (inicioDate >= fimDate) {
      errorEl.textContent = "A data inicial precisa ser antes da data final.";
      resultEl.innerHTML = "";
      return;
    }

    try {
      const prices = await fetchPrices(inicioDate, fimDate > hoje ? hoje : fimDate);
      const fmt = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const precoAtual = prices[prices.length - 1][1];

      let totalInvestido = 0;
      let totalBTC = 0;
      const chartPoints = [];

      if (currentMode === "lump") {
        const valorTotal = parseFloat(document.getElementById("valor-lump").value);
        const precoCompra = closestPrice(prices, inicioDate.getTime());
        totalInvestido = valorTotal;
        totalBTC = valorTotal / precoCompra;

        prices.forEach(p => {
          chartPoints.push({ ts: p[0], investido: totalInvestido, valor: totalBTC * p[1] });
        });

      } else {
        const valorPeriodo = parseFloat(document.getElementById("valor").value);
        const freq = document.getElementById("frequencia").value;
        const stepDays = freq === "daily" ? 1 : freq === "weekly" ? 7 : 30;

        let cursor = new Date(inicioDate);
        const aportesTs = [];
        while (cursor <= fimDate && cursor <= hoje) {
          aportesTs.push(cursor.getTime());
          cursor = new Date(cursor.getTime() + stepDays * 86400000);
        }

        let acumuladoBTC = 0;
        let acumuladoInvestido = 0;
        let aporteIndex = 0;

        prices.forEach(p => {
          while (aporteIndex < aportesTs.length && aportesTs[aporteIndex] <= p[0]) {
            acumuladoBTC += valorPeriodo / closestPrice(prices, aportesTs[aporteIndex]);
            acumuladoInvestido += valorPeriodo;
            aporteIndex++;
          }
          chartPoints.push({ ts: p[0], investido: acumuladoInvestido, valor: acumuladoBTC * p[1] });
        });

        while (aporteIndex < aportesTs.length) {
          acumuladoBTC += valorPeriodo / precoAtual;
          acumuladoInvestido += valorPeriodo;
          aporteIndex++;
        }

        totalBTC = acumuladoBTC;
        totalInvestido = acumuladoInvestido;
      }

      const valorAtual = totalBTC * precoAtual;
      const lucro = valorAtual - totalInvestido;
      const lucroPct = totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0;

      resultEl.innerHTML = `
        <div class="grid grid-2">
          <div class="stat"><div class="num">${fmt(totalInvestido)}</div><div class="label">total investido</div></div>
          <div class="stat"><div class="num">${totalBTC.toFixed(6)}</div><div class="label">BTC acumulado</div></div>
          <div class="stat"><div class="num">${fmt(totalInvestido / (totalBTC || 1))}</div><div class="label">preço médio de compra</div></div>
          <div class="stat"><div class="num" style="color:${lucro >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(valorAtual)}</div><div class="label">valor hoje (${lucroPct >= 0 ? '+' : ''}${lucroPct.toFixed(1)}%)</div></div>
        </div>
      `;

      if (chartPoints.length > 1) renderChart(chartPoints);

    } catch (err) {
      errorEl.textContent = "Não foi possível calcular agora. Tente novamente em instantes.";
      resultEl.innerHTML = "";
    }
  });
});
