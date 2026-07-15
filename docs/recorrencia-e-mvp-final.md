# Recorrência, "Ciclo Atual" e especificação final — "Quando Vender Bitcoin?"

> Continuação de `docs/produto-quando-vender-bitcoin.md` e
> `docs/perfis-de-investidor.md`. Este documento responde a uma pergunta
> anterior a qualquer linha de código: **a ferramenta, do jeito que está
> especificada, é só mais uma calculadora de SEO de uso único, ou dá pra
> transformar em algo que o usuário consulta de verdade?**

---

## 1. Auditoria de recorrência — o que hoje é uso único

Classificação de toda funcionalidade já especificada nos dois
documentos anteriores. "Uso único" não é um defeito — é o que atrai
tráfego de busca. O problema é que, hoje, **quase tudo cai nessa
categoria**.

| Funcionalidade | Classificação | Por quê |
|---|---|---|
| Onboarding (BTC atual, preço médio, escolha de perfil) | **Uso único** (revisão eventual) | Só muda se a situação de vida do usuário mudar — não há motivo pra refazer todo mês. |
| Backtest histórico contra 2013/2017/2021/2025 | **Uso único** | Depois de ver uma vez "o que essa regra teria feito", o valor educacional/de confiança já foi capturado. É a página que atrai tráfego de busca ("bitcoin exit strategy calculator"), não a que traz o usuário de volta. |
| Comparação entre os 3 perfis | **Uso único** | Exploratório — decisão já tomada depois da primeira visita. |
| Gráfico de ciclo com marcadores (histórico) | **Uso único** | Mesmo raciocínio do backtest. |
| Tabela detalhada / modo avançado | **Uso único** | Consultada uma vez para validar a regra, não checada de novo. |
| Card de compartilhamento do backtest | **Uso único**, mas gera tráfego de entrada de terceiros | Quem compartilha não volta por causa disso; quem vê o compartilhamento é quem pode virar visita nova. |
| **Modo Ciclo Atual** *(proposto abaixo)* | **Uso mensal**, picos **semanais** perto de um gatilho | É a única peça, de tudo especificado até agora, cujo conteúdo muda com o preço do dia — o resto é estático depois da primeira visita. |
| Contador "quanto falta para o próximo gatilho" | **Uso semanal** quando perto do gatilho, mensal no resto do tempo | Funciona como uma contagem regressiva — o mesmo mecanismo que faz apps de rastreamento de encomenda serem checados todo dia perto da entrega. |
| Alerta por e-mail no gatilho (premium) | **Passivo — dispara uso, não é uso em si** | É o mecanismo que converte "eu deveria checar" em "eu fui avisado". Sem isso, a recorrência depende 100% do usuário lembrar sozinho — o mesmo problema que a ferramenta existe para resolver. |
| Rebalanceamento multi-ativo (premium) | **Uso trimestral/mensal** | Ligado ao calendário financeiro pessoal do usuário (revisão de carteira), não ao ciclo do Bitcoin em si. |
| Export de relatório em PDF (premium) | **Uso anual** | Tipicamente ligado a planejamento patrimonial ou declaração — evento anual, não recorrente no sentido de engajamento. |

**Diagnóstico:** a ferramenta como estava especificada é 90% "prove uma
vez e vá embora". Isso é ótimo para SEO e péssimo para retenção. Falta
exatamente uma peça: **um estado vivo que muda com o preço e o
calendário**, que é o Modo Ciclo Atual abaixo.

---

## 2. Modo "Ciclo Atual"

Em vez de responder só "o que teria acontecido", a tela responde "onde
eu estou agora, e o que vem a seguir". Os 7 campos pedidos, definidos
com precisão suficiente para implementar:

| Campo | Definição |
|---|---|
| **Perfil escolhido** | O nome do perfil ativo (Preservação/Equilíbrio/Convicção), com um link discreto para trocar. |
| **Capital já recuperado** | `USD realizado até hoje ÷ capital investido`, em %. |
| **BTC ainda exposto** | BTC restante, e o quanto isso representa em % do patrimônio total atual (BTC restante × preço hoje ÷ patrimônio total). |
| **Próximo gatilho da estratégia** | O próximo evento que a regra do perfil executaria — pode ser de dois tipos ao mesmo tempo (preço e idade); mostrar os dois quando ambos existirem. |
| **Quanto falta para esse gatilho** | Para o gatilho de preço: `% de alta necessária até o próximo recorde-alvo`. Para o gatilho de idade: `meses restantes até o próximo marco`. |
| **Última ação simulada** | Data, preço do dia, quanto foi vendido (em % da posição original) e o motivo (recuperação de capital / piso de idade / faixa de preço). |
| **Próxima ação esperada** | Frase gerada automaticamente, nunca uma recomendação: *"Se o preço romper US$ X, sua regra realizaria mais Y% da posição."* |

### Exemplo real, com dados de hoje

Simulando os 3 perfis desde o fundo do ciclo 2022 (2022-11-21,
US$ 15.476) até a última data disponível no site (2026-07-13, BTC a
US$ 61.849 — já ~50% abaixo do topo de out/2025, que foi US$ 126.296):

