/* =========================================================
   HALVINGS.JS — halvings canônicos do Bitcoin
   =========================================================
   Definição ÚNICA e reutilizável para todo o projeto — mesma filosofia
   já aplicada aos fundos/topos de ciclo em assets/js/comparador-ciclos.js
   (array CICLOS, documentado no README, seção 9): cada marco tem uma
   DATA CANÔNICA e um PREÇO CANÔNICO definidos manualmente, não
   calculados a partir de assets/data/btc-history*.json.

   POR QUÊ NÃO VEM DO JSON DE PREÇOS:
   Os datasets em assets/data/ guardam um fechamento diário (média/
   fechamento de exchange), que pode divergir do valor historicamente
   aceito pelo mercado pra aquele dia — o mesmo motivo já documentado
   pra CICLOS. Halving tem uma vantagem a mais: a DATA e o BLOCO são
   fatos objetivos (o halving acontece num bloco exato, sem ambiguidade
   de fuso ou de exchange) — só o PREÇO daquele dia é que tem a mesma
   ambiguidade de fonte que fundos/topos já tinham.

   METODOLOGIA E FONTES: ver README, seção 11.

   Esta tabela está CONGELADA, como a de CICLOS — mudanças exigem
   revisão proposital, não recálculo automático.

   USO PREVISTO (nenhum consumidor ainda — arquivo só define os dados):
   1. Comparador de Ciclos — novo modo "Ciclo Completo"
   2. Comparador de Ciclos — futura metodologia de alinhamento por Halving
   3. Quando Vender Bitcoin?
   4. Outras ferramentas baseadas em ciclos, futuramente

   Quando algum desses consumidores existir, carregue este arquivo via
   <script src="/assets/js/halvings.js"> ANTES do script da ferramenta,
   igual já é feito com assets/js/utils.js.
   ========================================================= */

const HALVINGS = [
  {
    id: "2012",
    data: "2012-11-28",
    preco: 12.35,
    bloco: 210000,
    recompensaAntes: 50,
    recompensaDepois: 25,
  },
  {
    id: "2016",
    data: "2016-07-09",
    preco: 647.78,
    bloco: 420000,
    recompensaAntes: 25,
    recompensaDepois: 12.5,
  },
  {
    id: "2020",
    data: "2020-05-11",
    preco: 8601.80,
    bloco: 630000,
    recompensaAntes: 12.5,
    recompensaDepois: 6.25,
  },
  {
    id: "2024",
    data: "2024-04-20",
    preco: 63800.00,
    bloco: 840000,
    recompensaAntes: 6.25,
    recompensaDepois: 3.125,
  },
  // O 5º halving (bloco 1.050.000) ainda não ocorreu na data de hoje
  // usada pelo projeto — NÃO adicione uma entrada estimada aqui. Só
  // acrescente quando o bloco for minerado de fato e a data/preço
  // puderem ser congelados como canônicos, do mesmo jeito que os 4
  // acima (ver critério na seção 11 do README).
];
