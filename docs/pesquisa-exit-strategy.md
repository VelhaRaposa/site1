# Pesquisa: ferramentas de Exit Strategy, DCA Out, Profit Taking e Wealth Preservation em Bitcoin

> Documento de pesquisa interna. Não é uma página pública do site — serve
> como base de decisão para a próxima ferramenta a construir. Data da
> pesquisa: julho/2026.

## Contexto e critério de avaliação

O site já tem duas ferramentas (Calculadora DCA e Comparador de Ciclos)
que resolvem o lado da **acumulação**. O problema declarado do público-alvo
(homens 35-45, investidores de longo prazo, não-traders) não é "como
comprar" — é **"como saber quando parar de acumular e começar a realizar
lucros, sem virar timing de topo e sem deixar a ganância substituir
regras"**. Toda ferramenta abaixo foi avaliada com essa lente: ela ajuda a
transformar uma decisão emocional em uma regra objetiva, ou apenas entrega
mais um número para o investidor interpretar sozinho?

---

## 1. Glassnode

**Problema que resolve:** dá visibilidade sobre o comportamento agregado
de holders on-chain (quem está realizando lucro, quem está em perda, há
quanto tempo as moedas não se movem) para embasar decisões de ciclo.

**Como funciona:** processa dados brutos da blockchain do Bitcoin e
publica dezenas de métricas — SOPR (Spent Output Profit Ratio), MVRV
Z-Score, Realized Profit/Loss Ratio, Short-Term Holder Realized Profit,
HODL Waves, etc. Cada métrica tem uma leitura histórica associada a
topos/fundos de ciclo.

**Inputs:** nenhum do usuário — os gráficos já vêm prontos; no máximo o
usuário escolhe ativo, janela de tempo e média móvel.

**Outputs:** gráficos e séries temporais (MVRV, SOPR etc.), relatórios
semanais ("The Week On-chain"), alertas por e-mail nos planos pagos.

**Backtest:** não no sentido de "simule minha carteira" — mas cada
métrica é mostrada sobreposta ao histórico de preço, o que funciona como
um backtest visual informal.

**Simulação:** não. É um terminal de dados, não uma calculadora pessoal.

**Gratuito ou pago:** modelo freemium. Boa parte do essencial (MVRV,
SOPR básico) é gratuita; métricas avançadas, alertas e a API exigem
assinatura paga (Advanced/Professional, preços na casa de dezenas a
centenas de dólares/mês).

**Pontos fortes:** rigor técnico, é a referência de mercado, dados
confiáveis e auditáveis.

**Pontos fracos:** interpretação 100% subjetiva — o Glassnode nunca diz
"venda X%"; exige que o próprio usuário saiba interpretar Z-score, SOPR
etc.; complexo demais para o público leigo; não conecta a métrica à
carteira pessoal do usuário nem gera uma regra de ação.

---

## 2. LookIntoBitcoin

**Problema que resolve:** popularizar indicadores on-chain e técnicos de
ciclo em formato visual simples, gratuito, sem exigir conhecimento
técnico de blockchain.

**Como funciona:** mantido por Philip Swift, reúne indicadores como o
**Pi Cycle Top** (cruzamento da média móvel de 111 dias com 2x a média
móvel de 350 dias — historicamente acertou topos de ciclo com poucos
dias de erro), o **Bitcoin Rainbow Chart** (regressão logarítmica com
faixas coloridas de "extremamente barato" a "bolha máxima"), Puell
Multiple, NUPL, entre outros.

**Inputs:** nenhum — são gráficos prontos, atualizados diariamente.

**Outputs:** gráfico com a linha de preço e a métrica sobreposta, mais
uma explicação textual de cada indicador.

**Backtest:** implícito — o gráfico mostra o histórico completo desde
2013, então dá para "ver" como o indicador se saiu em cada ciclo passado.
Não há backtest formal com métricas de retorno.

**Simulação:** não.

**Gratuito ou pago:** 100% gratuito.

