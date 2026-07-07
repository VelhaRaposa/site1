/* =========================================================
   CONTEÚDO DO SITE — EDITE APENAS ESTE ARQUIVO
   =========================================================
   Este é o único arquivo que você precisa mexer no dia a dia.
   Não é preciso saber programar: só trocar o texto entre aspas
   ou copiar/colar um bloco { ... } novo para adicionar item.
   ========================================================= */

/* =========================================================
   CONTADORES DA COMUNIDADE — edite só aqui
   =========================================================
   Esses números aparecem como selo discreto nos cards da página
   "Ferramentas para Bitcoin". Pra atualizar, troque só o número
   abaixo — o texto do site se atualiza sozinho em todo lugar que
   usa esse contador.
   Exemplo: pra CoinEx passar de 491 para 520 usuários, troque
   "coinex: 491" por "coinex: 520" logo abaixo.
   ========================================================= */
const CONTADORES = {
  coinex: 491,
  bitget: 376,
};

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
    { dia: "Segunda, quarta e sexta", horario: "14h", titulo: "Bitcoin, macroeconomia e mercados" },
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

  // ---------- FERRAMENTAS PARA BITCOIN ----------
  // Organizado por necessidade do usuário (comprar, acumular, guardar,
  // declarar, usar), não como lista de afiliados.
  // Campos por item:
  //   nome, categoria, descricao, url, idClique (usado no rastreio de clique)
  //   logo: null (sem logo, comportamento atual) ou o caminho do arquivo,
  //   ex: "/assets/img/logos/blofin.png". Se existir, aparece acima do
  //   nome no card. Se for null, o card mostra só o nome — nada quebra.
  //   urlSecundaria + textoSecundario: opcional, pra um segundo botão (ex: "Ver tutorial")
  //   selo: opcional, texto pequeno tipo "491 usuários cadastrados pela comunidade"
  // Campos com "COLE_AQUI..." precisam do link real antes de publicar.
  ferramentas: {
    secoes: [
      {
        titulo: "Para começar",
        itens: [
          {
            nome: "BingX",
            categoria: "Exchange",
            descricao: "Exchange global com PIX, compra de Bitcoin, futuros e Earn.",
            url: "https://bingxdao.com/partner/caiogare1/",
            idClique: "bingx",
            logo: "/assets/img/logos/bingx.png",
          },
          {
            nome: "Fort Exchange",
            categoria: "Acumulação automática",
            descricao: "Compras automáticas diárias de Bitcoin com saque automático semanal para sua carteira.",
            url: "https://painel.fort.exchange/nova-conta?codigo_parceiro=caiogare",
            idClique: "fort-exchange",
            urlSecundaria: "https://youtu.be/OMFKbnnL9Mw",
            textoSecundario: "Ver tutorial",
            logo: "/assets/img/logos/fort-exchange.png",
          },
        ],
      },
      {
        titulo: "Guardar Bitcoin",
        itens: [
          {
            nome: "KriptoBR",
            categoria: "Hardware Wallet",
            descricao: "Revenda oficial de Trezor, Ledger e SecuX no Brasil. Utilizo Trezor para armazenar meu Bitcoin.",
            url: "https://kriptobr.com/caiogare/",
            idClique: "kriptobr",
            logo: "/assets/img/logos/kriptobr.png",
          },
        ],
      },
      {
        titulo: "Serviços complementares",
        itens: [
          {
            nome: "Declare Cripto",
            categoria: "Imposto de Renda",
            descricao: "Ferramenta para organizar operações e auxiliar na declaração de criptomoedas.",
            url: "https://declarecripto.com.br/parceiro/caiogare",
            idClique: "declare-cripto",
            logo: "/assets/img/logos/declare-cripto.png",
          },
          {
            nome: "RedotPay",
            categoria: "Cartão",
            descricao: "Cartão para utilizar criptomoedas em pagamentos do dia a dia.",
            url: "https://url.hk/i/pt/wcp3x",
            idClique: "redotpay",
            logo: "/assets/img/logos/redotpay.png",
          },
        ],
      },
      {
        titulo: "Outras plataformas",
        itens: [
          {
            nome: "Blofin",
            categoria: "Exchange",
            descricao: "Corretora internacional com 10% de cashback nas taxas.",
            url: "https://partner.blofin.com/d/caio",
            idClique: "blofin",
            logo: "/assets/img/logos/blofin.png",
          },
          {
            nome: "Binance",
            categoria: "Exchange",
            descricao: "Maior corretora de criptomoedas do mundo com 10% de cashback nas taxas.",
            url: "https://www.binance.com/register?ref=CAIOGARE",
            idClique: "binance",
            urlSecundaria: "https://youtu.be/nnlsfQtThzc",
            textoSecundario: "Ver tutorial",
            logo: "/assets/img/logos/binance.png",
          },
          {
            nome: "Bybit",
            categoria: "Exchange",
            descricao: "Corretora popular entre traders, com saque PIX e boa experiência de uso.",
            url: "https://www.bybit.com/invite?ref=ZRKDDR&medium=referral&utm_campaign=evergreen&share_to=link",
            idClique: "bybit",
            logo: "/assets/img/logos/bybit.png",
          },
          {
            nome: "CoinEx",
            categoria: "Exchange",
            descricao: "Corretora utilizada pela comunidade. Destaque atual para rendimentos em USDT com 10% de cashback nas taxas.",
            url: "https://www.coinex.com/pt/land?code=TFCYAP&refer_code=e5dgn",
            idClique: "coinex",
            urlSecundaria: "https://youtu.be/t6A5AZ9uzoc",
            textoSecundario: "Ver tutorial",
            selo: `${CONTADORES.coinex} usuários cadastrados pela comunidade`,
            logo: "/assets/img/logos/coinex.png",
          },
          {
            nome: "Bitget",
            categoria: "Exchange",
            descricao: "Plataforma conhecida pelo copy trade com 10% de cashback nas taxas.",
            url: "https://partner.bitget.com/bg/73A4S6",
            idClique: "bitget",
            urlSecundaria: "https://youtu.be/VV0c85oxxcs",
            textoSecundario: "Ver tutorial",
            selo: `${CONTADORES.bitget} usuários cadastrados pela comunidade`,
            logo: "/assets/img/logos/bitget.png",
          },
        ],
      },
    ],
  },

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
