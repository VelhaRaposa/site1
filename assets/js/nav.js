/* =========================================================
   NAV.JS — injeta cabeçalho e rodapé em todas as páginas
   Não precisa editar este arquivo. Para mudar textos do menu
   ou rodapé, mexa nos textos abaixo (entre aspas).
   ========================================================= */

const NAV_LINKS = [
  { href: "index.html", label: "Home" },
  { href: "sobre.html", label: "Sobre" },
  { href: "agenda.html", label: "Agenda" },
  { href: "dca.html", label: "Ferramenta DCA" },
  { href: "parceiros.html", label: "Onde comprar" },
  { href: "contato.html", label: "Contato" },
];

function renderHeader(){
  const current = location.pathname.split("/").pop() || "index.html";
  const links = NAV_LINKS.map(l =>
    `<a href="${l.href}" class="${l.href === current ? 'active' : ''}">${l.label}</a>`
  ).join("");

  document.getElementById("site-header").innerHTML = `
    <div class="nav-wrap">
      <a href="index.html" class="logo"><span>C</span>aio Garé</a>
      <ul class="nav-links" id="nav-links">${links}</ul>
      <div class="nav-cta">
        <a href="anuncie.html" class="btn btn-ghost" style="padding:.6em 1.1em;font-size:.82rem;">Anuncie comigo</a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menu">☰</button>
      </div>
    </div>
    <div class="ticker">
      <div class="ticker-track" id="ticker-track"></div>
    </div>
  `;

  document.getElementById("nav-toggle").addEventListener("click", () => {
    document.getElementById("nav-links").classList.toggle("open");
  });

  renderTicker();
}

async function renderTicker(){
  const track = document.getElementById("ticker-track");

  const renderRow = (items) => {
    track.innerHTML = items.map(i =>
      `<span><strong>${i.label}</strong> ${i.value} ${i.dir === 'up' ? '▲' : i.dir === 'down' ? '▼' : ''}</span>`
    ).join("");
  };

  const base = [
    { label: "SELIC", value: SITE.selic, dir: "flat" },
    { label: "CDI", value: SITE.cdi, dir: "flat" },
  ];

  renderRow([
    { label: "BTC/USD", value: "carregando…", dir: "flat" },
    { label: "USD/BRL", value: "carregando…", dir: "flat" },
    ...base,
  ]);

  try {
    const res = await fetch("https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC&tsyms=USD,BRL");
    const data = await res.json();
    const raw = data.RAW.BTC;

    const btcUsd = raw.USD.PRICE;
    const btcChange = raw.USD.CHANGEPCT24HOUR;
    const usdBrl = raw.BRL.PRICE / raw.USD.PRICE;

    renderRow([
      {
        label: "BTC/USD",
        value: "$" + btcUsd.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " (" + (btcChange >= 0 ? "+" : "") + btcChange.toFixed(1) + "%)",
        dir: btcChange >= 0 ? "up" : "down",
      },
      { label: "USD/BRL", value: "R$" + usdBrl.toFixed(2), dir: "flat" },
      ...base,
    ]);
  } catch (e) {
    renderRow([
      { label: "BTC/USD", value: "erro: " + e.message, dir: "flat" },
      { label: "USD/BRL", value: "indisponível", dir: "flat" },
      ...base,
    ]);
  }
}

function renderFooter(){
  const el = document.getElementById("site-footer");
  if(!el) return;
  el.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo"><span>C</span>aio Garé</a>
          <p style="max-width:280px;margin-top:10px;">Bitcoin, mercados e macro.<br>Análises no YouTube.</p>
        </div>
        <ul class="footer-links">
          <li><a href="${SITE.youtubeUrl}" target="_blank" rel="noopener">YouTube</a></li>
          <li><a href="${SITE.spotifyUrl}" target="_blank" rel="noopener">Spotify</a></li>
          <li><a href="${SITE.xUrl}" target="_blank" rel="noopener">X</a></li>
          <li><a href="${SITE.instagramUrl}" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="media-kit.html">Media Kit</a></li>
          <li><a href="privacidade.html">Privacidade</a></li>
        </ul>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Caio Garé. Todos os direitos reservados.</span>
        <span>Conteúdo educacional. Não é recomendação de investimento.</span>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  renderCookieBanner();
});

function renderCookieBanner(){
  if (localStorage.getItem("cookies_aceitos") === "1") return;

  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.style.cssText = `
    position:fixed;left:0;right:0;bottom:0;z-index:100;
    background:var(--bg-card);border-top:1px solid var(--border-strong);
    padding:16px 24px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;
    justify-content:space-between;font-size:.85rem;
  `;
  banner.innerHTML = `
    <span style="color:var(--text-secondary);max-width:520px;">
      Este site usa cookies para estatísticas de visitas (Google Analytics) e para medir cliques em links de parceiros.
      Saiba mais na <a href="privacidade.html" style="color:var(--accent);">Política de Privacidade</a>.
    </span>
    <button class="btn btn-primary" id="cookie-accept" style="white-space:nowrap;">Entendi</button>
  `;
  document.body.appendChild(banner);

  document.getElementById("cookie-accept").addEventListener("click", () => {
    localStorage.setItem("cookies_aceitos", "1");
    banner.remove();
  });
}

/* ---------- busca automática dos vídeos recentes do YouTube ----------
   Usa o feed RSS público do canal (sem precisar de chave de API paga).
   Se SITE.youtubeChannelId estiver vazio ou a busca falhar, usa a
   lista manual SITE.videos do content.js. */
async function getLatestVideos(limit = 6){
  if (!SITE.youtubeChannelId) return SITE.videos.slice(0, limit);

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${SITE.youtubeChannelId}`;
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    const res = await fetch(proxyUrl);
    const data = await res.json();
    if (data.status !== "ok" || !data.items || data.items.length === 0) {
      return SITE.videos.slice(0, limit);
    }
    return data.items.slice(0, limit).map(item => ({
      titulo: item.title,
      pilar: "",
      views: "",
      url: item.link,
      thumb: item.thumbnail || (item.enclosure && item.enclosure.link) || "",
    }));
  } catch (e) {
    return SITE.videos.slice(0, limit);
  }
}

/* ---------- rastreamento de cliques em parceiros ----------
   Envia um evento para o Google Analytics (GA4) toda vez que alguém
   clica em um link de parceiro. Isso permite ver, no painel do GA4,
   quantos cliques cada parceiro recebeu por mês — é o número que
   você mostra pros patrocinadores.

   Pré-requisito: configurar o GA_MEASUREMENT_ID no arquivo
   assets/js/analytics.js (passo a passo no README.md). */
function trackPartnerClick(id, url){
  if (typeof gtag === "function") {
    gtag("event", "click_parceiro", {
      parceiro_id: id,
      link_url: url,
    });
  }
  window.open(url, "_blank", "noopener");
}
