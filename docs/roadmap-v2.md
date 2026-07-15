# Roadmap V2 — "Quando Vender Bitcoin?"

> Documentação, não implementação. Nada deste arquivo foi construído —
> é o registro da ideia completa ("Plano Bitcoin": de simulador de saída
> para gerenciador de posição) para não se perder depois que o MVP for
> ao ar. Prioridade atual, na ordem que o produto deve seguir: **1)
> construir 2) publicar 3) medir uso real 4) ver se as pessoas deixam
> e-mail 5) só depois discutir login, carteira viva e gerenciador
> patrimonial.**

## Como ler este documento

Cada funcionalidade tem 6 campos:

- **Dependência técnica** — o que precisa existir antes de construir.
- **Esforço estimado** — ordem de grandeza (S = horas/1 dia, M = 2–4
  dias, L = 1–2 semanas, XL = 3+ semanas), não um cronograma.
- **Exige login?**
- **Exige banco de dados?**
- **Pode continuar estático em GitHub Pages?** — o site hoje não roda
  nenhum servidor; tudo que responder "não" aqui precisa de um serviço
  externo (mesmo padrão já usado para Formspree e para os robôs do
  GitHub Actions que atualizam os dados de preço).

---

## Grupo 1 — Extensões de interface (sem mudar arquitetura de dados)

Estas são puramente V1/V2 de UI sobre o motor que já existe
(`assets/js/quando-vender.js`) — nenhuma delas exige repensar o modelo
de posição.

### 1.1 Gráfico de ciclo com marcadores de venda

- **O que é:** a curva de preço do ciclo com um ponto em cada venda
  simulada, na Tela de Resultado e na Tela Ciclo Atual (ver
  `docs/interface-quando-vender-bitcoin.md`, §9).
- **Dependência técnica:** Chart.js (já vendorizado localmente em
  `assets/js/vendor/`, mesmo usado no Comparador de Ciclos); expor a
  série diária de patrimônio/preço a partir de `simularPerfil()` (o
  motor já produz os pontos de venda, falta só o array diário completo
  para desenhar a linha).
- **Esforço estimado:** M.
- **Exige login?** Não.
- **Exige banco de dados?** Não.
- **Pode continuar estático em GitHub Pages?** Sim.

### 1.2 Barra horizontal "BTC vendido vs. restante"

- **Dependência técnica:** nenhuma nova — só CSS/HTML sobre dados já
  calculados (`btcRestante` já existe no retorno do motor).
- **Esforço estimado:** S.
- **Login / banco de dados:** não / não.
- **Estático em GitHub Pages?** Sim.

### 1.3 Comparação simultânea dos 3 perfis lado a lado

- **O que é:** hoje o botão "Comparar com outro perfil" só re-roda a
  simulação escolhida; a versão completa mostra os 3 perfis ao mesmo
  tempo, com os mesmos números do usuário.
- **Dependência técnica:** nenhuma — `rodarBacktestHistorico` e
  `rodarCicloAtual` já são funções puras parametrizadas por perfil; é
  chamar as 3 e renderizar 3 colunas.
- **Esforço estimado:** S–M.
- **Login / banco de dados:** não / não.
- **Estático em GitHub Pages?** Sim.

### 1.4 Card de compartilhamento (imagem)

- **Dependência técnica:** geração de imagem no navegador (ex.:
  desenhar um `<canvas>` com os 2 números do §3 de
  `docs/recorrencia-e-mvp-final.md` e exportar como PNG, ou usar uma
  biblioteca como html2canvas) — sem servidor de imagem.
- **Esforço estimado:** M (a lógica é simples; o polimento visual do
  card costuma consumir mais tempo do que o esperado).
- **Login / banco de dados:** não / não.
- **Estático em GitHub Pages?** Sim.

### 1.5 CTA sticky no rodapé (mobile)

- **Dependência técnica:** CSS (`position:fixed`), nenhuma lógica nova.
- **Esforço estimado:** S.
- **Login / banco de dados:** não / não.
- **Estático em GitHub Pages?** Sim.

### 1.6 Export de relatório em PDF

- **Dependência técnica:** biblioteca de geração de PDF client-side
  (ex.: jsPDF), rodando 100% no navegador a partir dos dados já
  calculados.
- **Esforço estimado:** S–M.
- **Login / banco de dados:** não / não — mesmo que este recurso vire
  parte do plano premium mais tarde, a geração do PDF em si não exige
  nenhum dos dois; o que exigiria login é *restringir* quem pode gerar
  (ver Grupo 3).