**Pontos fortes:** extremamente didático, visual, gratuito, é a porta de
entrada de praticamente todo investidor que estuda ciclos.

**Pontos fracos:** cada indicador funciona isolado — não existe uma
combinação ponderada oficial; é um indicador de **topo**, não de
"quanto vender e quando"; continua exigindo que o usuário decida sozinho
o que fazer com a informação; é uma ferramenta de mercado, não de
carteira pessoal.

---

## 3. IntoTheCryptoverse (Benjamin Cowen)

**Problema que resolve:** traduzir "onde estamos no ciclo" em um número
único de 0 a 1 (risco), para não depender de humor de mercado.

**Como funciona:** o **Risk Metric** combina preço, tempo (dias desde o
genesis block) e regressão logarítmica numa fórmula proprietária que
normaliza o "risco" do ativo entre 0 (extremamente barato) e 1
(extremamente caro/especulativo). Cowen também publica uma **calculadora
de DCA** que permite simular aportes fixos ou variáveis por faixa de
risco.

**Inputs (na ferramenta de DCA):** valor de aporte, frequência,
período, e (no recurso mais avançado) uma tabela de "quanto aportar por
faixa de risco".

**Outputs:** valor final acumulado, preço médio, comparação entre
DCA fixo x DCA por risco.

**Backtest:** sim — a ferramenta de DCA roda contra dados históricos
reais e mostra o resultado teria sido melhor ou pior que DCA linear.

**Simulação:** sim, essa é a força do produto.

**Gratuito ou pago:** assinatura paga (Into The Cryptoverse Substack /
app), com newsletter gratuita mais limitada.

**Pontos fortes:** é a ferramenta mais próxima do que o usuário quer —
transforma ciclo em número, e o número em regra de aporte. Cowen é
referência direta do público-alvo. Tem app mobile.

**Pontos fracos:** o Risk Metric é uma "caixa-preta" (fórmula não é
100% aberta); o produto é pago e trancado dentro do ecossistema dele —
não dá para reproduzir ou adaptar; foca muito mais em **entrada** (DCA
in) do que em regra de saída/realização de lucro; ainda depende da
interpretação de Cowen em vídeo para o "e agora, o que eu faço".

---

## 4. Rational Root / Bitcoin Strategy Platform

**Problema que resolve:** oferece "insight extraído da bagunça de
métricas on-chain" — ou seja, tenta ser a camada de curadoria em cima de
dados brutos tipo Glassnode.

**Como funciona:** Root é o analista principal da plataforma Bitcoin
Strategy (bitcoinstrategyplatform.com). Ficou conhecido por gráficos
próprios como o **Bitcoin Spiral Chart** e por indicadores de
long/short-term holder supply. A plataforma paga promete sinais/scores
consolidados de vários indicadores.

**Inputs:** nenhum do usuário nos gráficos gratuitos; a plataforma paga
tem mais parâmetros de configuração.

**Outputs:** gráficos autorais, newsletter, e (na assinatura) acesso a
um painel com múltiplos indicadores.

**Backtest:** parcial — mostrado via sobreposição histórica, sem métricas
formais de retorno.

**Simulação:** limitada, não é o foco.

**Gratuito ou pago:** freemium via Substack; a "Platform" completa é
paga.

**Pontos fortes:** boa comunicação, visualizações originais (Spiral
Chart) que ajudam a "sentir" o ciclo; alinhado à filosofia de ciclos e
gestão de risco do público-alvo.

**Pontos fracos:** conteúdo majoritariamente editorial/narrativo, não
uma calculadora de decisão; pago para ir além do básico; não gera regra
mecânica de rebalanceamento ou realização parcial.

---

## 5. Jelle (CryptoJelleNL)

**Problema que resolve:** popularizar análise de ciclos e padrões
históricos (ex.: o padrão de ~1064 dias entre eventos de ciclo) em
linguagem simples via X/Twitter e YouTube.

