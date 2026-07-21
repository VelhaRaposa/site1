/* =========================================================
   CHART-WATERMARK.JS — plugin Chart.js reutilizável entre TODAS as
   ferramentas gráficas do site (Comparador de Ciclos, Comparador de
   Investimentos, Calculadora DCA, futuras) — não é código específico
   de uma página.

   Desenha a marca oficial (SEMPRE /favicon.svg) centralizada dentro
   da área de plotagem do gráfico (chart.chartArea), atrás dos
   datasets. Nunca sobre toolbar, eixos, títulos, legenda ou tooltip —
   isso é garantido de graça por só desenhar dentro de chartArea, que no
   Chart.js já exclui eixos/títulos/legenda por definição.

   Opt-in por gráfico, sem efeito colateral em quem não usar: cada
   ferramenta habilita no próprio options.plugins.watermark, ex.:

     plugins: {
       watermark: { enabled: true, opacity: 0.04 },
     }

   Requer que assets/js/vendor/chart.umd.min.js já tenha sido carregado
   (script tag deste arquivo deve vir depois dele e antes do script da
   ferramenta).
   ========================================================= */

(function () {
  const LOGO_SRC = "/favicon.svg";
  let logoImage = null;
  let logoLoading = null;

  function carregarLogo() {
    if (logoImage) return Promise.resolve(logoImage);
    if (!logoLoading) {
      logoLoading = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { logoImage = img; resolve(img); };
        img.onerror = () => resolve(null);
        img.src = LOGO_SRC;
      });
    }
    return logoLoading;
  }

  const chartWatermark = {
    id: "watermark",
    beforeDatasetsDraw(chart, _args, opts) {
      if (!opts || !opts.enabled) return;

      if (!logoImage) {
        carregarLogo().then((img) => { if (img) chart.draw(); });
        return;
      }

      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const areaW = chartArea.right - chartArea.left;
      const areaH = chartArea.bottom - chartArea.top;
      const size = Math.min(areaW, areaH) * (opts.scale ?? 0.42);
      const cx = chartArea.left + areaW / 2;
      const cy = chartArea.top + areaH / 2;

      ctx.save();
      // clip: garante que a marca nunca "vaza" para fora da área de
      // plotagem (eixos, títulos, legenda, toolbar ficam de fora disso).
      ctx.beginPath();
      ctx.rect(chartArea.left, chartArea.top, areaW, areaH);
      ctx.clip();
      ctx.globalAlpha = opts.opacity ?? 0.04;
      ctx.drawImage(logoImage, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();
    },
  };

  Chart.register(chartWatermark);
  window.chartWatermark = chartWatermark;
})();
