/* =========================================================
   DCA.JS — calculadora de aporte mensal em Bitcoin
   Usa a API pública e gratuita da CoinGecko para preços históricos.
   Não precisa editar este arquivo.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("dca-form");
  const resultEl = document.getElementById("dca-result");
  const errorEl = document.getElementById("dca-error");

  // padrão: 12 meses atrás
  const inicioInput = document.getElementById("inicio");
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  inicioInput.value = d.toISOString().slice(0,7);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    resultEl.innerHTML = `<p style="color:var(--text-muted);">Calculando…</p>`;

    const valorMensal = parseFloat(document.getElementById("valor").value);
    const [anoStr, mesStr] = document.getElementById("inicio").value.split("-");
    const startDate = new Date(parseInt(anoStr), parseInt(mesStr) - 1, 1);
    const today = new Date();

    if (startDate >= today) {
      errorEl.textContent = "Escolha uma data no passado.";
      resultEl.innerHTML = "";
      return;
    }

    try {
      const from = Math.floor(startDate.getTime() / 1000);
      const to = Math.floor(today.getTime() / 1000);
      const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=brl&from=${from}&to=${to}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Falha ao buscar preços");
      const data = await res.json();
      const prices = data.prices; // [ [timestamp_ms, preco], ... ]

      if (!prices || prices.length === 0) throw new Error("Sem dados para o período");

      // gera um aporte no dia 1 de cada mês, buscando o preço mais próximo disponível
      let cursor = new Date(startDate);
      let totalInvestido = 0;
      let totalBTC = 0;
      let aportes = 0;

      while (cursor < today) {
        const targetTs = cursor.getTime();
        let closest = prices[0];
        let minDiff = Math.abs(prices[0][0] - targetTs);
        for (const p of prices) {
          const diff = Math.abs(p[0] - targetTs);
          if (diff < minDiff) { minDiff = diff; closest = p; }
        }
        const precoNoMes = closest[1];
        totalBTC += valorMensal / precoNoMes;
        totalInvestido += valorMensal;
        aportes++;
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const precoAtual = prices[prices.length - 1][1];
      const valorAtual = totalBTC * precoAtual;
      const lucro = valorAtual - totalInvestido;
      const lucroPct = (lucro / totalInvestido) * 100;

      const fmt = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      resultEl.innerHTML = `
        <div class="grid grid-2">
          <div class="stat"><div class="num">${aportes}</div><div class="label">aportes mensais</div></div>
          <div class="stat"><div class="num">${fmt(totalInvestido)}</div><div class="label">total investido</div></div>
          <div class="stat"><div class="num">${totalBTC.toFixed(6)}</div><div class="label">BTC acumulado</div></div>
          <div class="stat"><div class="num" style="color:${lucro >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(valorAtual)}</div><div class="label">valor hoje (${lucroPct >= 0 ? '+' : ''}${lucroPct.toFixed(1)}%)</div></div>
        </div>
      `;
    } catch (err) {
      errorEl.textContent = "Não foi possível calcular agora. Tente novamente em instantes.";
      resultEl.innerHTML = "";
    }
  });
});