**Como funciona:** não existe uma "ferramenta Jelle" própria e formal —
é um analista/criador de conteúdo que comenta gráficos de terceiros
(muitas vezes do Bitbo, TradingView ou Glassnode) e aplica sobreposição
de ciclos passados ao ciclo atual.

**Inputs / Outputs / Backtest / Simulação:** não aplicável — não há
produto, é conteúdo editorial.

**Gratuito ou pago:** gratuito (conteúdo em rede social); eventual
newsletter/curso pago à parte.

**Pontos fortes:** alcance, didática, reforça uma visão de ciclo
consistente com Cowen e Rational Root.

**Pontos fracos:** não é uma ferramenta, é opinião recorrente; qualquer
"regra" fica na cabeça de quem assiste, sem mecanismo formal — é
exatamente o tipo de dependência de interpretação subjetiva que o
usuário quer eliminar da própria tomada de decisão.

---

## 6. Bitcoin Magazine Pro (BM Pro)

**Problema que resolve:** ser um "terminal" único que agrega dezenas de
indicadores de ciclo (Pi Cycle, Rainbow, Puell, Terminal Price, NUPL
etc.) com alertas automáticos.

**Como funciona:** dashboard com mais de 40 gráficos, cada um com sua
própria lógica (herdada em boa parte do LookIntoBitcoin/Glassnode/
Woobull), mais um "score" consolidado de múltiplos indicadores em um só
número, e alertas via TradingView/e-mail quando um indicador muda de
zona.

**Inputs:** configuração de alertas (limiares, ativos).

**Outputs:** dashboard, alertas, indicador de TradingView próprio (para
quem assina).

**Backtest:** exibido de forma visual/histórica por gráfico, não como
retorno simulado de carteira.

**Simulação:** não é o foco — é ferramenta de monitoramento, não de
planejamento pessoal.

**Gratuito ou pago:** freemium; alertas e indicadores privados exigem
assinatura.

**Pontos fortes:** cobertura ampla num único lugar, bom para quem já
sabe o que quer acompanhar.

**Pontos fracos:** volume de informação pode paralisar (excesso de
indicadores, sem hierarquia clara de qual pesa mais); ainda exige que o
usuário decida o que fazer com o alerta; nenhuma conexão com o
patrimônio pessoal do usuário.

---

## 7. Swan Bitcoin (incl. Swan Private / Swan IRA)

**Problema que resolve:** reduzir fricção na fase de acumulação (DCA
automático) e, para patrimônio maior, oferecer planejamento de
aposentadoria e herança via conta com vantagem fiscal (IRA, mercado
americano) e consultoria dedicada (Swan Private, a partir de ~US$
50.000).

**Como funciona:** corretora/custodiante que debita automaticamente um
valor recorrente e compra Bitcoin; Swan IRA usa custodiante regulado
(Equity Trust); Swan Private oferece atendimento consultivo para grandes
volumes, tesouraria e planejamento de herança.

**Inputs:** valor e frequência de aporte; para IRA, dados de conta de
aposentadoria.

**Outputs:** posição em Bitcoin custodiada, extrato de aportes,
relatórios fiscais (IRA).

**Backtest / Simulação:** oferece calculadora de DCA simples no site
institucional, mas não é o produto central.

**Gratuito ou pago:** taxas sobre o volume operado (ex.: ~0,02% a.a. na
IRA) e fee de transação na compra recorrente; Swan Private é sob
consulta.

**Pontos fortes:** é a única da lista pensando em "e depois de
acumular, o que eu faço com isso" em termos de estrutura (herança,
aposentadoria) — não só de indicador de mercado; forte em compliance e
custódia.

**Pontos fracos:** é uma corretora, não uma ferramenta de decisão —
não ajuda a decidir quando/quanto realizar lucro, só facilita comprar e
guardar; restrito ao mercado americano; Swan Private é alto ticket, fora
do alcance do público-alvo do site.

---

## 8. DCA Forge — Exit Strategy Calculator