| Perfil | Capital recuperado | BTC exposto | Patrimônio hoje (vs. HODL) | Última ação simulada | Próximo gatilho |
|---|---|---|---|---|---|
| **Preservação** | 486% | 8% do patrimônio | $82.094 (vs. $61.849 — **+$20.245**) | 07/10/2025 @ $124.777 — trim pós-recuperação | Preço: novo recorde acima de $124.777 (faltam 101,7% de alta) |
| **Equilíbrio** | 153% | 65% do patrimônio | $67.016 (vs. $61.849 — **+$5.167**) | 23/05/2025 @ $111.722 — piso de idade | Preço: novo recorde acima de $124.777 (faltam 101,7% de alta) |
| **Convicção** | 58% (ainda não recuperou 100%) | 86% do patrimônio | $64.705 (vs. $61.849 — **+$2.856**) | 21/11/2025 @ $86.467 — piso de idade | Preço: novo recorde acima de $124.777 (faltam 101,7% de alta) |

### O buraco que este exemplo real expôs

Rodando os 3 perfis até hoje, os três chegaram à mesma resposta em
"próximo gatilho por idade": **nenhum piso adicional programado** — os
calendários de idade que desenhamos em `perfis-de-investidor.md` param
em 30–36 meses, e já estamos aos 43,7 meses do fundo de 2022. Isso quer
dizer que, num bear market prolongado como o atual, a régua de idade
simplesmente **acaba** — e a tela de Ciclo Atual, que deveria ser o
motivo de o usuário voltar, ficaria sem nenhum próximo gatilho para
mostrar, exatamente no momento (bear market longo) em que a
tranquilidade mais importa.

