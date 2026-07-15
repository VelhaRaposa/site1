# Interface — "Quando Vender Bitcoin?"

> Especificação de experiência, não de mercado. Não introduz nenhuma
> regra, perfil ou número novo — usa exclusivamente o que já foi
> validado em `docs/produto-quando-vender-bitcoin.md`,
> `docs/perfis-de-investidor.md` e `docs/recorrencia-e-mvp-final.md`.
> Referencia os componentes e tokens já existentes em
> `assets/css/style.css` (cards, `.pill`, `.tool-hero`, `.num-lg`,
> `.btn-primary`/`.btn-ghost`, grid) para que o wireframe final seja
> implementável sem inventar um novo sistema visual.

## Princípios que guiam toda decisão abaixo

- O usuário não é trader, tem 35–55 anos, e provavelmente não sabe o
  que é MVRV, SOPR ou Pi Cycle — **nenhuma tela pode exigir esse
  vocabulário para ser usada**.
- Simplicidade vale mais que precisão acadêmica — cada tela deve poder
  ser entendida em uma passada, sem tooltip.
- O diferencial real não é o cálculo, é a tradução de uma filosofia
  ("não preciso vender o topo, só não quero ficar de mãos vazias") em
  uma regra que a pessoa consegue seguir sem pensar toda vez.

---

## Seção por seção

### 1. Hero da página

**Objetivo:** em até 3 segundos, confirmar para quem chegou pela busca
("quando vender Bitcoin", "bitcoin exit strategy") que a página resolve
exatamente essa dúvida — e, ao mesmo tempo, afastar a expectativa
errada (não é sinal de compra/venda, não é previsão de topo).