**Problema que resolve:** é, dentre tudo pesquisado, o mais parecido em
**intenção** com o que o usuário quer construir: transformar realização
de lucro em um plano de venda escalonado, em vez de uma decisão pontual.

**Como funciona:** o usuário escolhe entre 8 planos pré-definidos (de
conservador — vendas de 5% por nível — a agressivo — vendas de 50% por
nível) atrelados a metas de preço; a ferramenta mostra em cada nível
quanto venderia, quanto sobraria em posição e o lucro acumulado.

**Inputs:** preço médio de entrada, quantidade possuída, metas de preço
de saída (ou múltiplos do preço de entrada), e o plano de escala
escolhido.

**Outputs:** tabela de níveis de venda, saldo remanescente, lucro
acumulado por nível.

**Backtest:** não — é prospectivo (o usuário define os preços-alvo
manualmente, a ferramenta não valida contra ciclos passados).

**Simulação:** sim, essa é a proposta central do produto.

**Gratuito ou pago:** gratuito.

**Pontos fortes:** já é uma "regra mecânica" de venda parcial — resolve
parte do problema de "ganância substituindo regra", porque força a
decidir os níveis com antecedência, fora do calor do momento.

**Pontos fracos:** os preços-alvo são arbitrários — o usuário ainda
escolhe "no achismo" onde vender, sem ancorar em ciclo, risco on-chain ou
tempo; não considera todo o patrimônio (só a posição em Bitcoin,
isolada); não incorpora rebalanceamento para outros ativos; interface e
marca pouco conhecidas no Brasil.

---

## 9. Shrimpy (rebalanceamento automático — descontinuado)

**Problema que resolve (resolvia):** manter uma alocação-alvo entre
Bitcoin e outros ativos cripto automaticamente, vendendo o que subiu
demais e comprando o que ficou para trás.

**Como funciona:** o usuário definia pesos-alvo (ex.: 40% BTC / 30% ETH
/ 20% SOL / 10% BNB) e um limiar de desvio; quando a alocação real
desviava além do limiar, a plataforma executava trades automáticos via
API da exchange para voltar ao alvo.

**Inputs:** pesos-alvo, limiar de rebalanceamento, exchange conectada.

**Outputs:** trades executados, histórico de rebalanceamento.

**Backtest:** sim — tinha um backtester dedicado, permitindo comparar
diferentes limiares/frequências de rebalanceamento contra dados
históricos.

**Simulação:** sim.

**Gratuito ou pago:** era pago (assinatura); descontinuado em novembro
de 2023, usuários migrados para a Bitcoin IRA.

**Pontos fortes:** provava, com backtest, que rebalanceamento
sistemático supera "buy and hold" em volatilidade de portfólio — dado
relevante para justificar a tese de rebalanceamento do usuário.

**Pontos fracos:** produto encerrado (risco de dependência de
plataforma de terceiros); focado em multi-ativos cripto (o público do
site não quer altcoins); exigia conectar chaves de API a uma exchange
— fricção e risco de custódia.

---

## 10. checkonchain / Woobull (Willy Woo)

**Problema que resolve:** modelos de valuation "objetivos" para topo e
fundo de ciclo, com metodologia aberta e documentada.

**Como funciona:** mantém modelos como **CVDD Floor** (fundo histórico
baseado em moedas antigas realocadas), **Top Cap** (limite superior
teórico), **NVT Price**, entre 200+ gráficos on-chain.

**Inputs:** nenhum do usuário.

**Outputs:** gráficos com bandas de valuation sobrepostas ao preço.

**Backtest:** visual/histórico, sem métrica de retorno.

**Simulação:** não.

**Gratuito ou pago:** majoritariamente gratuito (charts.checkonchain.com),
com conteúdo aprofundado pago via Substack (Bitcoin Vector).

**Pontos fortes:** metodologia mais transparente que a de Cowen (fórmulas
publicadas), boa reputação técnica.

**Pontos fracos:** mesmo problema de Glassnode/LookIntoBitcoin — dados
soltos, sem tradução em regra de ação nem conexão com patrimônio
pessoal.