- **Estático em GitHub Pages?** Sim.

---

## Grupo 2 — Alerta de verdade (a primeira peça que sai do site 100% estático)

### 2.1 Alerta por e-mail disparando de fato no gatilho

- **O que é:** hoje o MVP só captura o e-mail (via Formspree); este
  item é o robô que compara, todo dia, o preço atual contra o gatilho
  salvo de cada pessoa e dispara o aviso quando bate.
- **Dependência técnica:** um processo recorrente (o mesmo padrão dos
  robôs em `.github/workflows/` que já atualizam os dados de preço
  semanalmente) **mais um lugar para guardar, por pessoa, qual perfil
  ela escolheu, seus números (BTC/preço médio) e o e-mail** — isso já
  não é mais compatível com "nenhum armazenamento": mesmo a versão mais
  simples (uma planilha do Google Sheets ou uma tabela num serviço
  gerenciado tipo Airtable/Supabase, atualizada pelo Formspree ou por
  um formulário próprio) conta como um banco de dados para efeito desta
  tabela.
- **Esforço estimado:** L.
- **Exige login?** Não necessariamente (basta e-mail, sem senha).
- **Exige banco de dados?** Sim — ainda que mínimo.
- **Pode continuar estático em GitHub Pages?** Só a página em si; o
  robô de verificação e o armazenamento das inscrições precisam de algo
  fora do GitHub Pages (o próprio GitHub Actions pode rodar o robô sem
  custo adicional, mas ele precisa escrever em algum lugar — hoje o
  site já aceita esse tipo de exceção para os dados de preço,
  gravando de volta no próprio repositório; a mesma técnica funcionaria
  aqui, escrevendo um arquivo JSON versionado com as inscrições, desde
  que o e-mail de cada pessoa não fique exposto publicamente no
  repositório — o que exigiria criptografar ou mover isso para um
  serviço externo de qualquer forma).

### 2.2 Alertas customizáveis (frequência, canais como WhatsApp/Telegram)

- **Dependência técnica:** tudo do item 2.1, mais integração com API de
  mensageria (WhatsApp Business API, bot do Telegram) e uma tela de
  preferências por pessoa.
- **Esforço estimado:** L.
- **Exige login?** Sim, na prática — gerenciar preferências por canal
  sem conta vira insustentável rapidamente.
- **Exige banco de dados?** Sim.
- **Estático em GitHub Pages?** Só a página; o resto não.

---

## Grupo 3 — Conta de usuário, posição viva e multi-aporte ("Plano Bitcoin")

Este é o grupo que motivou a preocupação de arquitetura registrada
antes da implementação — o motor de cálculo em
`assets/js/quando-vender.js` já foi escrito em cima de listas de
aportes/vendas (não de uma "posição única"), exatamente para que estes
itens não exijam reescrever a lógica de simulação, só passar a
alimentá-la com dados reais e persistentes em vez de 1 aporte
informado na hora.

### 3.1 Múltiplos aportes reais (histórico de compras)

- **O que muda:** em vez de "quanto BTC você tem hoje", uma tela para
  adicionar cada compra (data, quantidade, preço).
- **Dependência técnica:** duas rotas possíveis, com trade-offs
  diferentes:
  - **(a) Sem login** — guardar os aportes no `localStorage` do
    navegador. Funciona, é rápido de construir, mas os dados somem se
    a pessoa trocar de aparelho, trocar de navegador ou limpar o cache.
  - **(b) Com conta** — aportes persistidos num banco de verdade,
    acessíveis de qualquer dispositivo.
- **Esforço estimado:** M para (a), L para (b) (a maior parte do
  esforço de (b) é construir a autenticação, não o CRUD de aportes em
  si).
- **Exige login?** Não em (a); sim em (b).
- **Exige banco de dados?** Não em (a) — localStorage não conta como
  banco de dados para efeito desta tabela; sim em (b).
- **Estático em GitHub Pages?** Sim em (a) (localStorage é 100%
  client-side); não em (b).

### 3.2 Histórico de vendas reais (o usuário registra o que já vendeu, não só a simulação)

- **Dependência técnica:** mesma de 3.1 — o modelo `vendas[]` já existe
  no motor, só falta a tela de registro e a persistência.
- **Esforço estimado:** S adicional sobre 3.1 (o modelo de dados já
  existe; é praticamente só formulário).
