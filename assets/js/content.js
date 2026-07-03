/* =========================================================
   CONTEÚDO DO SITE — EDITE APENAS ESTE ARQUIVO
   =========================================================
   Este é o único arquivo que você precisa mexer no dia a dia.
   Não é preciso saber programar: só trocar o texto entre aspas
   ou copiar/colar um bloco { ... } novo para adicionar item.

   REGRAS SIMPLES:
   - Tudo que está entre aspas " " pode ser editado livremente.
   - Não apague as vírgulas "," no final das linhas.
   - Para adicionar um vídeo/parceiro/curso novo, copie um bloco
     inteiro entre { e }, cole logo abaixo, e edite os textos.
   - Depois de editar, salve o arquivo e suba pro GitHub
     (veja o passo a passo em README.md).
   ========================================================= */

const SITE = {

  // ---------- DADOS GERAIS ----------
  nome: "Caio Garé",
  inscritos: "38,2 mil",
  youtubeUrl: "https://www.youtube.com/@caiogare",
  xUrl: "https://x.com/caiogare",
  instagramUrl: "https://www.instagram.com/caiogare",
  emailContato: "contato@caiogare.com.br",

  // ---------- AGENDA DE LIVES ----------
  agenda: [
    { dia: "Segunda a sexta", horario: "09h00", titulo: "Live diária — mercado e macro" },
    { dia: "Sábado",          horario: "10h00", titulo: "Resumo semanal" },
  ],

  // ---------- VÍDEOS EM DESTAQUE ----------
  // pilar: "Bitcoin" | "Macro" | "Geopolítica" | "Segurança"
  videos: [
    {
      titulo: "Bitcoin NÃO é o que te contaram",
      pilar: "Bitcoin",
      views: "791 mil visualizações",
      url: "https://www.youtube.com/@caiogare",
      thumb: "",
    },
    {
      titulo: "Banco Central quer travar as stablecoins",
      pilar: "Macro",
      views: "277 visualizações",
      url: "https://www.youtube.com/@caiogare",
      thumb: "",
    },
    {
      titulo: "PETRÓLEO EXPLODE: guerra trava o Fed",
      pilar: "Geopolítica",
      views: "1,2 mil visualizações",
      url: "https://www.youtube.com/@caiogare",
      thumb: "",
    },
    {
      titulo: "Ataque no JavaScript mira carteiras cripto",
      pilar: "Segurança",
      views: "364 visualizações",
      url: "https://www.youtube.com/@caiogare",
      thumb: "",
    },
  ],

  // ---------- PARCEIROS RECOMENDADOS ----------
  // tipo: "Corretora" | "P2P" | "Hardwallet"
  parceiros: [
    {
      nome: "Nome da corretora",
      tipo: "Corretora",
      descricao: "Compra e venda de Bitcoin com taxas reduzidas.",
      url: "https://exemplo.com/?ref=caiogare",
      idClique: "corretora-1",
    },
    {
      nome: "Nome da plataforma P2P",
      tipo: "P2P",
      descricao: "Compra direta com outros usuários, sem intermediário.",
      url: "https://exemplo.com/?ref=caiogare",
      idClique: "p2p-1",
    },
    {
      nome: "Nome do hardwallet",
      tipo: "Hardwallet",
      descricao: "Guarda seu Bitcoin offline, fora de corretoras.",
      url: "https://exemplo.com/?ref=caiogare",
      idClique: "hardwallet-1",
    },
  ],

  // ---------- CURSOS ----------
  cursos: [
    {
      titulo: "Nome do curso",
      descricao: "Descrição curta do que o aluno aprende.",
      preco: "R$ 000",
      url: "#",
    },
  ],
};