---

## 11. Unchained Capital

**Problema que resolve:** o "depois" que quase ninguém aborda —
como garantir que o Bitcoin acumulado realmente chegue aos herdeiros,
juntando posse de chave privada e validade legal (testamento/trust).

**Como funciona:** custódia multisig colaborativa + "Inheritance
Protocol": pacote de documentos jurídicos e técnicos para herança,
cursos ("Inheritance Boot Camp") e serviço de consultoria.

**Inputs:** patrimônio em Bitcoin, estrutura familiar/jurídica desejada.

**Outputs:** vault multisig, documentação de herança, plano de
sucessão.

**Backtest / Simulação:** não aplicável — é serviço jurídico/custodial,
não ferramenta analítica.

**Gratuito ou pago:** serviço pago (custódia + consultoria jurídica).

**Pontos fortes:** único ator da lista tratando com seriedade
"preservação patrimonial" no sentido literal (herança, sucessão) —
tema completamente ausente das ferramentas de ciclo/indicador.

**Pontos fracos:** mercado americano, alto custo, não resolve o
problema declarado do usuário (quando vender/rebalancear) — resolve o
problema seguinte (o que fazer com o que sobrou/será herdado).

---

## 12. CycleTop.co e BitcoinCycle.io (agregadores)

**Problema que resolve:** poupar o trabalho de visitar Glassnode +
LookIntoBitcoin + Woobull separadamente, juntando Pi Cycle, Puell,
Rainbow, dominância etc. em um só painel.

**Como funciona:** replicam (com atribuição) os indicadores clássicos
já descritos acima; BitcoinCycle.io soma 8 "frameworks independentes"
(halving cycle, NUPL, SOPR, miner revenue etc.) num painel de
"inteligência de ciclo".

**Inputs:** nenhum.

**Outputs:** painel consolidado, às vezes com um score/veredito
textual ("ciclo em fase X").

**Backtest / Simulação:** não, mesma limitação dos indicadores de
origem.

**Gratuito ou pago:** gratuitos.

**Pontos fortes:** bom UX de "tudo num lugar só", indicam que existe
demanda de mercado por consolidação — validam a ideia de "painel único".

**Pontos fracos:** são vitrines de indicadores de terceiros, sem
personalização por patrimônio do usuário, sem regra de ação, sem
histórico de "o que eu teria feito".

---

## Tabela-resumo comparativa

| Ferramenta | Foco principal | Gera regra objetiva de ação? | Considera patrimônio pessoal? | Backtest real | Simulação de carteira | Grátis/Pago |
|---|---|---|---|---|---|---|
| Glassnode | Dados on-chain | Não | Não | Visual | Não | Freemium |
| LookIntoBitcoin | Indicadores de ciclo | Não | Não | Visual | Não | Grátis |
| ITC (Cowen) | Risco 0-1 + DCA | Parcial (DCA in) | Parcial | Sim | Sim | Pago |
| Rational Root | Curadoria/narrativa | Não | Não | Parcial | Não | Freemium |
| Jelle | Conteúdo/opinião | Não | Não | Não | Não | Grátis |
| BM Pro | Terminal de indicadores | Não | Não | Visual | Não | Freemium |
| Swan Bitcoin | Corretora + herança | Não | Sim (posição) | Não | Básico | Pago (fees) |
| DCA Forge | Plano de venda escalonado | **Sim** | Parcial (só BTC) | Não | Sim | Grátis |
| Shrimpy (encerrado) | Rebalanceamento automático | **Sim** | Sim | Sim | Sim | Pago |
| checkonchain/Woobull | Modelos de valuation | Não | Não | Visual | Não | Freemium |
| Unchained | Herança/custódia | N/A | Sim | N/A | N/A | Pago |
| CycleTop/BitcoinCycle | Agregador de indicadores | Não | Não | Visual | Não | Grátis |

---

## Análise estratégica

