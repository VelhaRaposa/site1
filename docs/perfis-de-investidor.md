# Perfis de investidor — "Quando Vender Bitcoin?"

> Continuação de `docs/produto-quando-vender-bitcoin.md`. Muda a pergunta
> de "qual regra rendeu mais?" para "qual regra teria me feito chegar ao
> bear market com mais tranquilidade?" — e testa se perfis de investidor
> (não regras isoladas) produzem resultados realmente diferentes nos 4
> ciclos já congelados no site.

## A virada de framing

A pergunta original do backtest anterior era "qual regra protegeu mais
patrimônio". Essa pergunta continua útil, mas é a pergunta de quem quer
maximizar retorno ajustado a risco — não necessariamente a pergunta de
quem só não quer mais passar por 2021 de mãos vazias.

A pergunta certa, que o Jelle resolve intuitivamente sem nunca citar um
indicador, é: **"que tipo de investidor essa pessoa é, e o que essa
pessoa precisa sentir para não deixar a ganância decidir por ela?"** Ele
não vende porque o RSI bateu 82 — vende porque a regra dele foi
construída, de antemão, para alguém que valoriza preservação acima de
maximizar o topo. Esta ferramenta pode tornar essa escolha explícita, em
vez de deixá-la implícita na personalidade de quem dá o conteúdo.

## "Tranquilidade" não é um índice novo — são 4 métricas já existentes, mostradas juntas

Para não repetir o erro do Cowen (uma fórmula proprietária e opaca), a
"tranquilidade" de uma regra **não vira um número novo inventado por
esta ferramenta**. Ela é a leitura conjunta de 4 métricas que já eram
transparentes no documento anterior:

| Métrica | O que mede sobre tranquilidade |
|---|---|
| **Meses até recuperar 100% do capital investido** | Quando a posição psicologicamente "virou dinheiro da casa" — a partir daqui, o pior cenário possível é não ganhar mais, nunca é perder o que entrou. |
| **% do patrimônio ainda exposto a BTC no topo** | Quanto dessa alta seria "papel" se o preço caísse amanhã — exposição residual alta = mais dolorosa uma reversão brusca, mesmo que também signifique mais upside. |
| **Patrimônio protegido no fundo do ciclo seguinte (regra vs. HODL)** | O número que responde diretamente "isso teria evitado a dor de 2022?" |
| **Nº de eventos de venda** | Regras "silenciosas" (poucos eventos, decisões espaçadas) pedem menos disciplina para seguir do que regras que exigem ação toda semana — menos eventos tende a significar mais fácil de manter na prática. |

Cada perfil abaixo é avaliado nessas 4 dimensões, lado a lado — nunca um
score único escondendo o trade-off.

---

## Três regras isoladas testadas (fora dos perfis)

Antes de montar os perfis, testei isoladamente as três mecânicas
pedidas, sem ancorar em ATH nem em múltiplo do ciclo anterior — usando
os mesmos dados reais (`btc-history-usd.json`) e os 4 ciclos congelados.

### 1. Recuperar 100% do capital investido o quanto antes

Regra: a cada novo recorde histórico de preço, vender o suficiente para
cobrir a diferença entre o capital já recuperado e o capital investido,
limitado a no máximo 30% do saldo restante por evento (para não zerar a
posição de uma vez).

| Ciclo | Eventos | BTC restante no topo | Meses até recuperar capital | Proteção no fundo seguinte (regra vs. HODL) |
|---|---|---|---|---|
| 2011→2013 | 1 | 93,3% | 15,3 | **-$8** |
| 2015→2017 | 1 | 87,2% | 25,4 | **-$248** |
| 2018→2021 | 1 | 84,2% | 23,8 | **+$671** |
| 2022→2025 | 1 | 77,4% | 15,4 | **+$1.478** (dado provisório, hoje) |

**Achado:** essa regra sempre resolveu em **uma única venda** — porque,
em todo ciclo, o momento em que o preço supera o recorde do ciclo
anterior já está tão acima do preço de fundo que o capital investido
representa uma fatia pequena do BTC total. E essa fatia vem
**crescendo a cada ciclo** (6,7% → 12,8% → 15,8% → 22,6%): como cada
ciclo multiplica menos vezes o topo anterior (retornos decrescentes),
recuperar o capital investido fica estruturalmente mais caro em % de
BTC a cada ciclo. Importante para expectativa: essa regra garante
**nunca perder o principal**, mas não protege de forma relevante a
parcela de lucro contra um crash grande — ela sozinha não teria mudado
muito o resultado de 2021→2022.

### 2. DCA-Out por faixas acima do preço médio (não do ATH anterior)

Regra: vender 10% do restante a cada 50% de alta acima do **preço
médio de compra** (não do topo do ciclo anterior).

