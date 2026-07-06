/* =========================================================
   ANALYTICS — Google Analytics 4 (gratuito)
   =========================================================
   1. Crie uma conta gratuita em https://analytics.google.com
   2. Crie uma "propriedade" para www.caiogare.com.br
   3. Copie o ID que começa com "G-" e cole abaixo, no lugar
      de "G-XXXXXXXXXX"
   4. Salve o arquivo e suba pro GitHub.

   Sem esse ID configurado, o site funciona normalmente — só não
   vai gerar relatório de cliques por parceiro no painel do Google.
   ========================================================= */

const GA_MEASUREMENT_ID = "G-FRT7NB8LFS";

(function(){
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") return;

  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
})();