### 1. Qual problema ainda não está sendo resolvido pelo mercado?

Não existe uma ferramenta gratuita e simples que combine **(a)** onde o
Bitcoin está no ciclo, **(b)** o patrimônio real do usuário e **(c)** uma
regra pré-definida de realização parcial e rebalanceamento — tudo em um
único lugar, sem exigir interpretação. Todo mundo pesquisado faz uma das
duas partes (indicador de mercado *ou* calculadora de posição), nunca as
duas conectadas numa regra de saída.

### 2. O que existe hoje que é complexo demais para o investidor comum?

Glassnode, checkonchain e boa parte do BM Pro. Métricas como Z-Score,
SOPR, NVT exigem estatística básica para interpretar corretamente — o
público-alvo (não-trader, 35-45 anos, foco em preservação) não vai
calcular desvio-padrão de bolso.

### 3. O que existe hoje que depende de interpretação subjetiva?

Praticamente tudo que não é DCA Forge ou Shrimpy: Pi Cycle, Rainbow
Chart, RHODL, conteúdo de Jelle e Rational Root — todos mostram "onde
estamos", mas cabe ao usuário decidir "o que eu faço com isso". Mesmo o
Risk Metric do Cowen, que é o mais avançado da lista, converte ciclo em
número mas a ação (vender, segurar, rebalancear) ainda depende do vídeo
semanal dele.

### 4. Quais ferramentas conseguem transformar emoções em regras objetivas?

Só duas, de fato: **DCA Forge (Exit Strategy Calculator)**, que obriga
definir níveis de venda antes do calor do momento, e o **Shrimpy**
(hoje descontinuado), que automatizava o rebalanceamento sem
intervenção humana no momento do gatilho. O Risk Metric do Cowen chega
perto ao condicionar o valor do aporte ao score de risco, mas só no lado
da compra.

### 5. Quais poderiam ser reproduzidas de forma simples em um site pessoal?

- A lógica de **planos de venda escalonada** do DCA Forge (níveis de
  venda por faixa de preço/risco) é perfeitamente reproduzível em uma
  calculadora local, sem backend.
- A lógica de **rebalanceamento por desvio de alocação-alvo** do
  Shrimpy é simples de implementar client-side (comparar peso atual x
  peso-alvo e sugerir o ajuste).
- Uma versão simplificada e transparente do **Risk Metric** (não a
  fórmula exata do Cowen, mas um score próprio combinando o Comparador
  de Ciclos já existente no site + tempo desde o fundo/topo) é viável e
  coerente com o que o site já calcula.

### 6. Qual delas teria maior potencial de atrair tráfego orgânico?

