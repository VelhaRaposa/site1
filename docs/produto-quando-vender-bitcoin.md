# Produto: "Quando Vender Bitcoin?"

> Aprofundamento do produto identificado na pesquisa de mercado
> (`docs/pesquisa-exit-strategy.md`). Este documento traz as 20+ regras de
> saída, backtest real contra os 4 ciclos já congelados no site,
> métricas de sucesso, fluxo de UX, visualização, estratégia de conteúdo,
> caminho de monetização, escopo de MVP e a resposta à pergunta central
> que originou a ferramenta.

## Frase-âncora do produto

> "Eu não preciso vender o topo. Eu só não quero assistir mais uma queda
> de 70% sem tirar nada da mesa."

Toda decisão de design abaixo — nenhuma previsão de topo, nenhum
indicador proprietário, nenhuma recomendação — existe para servir essa
frase. Se uma regra não tira nada da mesa antes de uma queda grande, ela
falhou no critério de aceite do produto, não importa quão sofisticada
pareça.

---

## 1. Regras de saída testáveis (23 regras mecânicas)

Organizadas em 5 categorias. Todas são parâmetros que o **usuário
escolhe e pode mudar** — nenhuma é um valor fixo imposto pela
ferramenta.

### A. Baseadas em preço / ATH (all-time high)

1. Vender X% do que resta a cada novo recorde histórico (ATH).
2. Vender X% a cada Y% de alta acima do ATH anterior (ex.: 10% a cada
   25% acima do topo do ciclo passado).
3. Vender X% quando o preço multiplicar por N em relação ao fundo do
   ciclo (ex.: vender 10% ao atingir 10x o fundo).
4. Vender tudo ao atingir um múltiplo-alvo fixo desde o fundo (ex.: 20x).
5. Vender X% quando o preço cair Y% abaixo do ATH mais recente (uma
   espécie de "trailing stop" de lucro, não de perda).
6. Vender X% quando o preço ultrapassar 2x o ATH do ciclo anterior
   (gatilho "dobrou o recorde").

### B. Baseadas em tempo / calendário

7. Vender X% a cada N dias corridos após um novo ATH ser feito.
8. Vender X% a cada N meses após o fundo confirmado do ciclo (idade do
   ciclo, independente de preço).
9. Vender em N parcelas iguais, distribuídas nos últimos M meses da
   janela historicamente associada a topo (ex.: 12–18 meses
   pós-halving).
10. Vender X% no aniversário de N anos de cada compra (independente de
    preço, baseado na data de aquisição de cada lote).

### C. Baseadas em indicadores públicos conhecidos (não-proprietários)

11. Vender quando o RSI semanal do BTC ultrapassar um valor (ex.: 80).
12. Vender quando o Pi Cycle Top (111DMA cruza 2x a 350DMA) disparar.
13. Vender quando o preço ultrapassar a banda superior do Rainbow Chart
    (regressão logarítmica pública).
14. Vender quando o MVRV Z-Score ultrapassar um limiar (ex.: 7).
15. Vender quando o Puell Multiple ultrapassar um limiar (mineração
    excepcionalmente lucrativa).

### D. Baseadas em patrimônio / alocação

16. Vender o suficiente para o BTC nunca ultrapassar X% do patrimônio
    total (rebalanceamento por teto de alocação).
17. Vender o suficiente para recuperar 100% do capital originalmente
    investido assim que o valor de mercado atingir 2x o aportado.
18. Vender X% assim que o lucro não realizado atingir um múltiplo Y do
    capital investido.

### E. Híbridas / compostas

19. Combinar idade do ciclo **e** múltiplo de preço — só vende se as
    duas condições forem satisfeitas ao mesmo tempo.
20. Escada de realização crescente: % de venda aumenta conforme o
    ciclo envelhece (ex.: 5% aos 12 meses, 10% aos 18, 15% aos 24).
21. "Seguro obrigatório": um piso mínimo de venda por idade do ciclo
    (independente do preço) **somado** a vendas adicionais por faixa de
    preço quando a alta for mais forte que o normal — a regra
    desenvolvida e testada abaixo, respondendo à pergunta central deste
    documento.
22. DCA-out simétrico ao DCA-in: vender o mesmo valor nominal (ou
    percentual) que foi aportado, na mesma cadência, invertido, a
    partir de uma certa idade do ciclo.