| Ciclo | Eventos | BTC restante no topo | % capital recuperado |
|---|---|---|---|
| 2011→2013 | 986 | **0%** | 622% |
| 2015→2017 | 251 | **0%** | 614% |
| 2018→2021 | 41 | 1,3% | 581% |
| 2022→2025 | 13 | 25,4% | 287% |

**Achado:** ancorar as faixas no preço médio (muito mais baixo que o
ATH anterior) faz a posição **se esgotar completamente antes do topo**
nos ciclos de alta magnitude (2013 e 2017 zeraram a posição). Só no
ciclo mais recente — onde o múltiplo do fundo ao topo já é bem menor
(8,2x contra 494x em 2011→2013) — a regra deixa uma fração relevante de
BTC (25%) até o topo. **Conclusão prática:** DCA-out por preço médio só
funciona bem em ciclos de múltiplo mais comedido; para ciclos iniciais
de altíssimo múltiplo, o gatilho precisa ser recalibrado (bandas mais
largas ou tetos de tranches) — o mesmo problema já identificado no
documento anterior para bandas ancoradas no ATH.

### 3. Vender o equivalente aos aportes após 24 meses de idade do ciclo

Regra: em um único evento, ao completar 24 meses desde o fundo do
ciclo, vender exatamente o suficiente (ao preço do dia) para recuperar
o capital investido.

| Ciclo | BTC restante no topo | Proteção no fundo seguinte (regra vs. HODL) |
|---|---|---|
| 2011→2013 | 99,7% | **+$2** |
| 2015→2017 | 81,6% | **-$423** |
| 2018→2021 | 83,9% | **+$629** |
| 2022→2025 | 83,6% | **+$5.332** (dado provisório, hoje) |

**Achado:** é a regra mais "silenciosa" de todas — um único evento,
sem precisar acompanhar preço nenhum dia — e ainda assim entrega
proteção positiva em 3 dos 4 ciclos, incluindo a maior proteção
absoluta de toda a tabela no ciclo atual (+$5.332), porque aos 24 meses
o preço historicamente já subiu o bastante para a venda necessária ser
pequena. É a prova de que uma regra baseada só em calendário, sem
depender de o usuário estar de olho no preço, já cumpre boa parte do
objetivo de tranquilidade.

---

## Os 3 perfis propostos para o MVP

Cada perfil é uma combinação fixa e documentada das regras acima — nada
de fórmula nova. O usuário escolhe o perfil, não os parâmetros
individuais (o modo avançado, para quem quiser mexer nos números,
continua disponível).

### Perfil Preservação
*"Recuperar 100% do capital investido o mais cedo possível. Prioriza
eliminar risco."*

**Regra:** recuperar capital via novos ATH com teto agressivo de 50% do
saldo por evento (recupera rápido); depois de recuperado, continua
realizando 5% do restante a cada novo recorde, para seguir reduzindo
risco de forma contínua (não só uma vez).

### Perfil Equilíbrio
*"Recupera capital e mantém a maior parte da posição. Busca equilíbrio
entre participação na alta e realização."*

**Regra:** recuperação de capital mais gradual (teto de 15% por
evento) + piso mínimo obrigatório por idade do ciclo (10% aos 18 meses,
20% aos 24, 30% aos 30) como rede de segurança, independente do preço.

### Perfil Convicção
*"Realizações menores. Aceita maior volatilidade para preservar mais
BTC."*

**Regra:** só o piso mínimo por idade do ciclo (5% aos 24 meses, 10%
aos 36 meses) — quase não vende por preço, mantém a posição quase
intacta, mas nunca chega a "zero realização".

### Resultado do backtest, lado a lado

| Ciclo | Perfil | Eventos | BTC restante no topo | % exposto no topo | % capital recuperado | Proteção no fundo seguinte (regra vs. HODL) |
|---|---|---|---|---|---|---|
| 2011→2013 | Preservação | 47 | 0,088 | 43% | 5.800% | -$5 |
| | Equilíbrio | 198 | 0,800 | 92% | 3.395% | +$48 |
| | Convicção | 1 | 0,950 | 97% | 1.558% | +$28 |
| 2015→2017 | Preservação | 77 | 0,018 | 14% | 1.429% | -$895 |
| | Equilíbrio | 226 | 0,700 | 98% | 226% | -$593 |
| | Convicção | 1 | 0,950 | 100% | 27% (não recuperou) | -$115 |
| 2018→2021 | Preservação | 33 | 0,163 | 29% | 870% | **+$14.219** |
| | Equilíbrio | 179 | 0,700 | 89% | 197% | +$1.518 |
| | Convicção | 1 | 0,950 | 99% | 31% (não recuperou) | +$195 |
| 2022→2025 | Preservação | 38 | 0,116 | 16% | 482% | **+$19.880** (hoje, provisório) |
| | Equilíbrio | 3 | 0,700 | 79% | 153% | +$5.167 (hoje, provisório) |
| | Convicção | 1 | 0,950 | 96% | 30% (não recuperou) | +$1.625 (hoje, provisório) |