Uma calculadora de **"quando e quanto vender"** (variações de "bitcoin
exit strategy calculator", "dca out calculator", "quando vender
bitcoin") — são buscas com intenção clara e pouca oferta de qualidade
em português. O Comparador de Ciclos já valida esse apetite; uma
ferramenta de saída é o complemento natural e ainda inédito no
mercado brasileiro de conteúdo sobre Bitcoin.

### 7. Qual delas teria maior potencial de conversão para assinatura premium?

Um painel que combine risco de ciclo + patrimônio do usuário +
histórico de decisões ("o que essa regra teria feito comigo desde
2017") é o tipo de produto que gera recorrência (checar mensalmente) e
justifica um nível pago com alertas, mais faixas de ativos, ou export de
relatório — no modelo do que o Cowen faz, mas mais simples e mais
transparente.

---

## Avaliação do "Gestor de Ciclo Bitcoin"

### Viabilidade

**Sim, faz sentido — e preenche exatamente o vazio identificado no item
1 da análise estratégica.** Nenhuma ferramenta pesquisada junta ciclo +
patrimônio pessoal + regra mecânica de ação no mesmo lugar, gratuita e em
português. É a extensão lógica do que o site já tem (Calculadora DCA +
Comparador de Ciclos) e resolve diretamente o problema que o autor
descreve como o próprio erro histórico.

O risco principal não é técnico, é de **posicionamento**: qualquer
ferramenta que produza uma tabela de "vender X% aqui" pode ser lida como
recomendação financeira, mesmo com aviso legal. A viabilidade depende de
a ferramenta ser desenhada, desde o início, como **simulador de regras
que o próprio usuário define e testa** — não como "o site me disse pra
vender".

### Riscos e como neutralizá-los

- **Parecer recomendação de compra/venda:** resolver deixando todo
  gatilho (nível de risco, faixa de preço, % de realização) como
  parâmetro que o usuário escolhe e pode alterar, nunca um valor fixo
  imposto pela ferramenta. O texto de cada resultado deve ser descritivo
  ("se sua regra fosse X, isto teria acontecido"), nunca imperativo
  ("venda agora").
- **Reproduzir a caixa-preta do Cowen:** em vez de inventar uma fórmula
  de risco proprietária e não transparente, construir o score a partir
  de métricas já auditáveis no site (posição no ciclo do Comparador de
  Ciclos + tempo desde fundo/topo), com a metodologia documentada
  publicamente — no mesmo espírito do README atual, que já expõe a
  metodologia do Comparador de Ciclos.
- **Sobrecarregar com indicadores demais (erro do BM Pro):** limitar a
  poucas entradas (2 a 4), com peso e lógica claros, em vez de um
  dashboard com 40 gráficos.

### Sugestões de melhoria ao escopo original

1. **Ancorar no que já existe:** usar a mesma tabela de ciclos
   congelada do Comparador de Ciclos (`assets/js/comparador-ciclos.js`)
   como base do "tempo/fase de ciclo" em vez de criar uma segunda fonte
   de verdade.
2. **Separar em módulos claros e independentes:**
   - **Regra de aporte** (já parcialmente coberta pela Calculadora DCA):
     intensificar aporte quando o ciclo está na fase "fundo/acumulação".
   - **Regra de realização parcial:** níveis de venda por faixa de
     ciclo (ex.: a cada X% acima do fundo anterior, realizar Y% da
     posição) — nos moldes do DCA Forge, mas ancorado em ciclo, não em
     preço-alvo arbitrário.
   - **Regra de rebalanceamento:** o usuário informa alocação-alvo
     Bitcoin vs. resto do patrimônio (renda fixa, ações, etc. — usando o
     Comparador de Investimentos já existente como referência de outros
     ativos) e a ferramenta mostra o desvio atual e o ajuste sugerido
     para voltar ao alvo.
3. **Modo "e se eu tivesse seguido a regra":** aplicar a regra
   retroativamente aos ciclos passados (2013, 2017, 2021) e mostrar o
   resultado — isso dá o "backtest" que falta em quase todas as
   ferramentas pesquisadas e é o principal diferencial possível.
4. **Sem previsão de topo:** a ferramenta nunca deve prometer identificar
   o topo — só reagir a onde o preço já está em relação ao histórico.
   Isso já é a filosofia correta declarada e deve ficar explícita em um
   aviso permanente na página, como já existe (implicitamente) na
   linguagem do Comparador de Ciclos.
5. **100% local, sem dado de terceiro em tempo real:** manter a mesma
   arquitetura das ferramentas atuais (JSON local + Chart.js local) —
   evita o problema de complexidade/fragilidade que aflige boa parte das
   ferramentas pagas pesquisadas (dependência de API, custo de dado em
   tempo real).

### Nome

"Gestor de Ciclo Bitcoin" comunica bem a intenção (gestão, não previsão)
mas pode soar como "gestão de patrimônio" (serviço financeiro
regulado). Vale considerar algo que deixe explícito que é uma
calculadora de regras, ex.: **"Regras de Saída"**, **"Plano de
Realização de Lucro"** ou **"Simulador de Rebalanceamento"** — nomes que
reduzem a chance de leitura como aconselhamento financeiro e reforçam o
enquadramento de "ferramenta de simulação", coerente com o restante do
site.
