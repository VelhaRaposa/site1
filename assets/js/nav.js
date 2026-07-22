/* =========================================================
   NAV.JS — injeta cabeçalho e rodapé em todas as páginas
   Não precisa editar este arquivo. Para mudar textos do menu
   ou rodapé, mexa nos textos abaixo (entre aspas).
   ========================================================= */

// "Quando Vender Bitcoin?" (/quando-vender/) despublicada de propósito
// — página fora do menu, sem link em nenhum lugar do site — enquanto a
// informação está sendo reformulada (a página respondia "como uma regra
// se saiu no passado" em vez de "quando eu vendo". Ver docs/). O
// arquivo continua no repositório para retomar o trabalho.
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/agenda/", label: "Agenda" },
  { href: "/comparador/", label: "Comparador de Investimentos" },
  { href: "/calculadora/", label: "DCA Bitcoin" },
  { href: "/comparador-ciclos/", label: "Ciclos Bitcoin" },
  { href: "/bitcoin-spiral/", label: "Bitcoin Spiral" },
  { href: "/etf-flows/", label: "ETF Flows" },
  { href: "/guia-bitcoin/", label: "Guia Bitcoin" },
  { href: "/contato/", label: "Contato" },
];

// componente de marca (logo + nome + tagline) — usado no header e no rodapé.
// O header omite a tagline (mantém o cabeçalho compacto e numa linha só);
// o rodapé continua mostrando as duas linhas.
function brandHtml(showTagline){
  return `
    <img src="/favicon.svg" alt="" class="brand-mark" aria-hidden="true">
    <span class="brand-text">
      <span class="brand-name">Caio Garé</span>
      ${showTagline ? `<span class="brand-tagline">Bitcoin • Economia • Mercados</span>` : ""}
    </span>
  `;
}

// ícones sociais (traço único, herdam a cor do link via currentColor) —
// paths oficiais da Simple Icons, só o glyph, sem cor de marca fixa
const SOCIAL_ICONS = {
  youtube: `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  spotify: `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.72 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
  x: `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  instagram: `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
};

// ícones de páginas internas do rodapé (Contato/Privacidade) — mesmo
// estilo dos ícones sociais acima (traço único, herdam cor via
// currentColor, mesma classe .social-icon) para ficarem alinhados e
// espaçados igual aos itens de rede social.
const FOOTER_PAGE_ICONS = {
  mail: `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
  lock: `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"/></svg>`,
};

// normaliza o caminho atual pra sempre terminar com "/", pra comparar
// certinho com os hrefs do menu (que também terminam com "/")
function normalizePath(path){
  if (path.endsWith("index.html")) path = path.slice(0, -"index.html".length);
  if (!path.endsWith("/")) path += "/";
  return path;
}

function renderHeader(){
  const current = normalizePath(location.pathname);
  const links = NAV_LINKS.map(l =>
    `<a href="${l.href}" class="${normalizePath(l.href) === current ? 'active' : ''}">${l.label}</a>`
  ).join("");

  document.getElementById("site-header").innerHTML = `
    <div class="nav-wrap">
      <a href="/" class="brand">${brandHtml(false)}</a>
      <ul class="nav-links" id="nav-links">${links}</ul>
      <div class="nav-cta">
        <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menu">☰</button>
      </div>
    </div>
  `;

  /* ---------- menu mobile ----------
     Importante: este painel é anexado direto no <body>, fora do
     #site-header. Isso é proposital: o #site-header usa
     backdrop-filter, e qualquer elemento com backdrop-filter/filter/
     transform vira uma "âncora" para os filhos position:fixed dentro
     dele — nesse caso, o menu mobile deixava de se fixar na tela
     inteira e ficava preso na altura de ~66px do cabeçalho, sobrando
     espaço só pro primeiro item. Ficando fora do header, o menu se
     fixa corretamente na tela inteira, como deveria. */
  let mobileMenu = document.getElementById("mobile-menu");
  if (!mobileMenu) {
    mobileMenu = document.createElement("div");
    mobileMenu.id = "mobile-menu";
    document.body.appendChild(mobileMenu);
  }
  mobileMenu.innerHTML = `<nav class="mobile-menu-links">${links}</nav>`;

  const navToggle = document.getElementById("nav-toggle");
  navToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    document.body.style.overflow = isOpen ? "hidden" : "";
    navToggle.textContent = isOpen ? "✕" : "☰";
  });

  // fecha o menu automaticamente se a pessoa girar a tela pra desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && mobileMenu.classList.contains("open")) {
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
      navToggle.textContent = "☰";
    }
  });
}

function renderFooter(){
  const el = document.getElementById("site-footer");
  if(!el) return;
  el.innerHTML = `
    <div class="container container-wide">
      <div class="footer-grid">
        <div>
          <a href="/" class="brand">${brandHtml(true)}</a>
        </div>
        <ul class="footer-links">
          <li><a href="${SITE.youtubeUrl}" target="_blank" rel="noopener">${SOCIAL_ICONS.youtube}YouTube</a></li>
          <li><a href="${SITE.spotifyUrl}" target="_blank" rel="noopener">${SOCIAL_ICONS.spotify}Spotify</a></li>
          <li><a href="${SITE.xUrl}" target="_blank" rel="noopener">${SOCIAL_ICONS.x}X</a></li>
          <li><a href="${SITE.instagramUrl}" target="_blank" rel="noopener">${SOCIAL_ICONS.instagram}Instagram</a></li>
          <li><a href="/contato/">${FOOTER_PAGE_ICONS.mail}Contato</a></li>
          <li><a href="/privacidade/">${FOOTER_PAGE_ICONS.lock}Privacidade</a></li>
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
      Saiba mais na <a href="/privacidade/" style="color:var(--accent);">Política de Privacidade</a>.
    </span>
    <button class="btn btn-primary" id="cookie-accept" style="white-space:nowrap;">Entendi</button>
  `;
  document.body.appendChild(banner);

  document.getElementById("cookie-accept").addEventListener("click", () => {
    localStorage.setItem("cookies_aceitos", "1");
    banner.remove();
  });
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