23. Realizar parcial ao primeiro sinal de correção >20% depois de um
    novo ATH — captura lucro perto do topo sem tentar acertar o dia
    exato.

---

## 2. Backtest real contra os 4 ciclos (2013, 2017, 2021, 2025)

Rodado com os dados reais já existentes no site
(`assets/data/btc-history-usd.json`) e os marcos de ciclo já congelados
em `assets/js/comparador-ciclos.js`. Simulação: 1 BTC comprado no fundo
de cada ciclo. Comparação sempre contra HODL puro (0% vendido).

Quatro regras representativas foram testadas: **(A)** vender 5% a cada
novo ATH · **(B)** vender 10% a cada 25% acima do ATH anterior ·
**(C)** vender por idade do ciclo (10/15/20/25% aos 12/18/24/30 meses)
· **(D)** "dobrou o ATH anterior" (vende 10% ao atingir 2x o topo
passado, mais 10% a cada 90 dias acima dele, até 50%).

| Ciclo | Regra | BTC restante no topo | Realizado (USD) | Patrimônio no topo vs. HODL | Patrimônio no fundo seguinte vs. HODL |
|---|---|---|---|---|---|
| **2011→2013** (fundo $2,30 → topo $1.137) | A | 0,090 | $135 | $237 vs. $1.137 | $149 vs. $152 (**-$3**) |
| | B | 0,000 | $125 | $125 vs. $1.137 | $125 vs. $152 (**-$27**) |
| | C | 0,612 | $127 | $823 vs. $1.137 | $220 vs. $152 (**+$68**) |
| | D | 0,729 | $28 | $857 vs. $1.137 | $139 vs. $152 (**-$13**) |
| **2015→2017** (fundo $152 → topo $19.783) | A | 0,019 | $2.260 | $2.641 vs. $19.783 | $2.320 vs. $3.122 (**-$802**) |
| | B | 0,001 | $4.065 | $4.091 vs. $19.783 | $4.069 vs. $3.122 (**+$947**) |
| | C | 0,459 | $560 | $9.640 vs. $19.783 | $1.993 vs. $3.122 (**-$1.129**) |
| | D | 0,729 | $1.278 | $15.700 vs. $19.783 | $3.554 vs. $3.122 (**+$432**) |
| **2018→2021** (fundo $3.122 → topo $68.789) | A | 0,184 | $28.133 | $40.792 vs. $68.789 | $30.981 vs. $15.476 (**+$15.505**) |
| | B | 0,349 | $27.888 | $51.873 vs. $68.789 | $33.284 vs. $15.476 (**+$17.808**) |
| | C | 0,459 | $10.149 | $41.723 vs. $68.789 | $17.252 vs. $15.476 (**+$1.776**) |
| | D | 0,656 | $15.338 | $60.470 vs. $68.789 | $25.491 vs. $15.476 (**+$10.015**) |
| **2022→2025** (fundo $15.476 → topo $126.296, queda seguinte ainda em andamento) | A | 0,142 | $75.965 | $93.949 vs. $126.296 | — (ver §2.1) |
| | B | 0,729 | $27.651 | $119.721 vs. $126.296 | — |
| | C | 0,459 | $44.579 | $102.549 vs. $126.296 | — |
| | D | **1,000 (0 vendas)** | **$0** | $126.296 (idêntico ao HODL) | — |

### 2.1 O dado mais importante do backtest

A regra D (**"vender ao dobrar o ATH anterior"**) — a que mais soa como
"esperar confirmação antes de agir" — **nunca disparou no ciclo
2022→2025**: o topo ($126.296) ficou abaixo de 2x o ATH anterior
($68.789 × 2 = $137.578). Zero vendas, patrimônio idêntico ao HODL puro.

Isso não é um acaso: cada ciclo do Bitcoin historicamente multiplica
menos o ATH anterior do que o ciclo passado (lei dos retornos
decrescentes). Uma regra ancorada em **múltiplo fixo de preço** vai,
cedo ou tarde, deixar de disparar — exatamente quando o patrimônio do
usuário é maior e o erro dói mais.

**Dado ao vivo, com a queda em andamento agora:** o topo de out/2025
($126.296) já caiu para a faixa de $58.500–$64.000 em jul/2026 (queda
provisória de ~50%, ainda sem fundo confirmado). Recalculando o
patrimônio hoje com o preço provisório de $58.534:

