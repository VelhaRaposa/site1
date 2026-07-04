/* =========================================================
   CONTEÚDO DO SITE — EDITE APENAS ESTE ARQUIVO
   =========================================================
   Este é o único arquivo que você precisa mexer no dia a dia.
   Não é preciso saber programar: só trocar o texto entre aspas
   ou copiar/colar um bloco { ... } novo para adicionar item.
   ========================================================= */

const SITE = {

  // ---------- DADOS GERAIS ----------
  nome: "Caio Garé",
  inscritos: "38,2 mil",
  youtubeUrl: "https://www.youtube.com/@caiogare",
  xUrl: "https://x.com/caiogare",
  instagramUrl: "https://www.instagram.com/caiogare",
  spotifyUrl: "https://open.spotify.com/show/3sBJa8iCt2POBsdVbHaIfO?si=Ii1vu6JfSEydfdBc-GJ5BQ",
  emailContato: "caiogare.contato@gmail.com",

  // ---------- AUTOMAÇÃO DE VÍDEOS (opcional, recomendado) ----------
  // Preencha com o ID do seu canal (começa com "UC...") para o site
  // buscar sozinho, todo dia, os vídeos mais recentes do YouTube —
  // sem você precisar colar link nenhum.
  // Como pegar: acesse youtube.com/account_advanced (logado na conta
  // do canal) e copie o "ID do canal".
  // Deixando em branco, o site usa a lista manual "videos" abaixo.
  youtubeChannelId: "UCxL_cyAp4LyN9a8dFsjuKuw",

  // ---------- CHAVE GRATUITA DA COINGECKO (recomendado) ----------
  // A calculadora DCA precisa disso para funcionar de forma confiável.
  // Como conseguir (grátis, sem cartão, 2 minutos):
  // 1. Crie conta em https://www.coingecko.com/en/api/pricing → "Create Free Account" (Demo)
  // 2. No painel, gere uma chave (Developer Dashboard → + Add New Key)
  // 3. Cole a chave abaixo, entre as aspas
  coingeckoApiKey: "CG-9yMSe6jEirCMgnumArYKVTzk",

  // ---------- INDICADORES DO TICKER (atualize manualmente quando mudar) ----------
  // BTC/USD e USD/BRL são buscados automaticamente. Só Selic e CDI
  // são manuais, porque exigem uma fonte paga para atualizar sozinho.
  selic: "14,25%",
  cdi: "14,15%",

  // ---------- AGENDA DE LIVES ----------
  agenda: [
    { dia: "Segunda, quarta e sexta", horario: "14h", titulo: "Live — mercado e macro" },
  ],

  // ---------- VÍDEOS EM DESTAQUE (usado se youtubeChannelId estiver vazio) ----------
  // pilar: "Bitcoin" | "Macro" | "Geopolítica" | "Segurança"
  videos: [
    {
      titulo: "Bitcoin NÃO é o que te contaram",
      pilar: "Bitcoin",
      views: "",
      url: "https://www.youtube.com/@caiogare/videos",
      thumb: "",
    },
    {
      titulo: "Banco Central quer travar as stablecoins",
      pilar: "Macro",
      views: "",
      url: "https://www.youtube.com/@caiogare/videos",
      thumb: "",
    },
    {
      titulo: "PETRÓLEO EXPLODE: guerra trava o Fed",
      pilar: "Geopolítica",
      views: "",
      url: "https://www.youtube.com/@caiogare/videos",
      thumb: "",
    },
  ],

  // ---------- PARCEIROS RECOMENDADOS ----------
  // tipo: "Corretora" | "P2P" | "Hardwallet"
  parceiros: [
    {
      nome: "Blofin",
      tipo: "Corretora",
      descricao: "Abra sua conta com 10% de desconto nas taxas.",
      url: "https://partner.blofin.com/d/caio",
      idClique: "blofin",
    },
    {
      nome: "Fort Exchange",
      tipo: "P2P",
      descricao: "Aportes automáticos em Bitcoin.",
      url: "https://painel.fort.exchange/nova-conta?codigo_parceiro=caiogare",
      idClique: "fort-exchange",
    },
    {
      nome: "KriptoBR",
      tipo: "Hardwallet",
      descricao: "Trezor, Ledger e SecuX — guarde seu Bitcoin offline, fora de corretoras.",
      url: "https://kriptobr.com/caiogare/",
      idClique: "kriptobr",
    },
  ],

  // ---------- CURSOS (página existe, mas não está no menu ainda) ----------
  cursos: [
    {
      titulo: "Nome do curso",
      descricao: "Descrição curta do que o aluno aprende.",
      preco: "R$ 000",
      url: "#",
    },
  ],
};