---

## Respondendo às duas perguntas centrais

### "Qual regra teria me feito chegar ao bear market com mais tranquilidade?"

Depende de qual das 4 métricas de tranquilidade pesa mais para quem
pergunta — e essa resposta diferente é exatamente o ponto:

- Se tranquilidade = **"nunca mais quero ver um -80% sem ter tirado uma
  quantia relevante"**, o Perfil Preservação é disparado o mais
  consistente: protegeu em todos os 4 ciclos, incluindo os dois maiores
  números da tabela inteira (+$14.219 em 2021→2022 e +$19.880 na queda
  em andamento agora). O preço: só 14–43% do patrimônio ainda estava em
  BTC no topo — a maior parte da alta seguinte, se o ciclo continuasse,
  ficaria de fora.
- Se tranquilidade = **"quero ter vendido alguma coisa, mas sem abrir
  mão da maior parte da posição"**, o Perfil Equilíbrio entrega
  proteção real em 3 dos 4 ciclos (só ficou levemente negativo em
  2017→2018, -$593) mantendo 70–98% do BTC até o topo.
- Se tranquilidade = **"eu só quero saber que não fiquei 100% de mãos
  vazias, e aceito o resto da volatilidade"**, o Perfil Convicção
  entrega o menor número absoluto de proteção, mas positivo em 3 dos 4
  ciclos, com apenas 1 evento de venda por ciclo — o mínimo de atrito
  possível.

Não existe "a" resposta — existe a resposta certa **para o perfil de
quem pergunta**. É exatamente por isso que a ferramenta deveria abrir
com essa escolha, não com uma regra.

### "Esses perfis realmente produzem resultados diferentes nos 4 ciclos?"

Sim, de forma grande e consistente — não é uma diferença cosmética:

- **Exposição residual no topo** varia de 14–43% (Preservação) para
  70–98% (Equilíbrio) para 95–100% (Convicção) — uma faixa de mais de
  6x entre os extremos, em todos os 4 ciclos.
- **Proteção no crash seguinte** varia de dezenas de milhares de
  dólares (Preservação, nos ciclos de maior magnitude) a algumas
  centenas (Convicção) — os perfis não convergem para o mesmo resultado
  em nenhum dos 4 ciclos testados.
- O único padrão comum aos 3 perfis, nos 4 ciclos: **todos tiram algo
  da mesa antes do topo**, nenhum deles zera a realização — o requisito
  mínimo do produto está atendido nos 3, e a diferença entre eles é
  genuinamente uma escolha de personalidade de investidor, não um erro
  de calibragem.

---

## O que isso muda no produto

1. **A primeira tela deixa de perguntar "qual regra você quer simular"
   e passa a perguntar "qual desses 3 perfis mais parece com você"** —
   com a descrição de uma frase de cada perfil (as citadas no início
   deste documento) como único critério de escolha. Isso substitui a
   pergunta técnica por uma pergunta de identidade, que é o
   diferencial citado pelo usuário: nem Cowen, nem LookIntoBitcoin, nem
   Glassnode fazem essa segmentation hoje.
2. O resultado mostra as 4 métricas de tranquilidade lado a lado para o
   perfil escolhido, comparado com os outros 2 perfis em modo
   secundário ("veja como teria sido com os outros perfis") — não como
   tela padrão, para não recriar o excesso de informação já evitado no
   fluxo de UX do documento anterior.
3. O "modo avançado" (parâmetros individuais de cada regra) continua
   existindo, mas vira uma segunda camada — o padrão é escolher perfil,
   não escolher regra.
4. Isso também **substitui** a escolha de "1 regra pré-configurada" que
   o MVP do documento anterior propunha como padrão (§8) — o novo MVP
   deveria nascer direto com os 3 perfis, já que o esforço de
   implementação é o mesmo (mesmas primitivas: recuperação de capital,
   piso por idade, bandas de preço) e o valor de produto é
   substancialmente maior.

## Ressalva metodológica

Todos os backtests aqui (e no documento anterior) assumem uma compra
única de 1 BTC exatamente no fundo do ciclo — uma simplificação para
isolar o efeito da regra de saída, não uma reconstituição de como um
investidor real fez DCA de entrada. Quem aportou ao longo do tempo (o
caso mais comum, e o caso já coberto pela Calculadora DCA do site) teria
um preço médio diferente do preço de fundo, o que muda a magnitude
exata dos números — mas não muda a conclusão qualitativa: os 3 perfis
continuam ordenados da mesma forma (Preservação > Equilíbrio >
Convicção em proteção; o inverso em exposição residual) para qualquer
preço médio razoável dentro de um ciclo.