| Regra | Patrimônio hoje (provisório) | vs. HODL ($58.534) |
|---|---|---|
| A (5% por ATH) | $84.300 | **+$25.766** |
| B (10% por faixa de 25%) | $70.322 | **+$11.788** |
| C (idade do ciclo) | $71.446 | **+$12.912** |
| D (dobrou o ATH) | $58.534 | **+$0** — nunca vendeu nada |

A regra que soa mais "profissional" (esperar o preço dobrar) é, na
prática, a que **não protegeu nada** no ciclo mais recente. As regras
que forçam uma venda toda vez que o preço faz algo inédito (A e B)
protegeram entre $11 mil e $26 mil até agora — sem prever o topo, só
reagindo a recordes.

### 2.2 Outro ponto de atenção do backtest

A regra B (faixas de 25% acima do ATH anterior) **esgota a posição
inteira bem antes do topo real** em ciclos de alta muito grande (2013 e
2017: 100% vendido meses antes do pico). Faixas de preço precisam ser
calibradas com um teto de tranches ou uma banda mais larga — senão o
usuário "fica sem munição" e não participa do topo real, o oposto do
objetivo (ver §8, MVP, sobre como isso limita a regra escolhida por
padrão).

---

## 3. Como medir sucesso (além do lucro final)

Métricas a mostrar sempre em conjunto — nunca uma isolada, porque
lucro final sozinho reintroduz o viés de "eu deveria ter esperado mais":

| Métrica | O que responde |
|---|---|
| **Capital recuperado (%)** | Do dinheiro que entrou, quanto já voltou pro bolso — a métrica mais alinhada à "preservação" declarada pelo usuário. |
| **BTC restante** | Quanta exposição a alta continuada ainda resta — mostra que a regra não é "vender tudo". |
| **Meses até recuperar o capital investido** | Quando a posição virou "dinheiro da casa" (jogando com lucro, não mais com principal). |
| **Drawdown evitado** | Diferença de patrimônio entre a regra e o HODL puro no fundo do ciclo seguinte — a métrica que expõe o erro histórico do usuário. |
| **Patrimônio final (regra vs. HODL)** | Comparação direta, sempre lado a lado, nunca a regra isolada. |
| **Nº de vendas / eventos** | Transparência de quão ativa é a regra — regras "silenciosas" (poucos eventos) tendem a ser mais fáceis de seguir na prática. |

Não mostrar "retorno anualizado" nem comparar contra outros ativos aqui
— isso já existe no Comparador de Investimentos e misturaria o foco.

---

## 4. Fluxo de UX

**Preenchimento (1 tela, sem scroll):**
1. Quanto BTC você tem hoje (ou valor em R$/US$ + preço médio).
2. Uma regra pré-selecionada por padrão (ver MVP, §8), com "ver outras
   regras" recolhido atrás de um accordion — não uma lista de 23 opções
   de cara.
3. Botão único: "Simular".

**Primeira tela de resultado (acima da dobra, sem rolar):**
- 3 a 4 cards grandes: patrimônio hoje sob a regra vs. HODL, capital
  recuperado, BTC restante — números, não texto.
- Uma frase de contexto automática, descritiva (nunca imperativa):
  *"Se você tivesse seguido essa regra desde o fundo do ciclo atual,
  teria realizado US$ X e ainda teria Y BTC."*

**Rolando para baixo:**
- Gráfico do ciclo (reaproveitando o Comparador de Ciclos) com os
  pontos de venda marcados sobre a curva.
- Linha do tempo com cada evento de venda.
- Comparação lado a lado com os outros 3 ciclos passados (2013, 2017,
  2021) rodando a mesma regra — para o usuário ver que a regra não foi
  testada só no cenário mais favorável.

