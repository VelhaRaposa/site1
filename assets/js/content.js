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
  youtubeChannelId: "",

  // ---------- CHAVE DA COINGECKO (não é mais usada) ----------
  // A calculadora DCA passou a usar outra fonte de dados (CryptoCompare),
  // que não precisa de chave nem tem limite de 1 ano. Pode deixar como
  // está ou apagar esta linha, não faz diferença.
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
  // logo: caminho para o arquivo de imagem (opcional). Coloque o arquivo
  // dentro de assets/img/parceiros/ e escreva o caminho aqui, por exemplo:
  // "assets/img/parceiros/blofin.png". Deixe em branco pra não mostrar logo.
  parceiros: [
    {
      nome: "Blofin",
      tipo: "Corretora",
      descricao: "Abra sua conta com 10% de desconto nas taxas.",
      url: "COLE_AQUI_SEU_LINK_DE_AFILIADO_BLOFIN",
      idClique: "blofin",
      logo: "",
    },
    {
      nome: "Fort Exchange",
      tipo: "P2P",
      descricao: "Aportes automáticos em Bitcoin.",
      url: "COLE_AQUI_SEU_LINK_DE_AFILIADO_FORT_EXCHANGE",
      idClique: "fort-exchange",
      logo: "",
    },
    {
      nome: "KriptoBR",
      tipo: "Hardwallet",
      descricao: "Trezor, Ledger e SecuX — guarde seu Bitcoin offline, fora de corretoras.",
      url: "COLE_AQUI_SEU_LINK_DE_AFILIADO_KRIPTOBR",
      idClique: "kriptobr",
      logo: "",
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

  // ---------- PÁGINA "SOBRE" (edite à vontade, é só texto) ----------
  sobre: {
    titulo: "De advogado a analista de macro e Bitcoin",
    introducao: "Formado em Direito, com mestrado em Teoria do Estado e Direito, trago pro mercado financeiro uma bagagem analítica e estruturada — não um discurso de hype.",
    quemSouEu: [
      "Com uma veia empreendedora desde a infância, aos 20 anos abri minha primeira empresa no ramo de informática, o que me permitiu cursar a faculdade de Direito. Ali descobri também a vontade de ensinar — e, depois de anos de estudo, livros escritos e palestras, concluí o mestrado em Teoria do Estado e Direito.",
      "O interesse pelo mercado financeiro começou em 2017, com ações, fundos imobiliários e ativos internacionais. Em 2020 descobri o Bitcoin — e uma nova paixão. Em 2021, nasceu o canal Caio Garé no YouTube, com lives e vídeos sobre Bitcoin, economia e criptomoedas.",
      "Hoje, o Bitcoin é tratado como consequência: explico primeiro o que está acontecendo na economia — inflação, juros, S&P 500, liquidez global, geopolítica — para então mostrar como isso se traduz em preço e narrativa de Bitcoin.",
    ],
    caioNaMidia: "Fui o primeiro analista de língua portuguesa a alertar sobre os riscos do Terra Luna, um mês antes do colapso do projeto — quando o token ainda valia US$ 88. O alerta foi contra o consenso do mercado na época, e a repercussão aumentou conforme o cenário se confirmou.",
    // Adicione aqui links reais de matérias, prints ou tweets que comprovem o caso.
    // Cada linha é um link novo — copie o formato abaixo.
    provasNaMidia: [
      { texto: "Cobertura sobre o alerta do Terra Luna", url: "https://alplending.com/youtuber-brasileiro-acusou-luna-de-esquema-ponzi-ha-um-mes-vai-entrar-em-colapso/" },
    ],
  },
};