- **Login / banco de dados:** herda da rota escolhida em 3.1.
- **Estático em GitHub Pages?** Herda de 3.1.

### 3.3 Preço médio dinâmico (calculado a partir de múltiplos aportes)

- **Dependência técnica:** nenhuma nova — é uma função utilitária sobre
  `aportes[]` (soma ponderada), o mesmo cálculo que já foi feito à mão
  nos backtests deste projeto. Só depende de 3.1 existir para ter mais
  de 1 aporte para somar.
- **Esforço estimado:** S.
- **Login / banco de dados:** herda de 3.1.
- **Estático em GitHub Pages?** Herda de 3.1.

### 3.4 Capital investido e recuperado ao longo do tempo (série temporal, não só um retrato do dia)

- **Dependência técnica:** o motor já registra a data de cada venda;
  uma série temporal é agregação sobre isso — mas só fica "viva" de
  verdade se os aportes/vendas também forem reais e persistentes (3.1
  e 3.2), não simulados a cada visita.
- **Esforço estimado:** M.
- **Login / banco de dados:** herda de 3.1.
- **Estático em GitHub Pages?** Herda de 3.1.

### 3.5 Dashboard vivo da posição (patrimônio total, multi-ativo)

- **O que é:** a evolução natural da Tela Ciclo Atual — não só Bitcoin,
  mas o patrimônio total (integrando com os dados que o Comparador de
  Investimentos já busca: CDI, Ibovespa, S&P 500, Ouro).
- **Dependência técnica:** 3.1–3.4 completos, mais a integração com os
  scripts de `scripts/update_*.py` que já alimentam o Comparador.
- **Esforço estimado:** L.
- **Exige login?** Sim — a essa altura o produto já é, na prática, um
  gerenciador de patrimônio pessoal, e isso não se sustenta sem conta.
- **Exige banco de dados?** Sim.
- **Estático em GitHub Pages?** Não — esta é a funcionalidade que mais
  claramente exige sair da arquitetura atual do site.

---

## Grupo 4 — Monetização (premium de verdade)

### 4.1 Paywall de conteúdo (assinatura)

- **O que é:** restringir de verdade (não só esconder na interface)
  quais recursos exigem pagamento — comparação avançada, alertas
  customizados, dashboard multi-ativo.
- **Dependência técnica:** processador de pagamento (ex.: Stripe) +
  controle de acesso no backend. **Importante:** esconder algo só no
  HTML/JS do navegador não é um paywall de verdade — qualquer pessoa
  consegue inspecionar o código e ver o que "deveria" estar bloqueado.
  Um paywall real exige que o servidor (não o navegador) decida o que
  cada pessoa pode ver, o que por definição não roda em GitHub Pages.
- **Esforço estimado:** XL — é, na prática, construir um mini-SaaS
  (autenticação + cobrança recorrente + controle de acesso), não uma
  funcionalidade a mais na ferramenta atual.
- **Exige login?** Sim.
- **Exige banco de dados?** Sim.
- **Estático em GitHub Pages?** Não.

---

## Resumo — o que pode esperar e o que já pode ser feito sem sair do GitHub Pages

| Continua 100% estático (Grupo 1) | Depende de decisão de arquitetura (Grupos 2–4) |
|---|---|
| Gráfico de ciclo com marcadores | Alerta automático de verdade (mínimo: algum armazenamento) |
| Barra BTC vendido/restante | Alertas customizáveis (canais, conta) |
| Comparação simultânea dos 3 perfis | Múltiplos aportes/vendas persistentes entre dispositivos |
| Card de compartilhamento (imagem) | Preço médio dinâmico "de verdade" (depende do item anterior) |
| CTA sticky mobile | Dashboard vivo multi-ativo |
| Export de PDF | Paywall / assinatura paga |

**Linha de corte prática:** tudo do Grupo 1 pode ser construído a
qualquer momento, no mesmo ritmo do MVP, sem nenhuma conversa de
arquitetura adicional. A primeira vez que este produto vai *precisar*
sair do "site estático puro" é no alerta automático de verdade (Grupo
2) — e mesmo assim, a versão mínima (um arquivo de inscrições
versionado, atualizado por um robô do GitHub Actions, no mesmo espírito
dos robôs que já existem) ainda evita contratar um banco de dados
completo. Login de verdade só se torna necessário a partir do Grupo 3
— exatamente o ponto em que a prioridade declarada deste projeto diz
para não ir ainda: primeiro construir, publicar e medir se as pessoas
usam e deixam e-mail.