**Como evitar excesso de informação:**
- Nunca mostrar mais de 1 regra ativa por vez no resultado principal —
  comparação entre regras é uma ação explícita ("comparar com outra
  regra"), não o estado padrão.
- Tabela detalhada de todos os eventos fica atrás de "ver todos os
  eventos", fechada por padrão.
- Nenhum jargão sem explicação inline (nada de "MVRV" sem um tooltip de
  uma frase).

---

## 5. Visualização mais intuitiva

Ordem de prioridade, da mais para a menos intuitiva:

1. **Cards numéricos grandes** (patrimônio, capital recuperado, BTC
   restante) — o que qualquer usuário entende em 2 segundos, sem
   precisar interpretar um gráfico.
2. **Gráfico do ciclo com marcadores de venda sobrepostos** — reaproveita
   o ativo visual mais forte que o site já tem (Comparador de Ciclos);
   cada venda vira um ponto na curva de preço, com tamanho proporcional
   ao valor vendido.
3. **Barra horizontal "BTC vendido vs. BTC restante"** — uma imagem só,
   sem precisar ler número nenhum, para entender de relance quanta
   exposição ainda resta.
4. **Linha do tempo (lista cronológica)** dos eventos de venda — bom
   complemento ao gráfico, mostra "quando" de forma linear.
5. **Tabela detalhada** — só como modo avançado/exportável, nunca como
   visualização primária (é a mais precisa, mas a menos intuitiva de
   bater o olho).

O gráfico de ciclo com marcadores (item 2) é o mais diferenciado — é o
único, entre tudo pesquisado no documento anterior, que mostra a decisão
de venda **no contexto do próprio ciclo histórico**, em vez de isolada
numa tabela.

---

## 6. Conteúdo viral / compartilhamento orgânico

- **Resultado pessoal, não genérico:** o gancho viral é o usuário
  inserir o próprio preço médio e ver o próprio número — "descubra
  quanto patrimônio você teria preservado se tivesse seguido essa regra
  em 2021" converte muito mais que uma simulação com números
  fixos.
- **Card de resultado exportável (imagem):** gerar uma imagem
  compartilhável no formato "Se eu tivesse vendido 5% a cada topo desde
  2021, hoje eu teria X BTC e Y realizados" — pronta para postar no
  X/Twitter, com a marca do site.
- **Timing de publicação:** o gancho é mais forte logo depois de uma
  queda forte (a dor está fresca) — "Você teria evitado isso?" performa
  melhor que o mesmo conteúdo publicado no topo do ciclo.
- **Formato de confissão pessoal:** o autor mostrando o próprio
  resultado ("eu não vendi nada em 2021 — se eu tivesse seguido a regra
  X, teria preservado $Y") tende a gerar mais engajamento que uma
  ferramenta impessoal, porque valida a dor que motivou o produto.
- **Ângulo "e agora" com o ciclo atual:** como o ciclo 2022→2025 já caiu
  ~50% do topo (dado real, §2.1), dá pra publicar "o ciclo que começou em
  2025 já caiu tanto quanto os anteriores nesse ponto — veja o que cada
  regra já teria feito" — conteúdo atual, não só histórico.

---

## 7. Caminho de monetização (premium), sem quebrar a simplicidade

**Fica grátis para sempre (é o produto principal, não isca):**
- Simulação de 1 regra por vez contra os 4 ciclos históricos.
- Os cards de resultado e o gráfico com marcadores.
- Card de compartilhamento.

**Pode virar premium (recursos que dependem de acompanhamento contínuo,
não de "mais informação na mesma tela"):**
- **Alertas por e-mail:** avisar quando um marco da regra escolhida do
  usuário é atingido (ex.: "sua regra indicaria uma realização parcial
  hoje") — é o único recurso que justifica recorrência mensal, porque
  o valor de uma regra é justamente não precisar checar todo dia.
- **Comparação lado a lado de várias regras ao mesmo tempo** (o modo
  "avançado" que o grátis esconde por design).
- **Regra híbrida customizável** (combinar idade + preço + patrimônio
  com pesos próprios) em vez das combinações pré-definidas.
- **Multi-ativo:** conectar com o Comparador de Investimentos para a
  regra de "% do patrimônio total", considerando renda fixa/ações além
  de Bitcoin.
- **Exportar relatório (PDF)** com o histórico de simulação — útil para
  quem quer levar isso a um planejamento patrimonial mais formal.

O critério para o que é premium: **tudo que exige voltar no site
repetidamente para continuar tendo valor** (alerta, multi-ativo,
export) é candidato a pago; tudo que é **uma simulação que se
esgota em uma visita** continua grátis.

---

## 8. MVP — menor versão que já resolve o problema real (1 semana)

> **Atualizado por `docs/perfis-de-investidor.md`:** o MVP abaixo foi
> revisado depois de testar perfis de investidor (Preservação,
> Equilíbrio, Convicção) em vez de uma única regra padrão. A escolha por
> perfil é o diferencial de produto real — as primitivas de
> implementação (recuperação de capital, piso por idade, bandas de
> preço) são as mesmas, então o custo de construir os 3 perfis desde o
> início é marginal frente a construir só 1 regra. Ver aquele documento
> para os números completos.

**Escopo:**
- Input: BTC atual (ou valor + preço médio) — reaproveitando o mesmo
  padrão de input da Calculadora DCA já existente.
- **Escolha de 1 dos 3 perfis (Preservação / Equilíbrio / Convicção)**
  como primeira pergunta, em vez de uma regra técnica — cada perfil já
  é uma combinação fixa e documentada das regras testadas (ver
  `docs/perfis-de-investidor.md`). O modo avançado (mexer nos
  parâmetros de cada regra) fica atrás de um toggle, não é o padrão.
- Backtest automático, sem seleção de datas manual, contra os 4 ciclos
  já congelados em `comparador-ciclos.js` — reaproveita 100% da
  metodologia e dos dados que já existem, sem nova fonte de verdade.
- Output: as 4 métricas de tranquilidade (meses até recuperar capital,
  % exposto no topo, proteção no fundo seguinte, nº de eventos) + o
  gráfico de ciclo com os marcadores de venda sobrepostos.
- Tudo client-side, 100% local, mesmo padrão arquitetural das
  ferramentas atuais (sem API, sem backend).

**Fora do MVP (fica para v2):**
- Comparação simultânea dos 3 perfis lado a lado (v1 mostra 1 por vez,
  com "veja os outros perfis" secundário).
- Alertas/e-mail.
- Perfil customizado com pesos próprios além dos 3 padrão.
- Integração com patrimônio multi-ativo.
- Conta de usuário / salvar cenário.
- Card de compartilhamento em imagem (pode ser v1.1, é simples, mas não
  é bloqueante para validar a hipótese central).

---

## 9. A pergunta que importa mais: qual regra o Caio teria seguido?

Rodando os dois maiores erros declarados — não vender parcialmente em
2021 e não rebalancear — contra os dados reais:

**A resposta não é RSI, não é ATH absoluto e não é um múltiplo fixo de
preço.** O backtest prova isso de forma concreta: a regra que soa mais
"disciplinada" (esperar o preço dobrar o recorde anterior antes de agir)
simplesmente **não disparou nenhuma vez** no ciclo 2022→2025 — a mesma
armadilha que faria alguém repetir o erro de 2021 hoje, achando que está
"esperando confirmação".

O que protegeu de verdade, nos dados: **qualquer regra que force uma
venda toda vez que o preço faz algo que nunca fez antes** (novo recorde,
ou nova faixa percentual acima do recorde anterior) — porque isso
corresponde estruturalmente aos momentos de euforia, sem depender de um
nível de preço absoluto que perde significado a cada ciclo (2011 e 2025
são mundos de magnitude diferentes; "dobrar o ATH" significa coisas
completamente diferentes nos dois).

Mas essas regras sozinhas têm uma falha: dependem do usuário estar de
olho ou ter configurado um alerta. Não são, de fato, um "seguro
obrigatório" — são reativas ao mercado, não ao calendário.

Por isso a resposta final é a combinação que o próprio usuário
suspeitou: **um piso mínimo de venda por idade do ciclo (baixo,
tipo 10–15% até os 24 meses, existindo mesmo que o preço não tenha feito
nada especial) funcionando como rede de segurança**, somado às vendas
por faixa de preço (regra B) como motor principal quando a alta for
forte. A idade do ciclo garante que, mesmo num ciclo "morno" como o
atual — que nem chegou a dobrar o ATH anterior — alguma coisa já teria
saído da mesa só porque o tempo passou. O preço garante que, num ciclo
de euforia forte, a realização acompanha a euforia em vez de ficar presa
a um calendário arbitrário.

Essa é, literalmente, a tradução mecânica da frase que originou o
produto: não hipotecar a decisão a acertar o topo (isso é o motor de
preço), e não ficar mais uma vez de mãos vazias só porque o gatilho de
preço "ideal" nunca chegou a disparar (isso é o piso por idade). A
pergunta que deveria abrir o README, e que deveria ser o critério de
aceite de qualquer regra adicionada à ferramenta no futuro, é sempre a
mesma: **"essa regra teria tirado alguma coisa da mesa antes da queda?"**
Se a resposta para 2021 e para o ciclo atual for sim, a regra passa. Se
for não — não importa quão sofisticada pareça — ela repete o erro que
esse produto existe para resolver.