**Correção necessária antes do MVP:** o piso de idade não pode ser uma
tabela finita — precisa ser uma **regra recorrente** ("a cada 12 meses
adicionais além do último marco, mais X%"), para que "próximo gatilho"
nunca fique vazio. Sem isso, o produto perde justamente a função que
motivou este documento.

---

## 3. O número compartilhável

Fear & Greed, o Risk Metric do Cowen e o MVRV têm uma coisa em comum:
são **números de mercado** — o mesmo valor para todo mundo, todo dia,
fácil de virar manchete ("hoje o Fear & Greed está em 82"). Essa
ferramenta não deveria tentar competir nesse terreno, por dois motivos:
replicaria a lógica de indicador de mercado que o produto explicitamente
rejeita, e um número de mercado não tem nada a ver com preservação
patrimonial pessoal — que é o eixo real do produto.

**A métrica certa é pessoal, não de mercado:** *"X% do capital
investido já recuperado."* Ela funciona porque:

- É simples de entender sem contexto (diferente de "MVRV Z-Score = 3,2").
- Não depende de prever nada — é um fato sobre o passado do próprio
  usuário, não uma leitura de sentimento do mercado.
- Carrega a mensagem central do produto embutida: acima de 100%, a
  frase natural é *"o resto já é dinheiro da casa"* — a tradução exata
  de "eu já tirei algo da mesa".
- Ninguém mais consegue publicar essa métrica, porque ela depende do
  preço médio e da regra do próprio usuário — ao contrário de um índice
  de mercado, que qualquer concorrente replica.

**Métrica de apoio, no mesmo card:** *"Y% do patrimônio ainda exposto
ao ciclo"* — o contraponto de risco, para o card não parecer só uma
comemoração.

**Rejeitado por design:** um "índice de preservação patrimonial" único,
combinando várias métricas numa fórmula própria. Seria recriar a
caixa-preta do Cowen que o produto nasceu para evitar — as duas métricas
acima já bastam, mostradas lado a lado, sem escondidinho.

**Formato de compartilhamento:** card de imagem com as 2 métricas +
nome do perfil + idade do ciclo, sem precisar de conta — o mesmo padrão
já proposto no documento anterior, agora com o número certo dentro dele.

---

## 4. Transformar em hábito (sem virar um app de trading)

O maior risco aqui é o oposto do problema original: transformar uma
ferramenta de preservação patrimonial em algo que o usuário checa todo
dia por ansiedade — recriando, com roupagem diferente, o mesmo vício de
tela que already levou o público a não vender parcialmente por
ganância/medo. Por isso a proposta é deliberadamente pobre em gatilhos
de curto prazo:

- **Mensal (padrão, para todo mundo):** um resumo automático (e-mail
  opcional, grátis) com as 2 métricas do card e "nada mudou" quando de
  fato nada mudou — o objetivo é lembrar que a regra existe, não gerar
  ansiedade de checagem.
- **Semanal: não deveria existir como cadência fixa.** Bitcoin não se
  move o suficiente em bases semanais para justificar esse ritmo dentro
  da filosofia "não sou trader" do público. Onde uma cadência mais
  curta faz sentido é **orientada a evento**, não a calendário (ver
  abaixo).
- **Após novos ATHs (evento, não calendário):** é o gatilho mais forte
  do produto — um novo recorde histórico é precisamente o momento em
  que a ganância historicamente venceu a regra. Um alerta pontual
  ("novo recorde — sua regra indicaria isto: [frase descritiva]") é o
  evento de maior potencial de mudar comportamento real.
- **Durante bear markets (evento, não calendário):** o papel do produto
  se inverte — não é mais sobre realizar lucro, é sobre lembrar o
  usuário do que ele já protegeu. Um check-in mensal (não mais
  frequente que isso) mostrando "você já recuperou X% e ainda está Y%
  acima do que estaria em HODL puro" é o antídoto direto ao pânico —
  a mesma métrica do §3, reaproveitada como conteúdo de retenção.

---

## 5. Critério final: o que serve à missão vs. o que é só interessante

Frase-critério: *"Essa funcionalidade aumenta a capacidade real do
usuário de tirar algo da mesa antes da próxima queda de 70%, ou só é
interessante?"*

### Essencial (sem isso, a ferramenta não cumpre a missão)

- **Escolha de perfil com regra explícita** — sem isso não há
  execução possível, só teoria.
- **Modo Ciclo Atual com próximo gatilho sempre visível** — é o que
  transforma "eu deveria vender parcialmente" em "a regra me avisa
  quando". Sem isso, o produto tem o mesmo ponto cego que causou o erro
  original: depender da memória e da disciplina do usuário.
- **Alerta no momento do gatilho (mesmo que só e-mail simples)** — é a
  diferença entre um simulador e uma ferramenta que muda o
  comportamento de quem usa. Sem alerta, "modo ciclo atual" ainda
  depende de o usuário lembrar de visitar o site.
- **Comparação com HODL, sempre lado a lado** — sem isso o usuário não
  tem como confiar que a regra vale a pena seguir quando a ganância
  aparecer de novo (o gatilho psicológico do erro original).
- **O número pessoal do §3** — reforça a adesão à regra no momento em
  que ela é mais difícil de seguir (perto de um novo ATH, quando tudo
  em volta grita para não vender).

### Interessante, mas não essencial (pode faltar sem comprometer a missão)

- Backtest histórico completo contra os 4 ciclos — essencial para
  **confiança e tráfego**, não para a execução do usuário que já decidiu
  seguir uma regra.
- Card de compartilhamento em imagem — serve a aquisição de novos
  usuários, não à execução de quem já usa.
- Comparação simultânea entre os 3 perfis — útil na decisão inicial,
  irrelevante depois que o perfil já foi escolhido.
- Multi-ativo / rebalanceamento patrimonial total, export em PDF — bons
  recursos de aprofundamento, fora do caminho crítico da missão original
  (que é especificamente sobre a posição em Bitcoin).

---

## 6. Proposta final — a versão mais simples que cumpre os 5 objetivos

| Objetivo | Como esta versão cumpre |
|---|---|
| Gerar tráfego SEO | Página de backtest histórico (4 ciclos, 3 perfis) continua existindo como está especificada — é a porta de entrada. |
| Potencial de compartilhamento | Card de imagem com as 2 métricas do §3, gerado a partir do Modo Ciclo Atual — pessoal, não genérico. |
| Gerar recorrência real | Modo Ciclo Atual como tela central pós-onboarding + alerta por e-mail no gatilho (mensal como cadência padrão, evento-orientado nos momentos que importam). |
| Permitir premium futuro | O alerta granular, a comparação entre perfis e o multi-ativo continuam sendo os recursos pagos naturais — nada disso precisa existir no dia 1. |
| Preservação patrimonial como eixo | Nenhum gatilho de uso diário/semanal artificial; a cadência é deliberadamente mais lenta que a de um app de trading, coerente com "não sou trader". |

**Escopo mínimo revisado (ainda 1 semana, reaproveitando as mesmas
primitivas dos documentos anteriores):**

1. Onboarding (BTC atual/preço médio + escolha de perfil) — como já
   especificado.
2. **Tela "Ciclo Atual" como destino padrão após o onboarding** (não o
   backtest) — os 7 campos do §2, com a régua de idade corrigida para
   ser recorrente (nunca ficar sem próximo gatilho).
3. Card de compartilhamento com capital recuperado (%) + exposição
   residual (%) — gerado direto da tela de Ciclo Atual.
4. Captura de e-mail opcional (grátis) para um alerta simples quando o
   próximo gatilho do perfil disparar — é a única peça do MVP que exige
   algo além de client-side puro (precisa de um processo, ex.: GitHub
   Action semanal que compara o preço do dia contra o gatilho salvo por
   e-mail, no mesmo espírito dos robôs de atualização de dados que o
   site já usa) — vale registrar como decisão de arquitetura a validar
   antes de começar a construir.
5. Backtest histórico (4 ciclos, 3 perfis) como página secundária,
   linkada a partir do Ciclo Atual ("veja como esse perfil se saiu nos
   ciclos passados") — mantém a função de SEO/confiança sem ser a tela
   principal.

Isso não aumenta o escopo do MVP anterior — **redireciona** o centro de
gravidade da tela de backtest (que continua existindo, mas vira
secundária) para a tela de Ciclo Atual (que passa a ser a primeira
coisa que o usuário vê depois de configurar o perfil, e o motivo real de
voltar).