**Informação exibida:** eyebrow ("ferramenta gratuita · sem indicador
proprietário"), H1, subheadline, 1 CTA primário. Mesma estrutura visual
do `.tool-hero` já usado no Comparador de Ciclos e na Calculadora DCA —
compacta, porque a ferramenta em si é o conteúdo principal, não a hero.

**Por que existe:** sem uma resposta imediata e honesta sobre o que a
página é (e não é), a maior parte do tráfego de busca sai sem interagir
— principalmente porque o termo de busca ("exit strategy") atrai
esperando um sinal, e a ferramenta precisa reposicionar essa expectativa
sem perder a pessoa.

**O que pode ser removido sem prejudicar o produto:** qualquer imagem
decorativa ou gráfico de fundo (`.hero-chart`) — no MVP, texto + CTA já
bastam; a versão com fundo decorativo é puramente estética e só faz
sentido depois que o resto existir.

---

### 2. Headline principal (H1)

**Texto:** *"Quando vender Bitcoin?"*

**Objetivo:** casar exatamente com o termo de busca que trouxe a
pessoa, sem se perder por metáfora — H1 é sobre intenção de busca, não
sobre a frase-âncora do produto (essa entra na subheadline).

**Por que existe:** é o único elemento indispensável de SEO on-page;
sem ele a página compete pior no termo que a trouxe até aqui.

**O que pode ser removido:** nada. É o único item desta lista inteira
sem alternativa de corte.

---

### 3. Subheadline

**Texto:** *"Escolha o tipo de investidor que você é e veja a regra de
realização de lucro que ele seguiria nos 4 ciclos reais do Bitcoin. Sem
prever topo. Sem indicador complicado. Sem recomendação financeira."*

**Objetivo:** entregar, numa frase, os 3 filtros que decidem se a
pessoa certa fica: (1) isto é sobre regra, não sobre previsão; (2) isto
é simples, não é um terminal de métricas; (3) isto não é conselho
financeiro — reduz o receio de quem já foi maltratado por "sinais" de
outros sites.

**Por que existe:** é o que diferencia esta página de qualquer resultado
de busca concorrente (Glassnode, LookIntoBitcoin, Cowen) logo na
primeira dobra — sem isso, a pessoa assume que é "mais um indicador".

**O que pode ser removido:** a menção aos "4 ciclos reais" pode ser
cortada numa versão mais enxuta; "sem recomendação financeira" e "sem
indicador complicado" devem permanecer sempre — são a base de confiança
e de enquadramento legal do produto.

---

### 4. Explicação dos 3 perfis

**Objetivo:** fazer a pessoa se reconhecer num dos 3 perfis em segundos,
sem precisar entender regra nenhuma antes — a decisão é de
personalidade, não de parâmetro técnico.

**Informação exibida:** grid de 3 cards (`.grid-3` / `.card`, o mesmo
componente já usado no site), cada um com:
- Nome do perfil (Preservação / Equilíbrio / Convicção).
- A frase que já define cada um (ex.: *"Recuperar 100% do capital
  investido o mais cedo possível. Prioriza eliminar risco."*).
- Um botão `.btn-ghost` "Escolher este perfil".

**Por que existe:** é o coração do diferencial do produto citado desde
o início deste projeto — nem Cowen, nem LookIntoBitcoin, nem Glassnode
pedem para o usuário se identificar com um perfil antes de mostrar um
número. Transformar a escolha em "que tipo de investidor você é"
em vez de "que indicador você quer ver" é o que separa este produto de
mais uma calculadora técnica.

**O que pode ser removido:** qualquer métrica-exemplo dentro do card
(ex.: "historicamente recuperou 486% do capital") — é informação
demais antes de a pessoa preencher os próprios dados; deixar só a frase
e o botão no MVP.

---

### 5. Fluxo de onboarding

**Objetivo:** coletar o mínimo de dado pessoal necessário para o
resultado deixar de ser genérico, com o menor atrito possível — sem
conta, sem senha.

**Passos:**
1. Perfil já vem selecionado (herdado da seção anterior) — mostrado
   como um chip/`.pill` no topo, com opção de trocar.
2. Um único campo obrigatório: *"Quanto Bitcoin você tem hoje?"* (aceita
   BTC ou valor em R$/US$).
3. Um campo opcional: *"Preço médio de compra"* — se deixado em branco,
   a ferramenta assume o fundo do ciclo mais recente como referência e
   avisa isso com uma frase, sem bloquear o uso.
4. Botão único `.btn-primary`: **"Ver meu resultado"**.

**Por que existe:** sem esses dois números (BTC + preço médio), toda
tela seguinte teria que ser genérica — e "genérico" é exatamente o que
mais errado do que este produto já resolve mostrando o backtest com
1 BTC fictício.

**O que pode ser removido:** o campo "preço médio" — pode ser sempre
opcional (com o fallback já descrito), reduzindo o formulário a **1
campo só** no caminho mais curto possível.

---

### 6. Tela de resultado (primeira tela pós-onboarding)

**Objetivo:** entregar a "prova" — o que aquele perfil, com os números
que a pessoa acabou de informar, teria feito nos 4 ciclos reais do
Bitcoin — sem precisar rolar a página para ver o primeiro número.

**Informação exibida, em ordem:**
1. Frase de contexto automática, gerada, nunca imperativa: *"Se você
   tivesse seguido o perfil Equilíbrio desde o fundo do ciclo de 2022,
   hoje teria recuperado 153% do que investiu e ainda manteria 65% da
   posição em Bitcoin."*
2. 3 cards grandes (componente `.card` + `.num-lg`): **Capital
   recuperado**, **BTC ainda exposto**, **Patrimônio hoje vs. HODL**.
3. CTA primário: **"Ver meu Ciclo Atual"** (leva à seção 7).
4. CTA secundário (`.btn-ghost`): "Comparar com outro perfil".

**Por que existe:** é a tela que gera confiança suficiente para o
usuário continuar (captura de e-mail, tela ciclo atual) — sem prova
concreta com os próprios números, ninguém aceita "escolher um perfil" e
seguir adiante.

**O que pode ser removido:** o gráfico do ciclo com marcadores de venda
sobrepostos (ver seção 9) — no MVP, os 3 cards + a frase automática já
cumprem a função; o gráfico é reforço visual, não é indispensável para
entender o resultado.

---

### 7. Tela "Ciclo Atual"

**Objetivo:** ser o motivo de o usuário voltar — responde "onde eu
estou agora", não "o que já aconteceu". É a tela central do produto, e
a única com conteúdo que muda com o preço do dia (ver
`docs/recorrencia-e-mvp-final.md`, §2).

**Informação exibida (usando o exemplo real já calculado no documento
anterior, perfil Equilíbrio, alguém que comprou no fundo do ciclo de
2022):**
- Chip do perfil ativo, com link discreto "trocar perfil".
- Card grande: **Capital recuperado — 153%** ("o resto já é dinheiro da
  casa").
- Card grande: **BTC ainda exposto — 65% do patrimônio**.
- Bloco "Próximo gatilho": *"Novo recorde histórico acima de
  US$ 124.777 (faltam 101,7% de alta)"*.
- Linha secundária: **Última ação simulada** — *"23/05/2025 @
  US$ 111.722 — piso de idade, realizou 7,4% da posição."*
- Bloco de captura de e-mail, contextual: *"Avise-me quando o próximo
  gatilho da minha regra acontecer"* + campo de e-mail + botão.

**Por que existe:** é a resposta direta ao problema que fez este
produto nascer — sem esta tela, o produto é só um simulador histórico
de uso único (ver auditoria de recorrência, `docs/recorrencia-e-mvp-final.md`,
§1).

**O que pode ser removido:** o gráfico de ciclo com marcador da posição
atual — no MVP, o texto + os cards já bastam; some no V1.

---

### 8. Cards principais (componente transversal)

**Objetivo:** garantir que todo número importante da ferramenta (em
qualquer tela) siga o mesmo padrão visual — para o usuário aprender a
ler a informação uma vez e reconhecer o padrão em toda tela seguinte.

**Informação exibida:** número grande (`.num-lg`, fonte mono ou
display conforme já definido em tokens), label curto abaixo, e — só
quando necessário — uma segunda linha pequena de contexto (ex.: "vs.
HODL: +US$ 5.167").

**Por que existe:** consistência é o que faz a interface parecer
simples mesmo mostrando vários números — é o mesmo motivo pelo qual o
Comparador de Ciclos e a Calculadora DCA já usam esse padrão.

**O que pode ser removido:** a linha de contexto secundária pode ser
omitida em telas com pouco espaço (mobile) sem perder o essencial — o
número + label sempre ficam.

---

### 9. Gráficos

**Dois gráficos possíveis, nunca mais que isso:**

1. **Gráfico de ciclo com marcadores de venda** (reaproveita o
   Chart.js e os dados já usados no Comparador de Ciclos) — mostra a
   curva de preço do ciclo com um ponto em cada venda simulada. Aparece
   na Tela de Resultado e na Tela Ciclo Atual.
2. **Barra horizontal "BTC vendido vs. BTC restante"** — uma única
   barra dividida em 2 cores, sem eixo, sem números além dos que já
   aparecem nos cards.

**Objetivo:** tornar tangível "onde essa venda aconteceu" sem exigir
leitura de tabela.

**Por que existe:** é o único elemento, de toda a interface, que coloca
a decisão de venda **no contexto do próprio histórico do Bitcoin** —
todo o resto é número isolado.

**O que pode ser removido:** o gráfico de ciclo completo (item 1) é o
mais caro de construir e o mais dispensável no MVP — os cards e a barra
horizontal (item 2, muito mais simples) já comunicam o essencial.
Guardar o gráfico completo para o V1.

---

### 10. CTAs (mapa completo)

| Onde | CTA primário | CTA secundário |
|---|---|---|
| Hero | "Descobrir meu perfil" → rola para seção de perfis | — |
| Perfis | "Escolher este perfil" (por card) | — |
| Onboarding | "Ver meu resultado" | — |
| Tela de Resultado | "Ver meu Ciclo Atual" | "Comparar com outro perfil" |
| Tela Ciclo Atual | "Avisar no próximo gatilho" (captura de e-mail) | "Compartilhar meu resultado" |

**Objetivo:** cada CTA move o usuário para o próximo nível de
comprometimento (visita → perfil escolhido → dados preenchidos →
e-mail capturado → recorrência) — nunca dois CTAs primários
competindo na mesma tela.

**O que pode ser removido:** "Compartilhar meu resultado" — fica de
fora do MVP sem prejudicar a função central do produto (ver hierarquia
abaixo).

---

### 11. Captura de e-mail

**Objetivo:** ser o único mecanismo, de toda a ferramenta, que gera
recorrência sem depender de o usuário lembrar sozinho de voltar — a
conclusão central de `docs/recorrencia-e-mvp-final.md`.

**Onde:** dentro da Tela Ciclo Atual, colada ao bloco "Próximo gatilho"
— nunca um pop-up genérico de newsletter; o pedido é sempre contextual
("avise-me quando ESTE gatilho específico do MEU perfil acontecer").

**Informação exibida:** 1 campo de e-mail + 1 frase de escopo (o que
será avisado, e que não haverá mais nada além disso) + botão.

**Por que existe:** sem isso, mesmo a Tela Ciclo Atual depende de o
usuário lembrar de checar sozinho — reproduzindo o exato problema que
motivou o produto (não fazer nada porque ninguém avisou a tempo).

**O que pode ser removido:** a automação do envio (verificação diária
do gatilho) pode faltar no MVP — a captura do e-mail em si não pode.

---

### 12. Área premium futura

**Objetivo:** sinalizar, sem cobrar nada ainda, que existe um caminho
pago — e capturar interesse antecipado.

**Onde:** um bloco discreto no rodapé da Tela Ciclo Atual: *"Recursos
avançados em breve: comparar os 3 perfis lado a lado automaticamente,
alertas customizados, patrimônio multi-ativo."* + link "Quero saber
quando lançar" (mesma captura de e-mail, outro rótulo).

**Por que existe:** prepara expectativa e permite medir interesse sem
nenhum custo de engenharia adicional.

**O que pode ser removido:** a seção inteira — é o item mais dispensável
de toda esta lista; não afeta em nada a capacidade do produto de
cumprir sua missão central.

---

### 13. Mobile

**Objetivo:** manter a mesma hierarquia de informação do desktop, só
que empilhada — nada de conteúdo exclusivo de uma versão.

**O que muda:**
- Grid de perfis (`.grid-3`) empilha em coluna única abaixo de 760px
  (já é o comportamento padrão do CSS existente).
- Cards de número (Tela Resultado / Ciclo Atual) empilham em coluna
  única, sempre número + label visível sem cortar.
- Gráfico de ciclo reduz de altura (mesmo padrão já usado no Comparador
  de Ciclos: 560px → 380px abaixo de 640px).
- CTA primário de cada tela fica fixo/sticky no rodapé da viewport
  (útil especialmente na Tela Ciclo Atual, onde captura de e-mail é o
  objetivo #1) — recurso do V1, não obrigatório no MVP.

**O que pode ser removido:** o CTA sticky no rodapé — no MVP, o CTA
inline (não fixo) já funciona, só é menos eficiente.

---

### 14. Desktop

**Objetivo:** aproveitar a largura extra para comparação lado a lado,
sem adicionar informação nova — é a mesma hierarquia do mobile, só
menos empilhada.

**O que muda:**
- Perfis em 3 colunas (`.grid-3`).
- Cards de número da Tela de Resultado e Ciclo Atual em linha (3–4
  colunas), com o gráfico ocupando a largura cheia abaixo.
- Espaço para o bloco "Comparar com outro perfil" aparecer como
  colunas lado a lado (perfil ativo destacado, os outros 2 esmaecidos)
  — recurso do V1.

---

## Hierarquia de importância

### MVP obrigatório
- Hero + H1 + subheadline (seções 1–3).
- Explicação dos 3 perfis, só com a frase de cada um (seção 4).
- Onboarding com 1 campo obrigatório (BTC atual) + 1 opcional (preço
  médio) (seção 5).
- Tela de Resultado com frase automática + 3 cards de número, sem
  gráfico (seção 6, sem o item do §9).
- Tela Ciclo Atual com todos os 7 campos em texto/cards, sem gráfico
  (seção 7, sem o item do §9).
- Captura de e-mail contextual na Tela Ciclo Atual, mesmo que o envio
  do alerta em si comece manual (seção 11).
- Responsividade mobile básica (empilhamento, sem sticky CTA) (seção
  13).

### V1 desejável
- Gráfico de ciclo com marcadores de venda (seção 9, item 1) nas duas
  telas.
- Barra horizontal "BTC vendido vs. restante" (seção 9, item 2).
- CTA "Comparar com outro perfil" funcionando de fato (hoje só
  aparece, no MVP, sem levar a lugar nenhum).
- Alerta automático de verdade disparando no gatilho (não só a
  captura do e-mail).
- Card de compartilhamento em imagem (seção 10).
- CTA sticky mobile (seção 13).

### V2 futura
- Área premium com conteúdo real (comparação avançada automática,
  multi-ativo, export em PDF) (seção 12).
- Alertas customizáveis (frequência, canais).
- Conta de usuário / salvar cenário.
- Integração com o Comparador de Investimentos para patrimônio total
  multi-ativo.

---

## Wireframe textual — Página inicial ("Quando Vender Bitcoin?")

```
┌──────────────────────────────────────────────────────────────────┐
│ #site-header (já existente, reaproveitado sem mudança)            │
│ [logo Caio Garé]     Ferramentas  Agenda  Cursos      [Assinar]    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ .tool-hero                                                        │
│                                                                    │
│  eyebrow:  ─ ferramenta gratuita · sem indicador proprietário     │
│                                                                    │
│  h1:       Quando vender Bitcoin?                                 │
│                                                                    │
│  .lead:    Escolha o tipo de investidor que você é e veja a       │
│            regra de realização de lucro que ele seguiria nos      │
│            4 ciclos reais do Bitcoin. Sem prever topo. Sem        │
│            indicador complicado. Sem recomendação financeira.     │
│                                                                    │
│  [ Descobrir meu perfil ▾ ]  <- .btn-primary, rola até §perfis    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ section#perfis .section-border-top                                │
│                                                                    │
│  .section-head                                                    │
│    eyebrow: que tipo de investidor você é?                        │
│    h2: 3 formas de tirar algo da mesa — nenhuma tenta acertar      │
│        o topo                                                     │
│                                                                    │
│  .grid.grid-3                                                     │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐│
│  │ .card             │ │ .card             │ │ .card             ││
│  │ 🛡  Preservação    │ │ ⚖  Equilíbrio     │ │ 💎  Convicção      ││
│  │                   │ │                   │ │                   ││
│  │ "Recuperar 100%   │ │ "Recupera capital │ │ "Realizações       ││
│  │ do capital        │ │ e mantém a maior  │ │ menores. Aceita    ││
│  │ investido o mais  │ │ parte da posição." │ │ mais volatilidade  ││
│  │ cedo possível."   │ │                   │ │ para preservar     ││
│  │                   │ │                   │ │ mais BTC."         ││
│  │ [Escolher este    │ │ [Escolher este    │ │ [Escolher este    ││
│  │  perfil]          │ │  perfil]          │ │  perfil]           ││
│  │ .btn-ghost        │ │ .btn-ghost        │ │ .btn-ghost         ││
│  └───────────────────┘ └───────────────────┘ └───────────────────┘│
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ section#onboarding (some depois de o perfil ser escolhido —        │
│ aparece com scroll suave logo abaixo do card clicado)              │
│                                                                    │
│  .card (mais largo, max-w-article)                                │
│                                                                    │
│    chip do perfil escolhido:  [ ⚖ Equilíbrio  ✕ trocar ]          │
│                                                                    │
│    label: Quanto Bitcoin você tem hoje?                           │
│    [ input: 0.00000000 BTC   |   ou em R$/US$ ▾ ]                 │
│                                                                    │
│    label (opcional): Qual foi seu preço médio de compra?          │
│    [ input: US$ ______ ]                                          │
│    nota: "se deixar em branco, usamos o fundo do ciclo mais        │
│    recente como referência"                                       │
│                                                                    │
│    [ Ver meu resultado ]  <- .btn-primary                          │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ section#resultado (aparece após submeter o onboarding)             │
│                                                                    │
│  .section-head                                                    │
│    eyebrow: seu resultado — perfil Equilíbrio                     │
│    h2 (frase automática, não imperativa):                         │
│    "Se você tivesse seguido esse perfil desde o fundo do ciclo     │
│    de 2022, hoje teria recuperado 153% do que investiu e ainda     │
│    manteria 65% da posição em Bitcoin."                            │
│                                                                    │
│  .grid.grid-3                                                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐            │
│  │ .card         │ │ .card         │ │ .card         │            │
│  │ .num-lg       │ │ .num-lg       │ │ .num-lg       │            │
│  │  153%         │ │  65%          │ │ +US$ 5.167    │            │
│  │ Capital       │ │ BTC ainda     │ │ Patrimônio    │            │
│  │ recuperado    │ │ exposto       │ │ vs. HODL      │            │
│  └───────────────┘ └───────────────┘ └───────────────┘            │
│                                                                    │
│  [ Ver meu Ciclo Atual ]        [ Comparar com outro perfil ]      │
│    .btn-primary                    .btn-ghost                      │
│                                                                    │
│  (V1) — .chart-frame com o gráfico do ciclo + marcadores de venda  │
│  (V1) — barra horizontal BTC vendido vs. restante                  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ footer (já existente, reaproveitado)                               │
│ Bloco discreto: "Recursos avançados em breve — comparar perfis     │
│ automaticamente, alertas customizados, patrimônio multi-ativo.     │
│ [ Quero saber quando lançar ]"                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Wireframe textual — Tela "Ciclo Atual"

```
┌──────────────────────────────────────────────────────────────────┐
│ #site-header                                                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ .tool-hero                                                        │
│                                                                    │
│  eyebrow: seu ciclo, agora                                         │
│  h1: Onde você está hoje                                           │
│  .lead: Não é sobre acertar o topo. É sobre saber, a qualquer      │
│         momento, o que sua regra já fez por você e o que vem       │
│         a seguir.                                                  │
│                                                                    │
│  chip do perfil ativo:  [ ⚖ Equilíbrio   ✕ trocar perfil ]        │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ .grid.grid-2 (desktop) / coluna única (mobile)                    │
│                                                                    │
│  ┌────────────────────────────┐ ┌────────────────────────────┐    │
│  │ .card                      │ │ .card                      │    │
│  │ .num-lg   153%             │ │ .num-lg   65%               │    │
│  │ Capital recuperado          │ │ BTC ainda exposto            │    │
│  │ "o resto já é dinheiro      │ │ do seu patrimônio total      │    │
│  │  da casa"                   │ │                              │    │
│  └────────────────────────────┘ └────────────────────────────┘    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ .card (largura cheia) — bloco "Próximo gatilho"                   │
│                                                                    │
│   eyebrow: próximo gatilho da sua regra                            │
│                                                                    │
│   "Novo recorde histórico acima de US$ 124.777"                    │
│   barra de progresso: preço atual (US$ 61.849) ────────░░░░ alvo   │
│   "faltam 101,7% de alta para chegar lá"                            │
│                                                                    │
│   (V1) — .chart-frame com marcador da posição atual no ciclo       │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ .card — "Última ação simulada"                                    │
│                                                                    │
│   23/05/2025 · preço US$ 111.722                                    │
│   Piso de idade → realizou 7,4% da posição original                 │
│                                                                    │
│   (V1) — "Próxima ação esperada":                                   │
│   "Se o preço romper US$ 124.777, sua regra realizaria mais 15%     │
│   do que resta."                                                   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ .card (fundo destacado, --accent-soft) — captura de e-mail        │
│                                                                    │
│   "Quer ser avisado quando esse gatilho acontecer?"                │
│   Só um e-mail, quando o seu gatilho específico disparar. Nada     │
│   além disso.                                                      │
│                                                                    │
│   [ seu@email.com                    ] [ Me avise ]                │
│                                        .btn-primary                │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CTA secundário (V1): [ Compartilhar meu resultado ]  .btn-ghost    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ footer — bloco discreto de área premium (igual à Home)            │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile:** mesma ordem vertical, cards em coluna única, barra de
progresso do "próximo gatilho" ocupa a largura cheia, e (V1) o botão de
captura de e-mail vira sticky no rodapé da tela enquanto o usuário rola.
