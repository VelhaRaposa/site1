# Site do Caio Garé — guia rápido

## Como o site é organizado

- Cada página vive numa pasta com `index.html` dentro (ex: `agenda/index.html`), exceto a Home (`index.html` na raiz) — isso gera URLs limpas como `/agenda/`, sem `.html`.
- `assets/js/content.js` → **único arquivo que você mexe no dia a dia**: parceiros, cursos, ticker. (Vídeos recentes da Home/Agenda são atualizados sozinhos por `scripts/update_videos.py`, um robô que roda uma vez por dia — ver seção 2.1. O horário fixo das lives em `agenda/index.html` é só texto direto no HTML, editado à mão.)
- `assets/js/analytics.js` → onde você cola seu ID do Google Analytics.
- `assets/css/style.css` → cores e estilo visual (só mexer se quiser mudar o design).

## 1. Publicar o site de graça (GitHub Pages)

1. Crie uma conta em [github.com](https://github.com) (gratuito).
2. Crie um repositório novo, público, com o nome `caiogare-site` (pode ser outro nome).
3. Envie todos os arquivos desta pasta para esse repositório (dá pra arrastar e soltar os arquivos direto pelo site do GitHub, em "Add file → Upload files").
4. No repositório, vá em **Settings → Pages**.
5. Em "Branch", selecione `main` e clique em **Save**.
6. Em "Custom domain", digite `caiogare.com.br` e salve — o GitHub cria automaticamente o arquivo `CNAME` (já incluí um pronto nesta pasta também).
7. No painel onde você comprou o domínio (registro.br ou outro), configure o DNS apontando para o GitHub Pages:
   - Um registro CNAME: `www` → `SEUUSUARIO.github.io`
   - Registros A no domínio raiz (`caiogare.com.br` sem www) apontando para:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
8. Aguarde algumas horas para o DNS propagar. O GitHub emite HTTPS automaticamente.

## 2. Editar conteúdo (parceiros, cursos, ticker)

Abra `assets/js/content.js` em qualquer editor de texto simples (ou direto no GitHub, clicando no lápis ✎ do arquivo).
Troque os textos entre aspas. Para adicionar um item novo, copie um bloco `{ ... }` inteiro e cole abaixo do último, editando os textos.
Salve (Commit changes) — o site atualiza sozinho em 1–2 minutos.

### 2.1. Vídeos recentes (Home e Agenda) — automático

Os cards de "vídeos recentes" da Home e da Agenda são atualizados uma vez por dia por um robô (`scripts/update_videos.py`, disparado por `.github/workflows/update-videos.yml`), do mesmo jeito que o histórico de preço do Bitcoin já é. Ele busca os últimos vídeos do canal (ID em `SITE.youtubeChannelId`, em `content.js`) e escreve os cards direto em `index.html`/`agenda/index.html`. Não precisa fazer nada — só troque `youtubeChannelId` se um dia mudar de canal. Pra forçar uma atualização na hora, use a aba **Actions → Atualizar vídeos recentes (Home e Agenda) → Run workflow**.

## 3. Ativar o formulário de contato (Formspree — gratuito)

1. Crie conta em [formspree.io](https://formspree.io)
2. Crie um novo formulário, copie o ID gerado (algo como `xzznabcd`)
3. Abra `contato.html` e troque `SEU_ID_AQUI` pelo ID copiado, na linha:
   `<form action="https://formspree.io/f/SEU_ID_AQUI" method="POST">`

## 4. Ativar relatório de cliques de parceiros (Google Analytics — gratuito)

1. Crie conta em [analytics.google.com](https://analytics.google.com)
2. Crie uma propriedade para `caiogare.com.br`
3. Copie o ID que começa com `G-`
4. Abra `assets/js/analytics.js` e cole no lugar de `G-XXXXXXXXXX`
5. Depois de publicado, os cliques em parceiros aparecem no GA4 em
   **Relatórios → Engajamento → Eventos → click_parceiro**

## 5. Trocar a foto de perfil

Coloque sua foto dentro de `assets/img/` (ex: `assets/img/perfil.jpg`) e substitua o texto
placeholder `<div class="hero-photo">` no `index.html` por:
```html
<img src="assets/img/perfil.jpg" alt="Caio Garé" style="width:100%;height:100%;object-fit:cover;">
```
dentro da `div class="hero-photo"`.

## 6. Calculadora DCA — dados 100% locais

A partir desta versão, a Ferramenta DCA não depende de nenhuma API externa.
Os preços históricos do Bitcoin (em reais) ficam em `assets/data/btc-history.json`,
um arquivo local que o navegador lê diretamente — sem chamadas de rede.

**Isso significa duas coisas importantes:**

1. A calculadora nunca mais vai quebrar por causa de bloqueador de anúncio,
   chave de API vencida, ou mudança de política de terceiros.
2. Os dados têm uma "data final" fixa (a mais recente no arquivo). Para
   estender esse período no futuro, é preciso atualizar o arquivo — meça
   isso a cada poucos meses, pedindo pra eu gerar uma versão mais recente,
   ou seguindo o formato de uma linha por dia:
   `{"date": "AAAA-MM-DD", "price": 000000.00}`

O gráfico é feito com Chart.js, que também está salvo localmente em
`assets/js/vendor/chart.umd.min.js` — não carrega de nenhum CDN.

## 7. Atualização automática dos dados (GitHub Actions)

Incluído nesta versão: um robô gratuito do GitHub (`.github/workflows/update-btc-history.yml`)
que roda sozinho **toda segunda-feira** e adiciona os dias que faltam em
`btc-history.json`. A calculadora continua 100% local — esse robô roda
nos servidores do GitHub, nunca no navegador de quem visita o site.

**Para ativar, duas coisas (uma vez só):**

1. **Permissão de escrita para o robô:**
   Vá em `Settings → Actions → General`, desça até "Workflow permissions",
   selecione **"Read and write permissions"** e salve.

2. **(Opcional, mas recomendado) Cole sua chave da CoinGecko como Secret:**
   Vá em `Settings → Secrets and variables → Actions → New repository secret`.
   Nome: `COINGECKO_API_KEY`. Valor: a chave que você já criou em coingecko.com.
   Isso deixa a busca de dados mais estável — sem isso, ainda funciona,
   só que com limites mais apertados de uso.

Pronto — a partir daí, o arquivo se atualiza sozinho toda semana. Se quiser
forçar uma atualização na hora, vá na aba **Actions** do repositório,
clique em "Atualizar histórico do Bitcoin" → **"Run workflow"**.

## 8. Comparador de Investimentos — Bitcoin, CDI, Ibovespa, S&P 500 e Ouro

A ferramenta em `/comparador/` responde "onde seu dinheiro teria rendido
mais?", comparando o mesmo valor investido, no mesmo período, nos cinco
ativos. Segue o mesmo princípio 100% local da Calculadora DCA: os dados
ficam em cinco arquivos dentro de `assets/data/`:

- `btc-history.json` — já existia, reaproveitado sem mudança.
- `cdi-history.json` — índice acumulado do CDI (Banco Central).
- `ibovespa-history.json` — fechamento diário do Ibovespa.
- `sp500-history.json` — S&P 500, já convertido para reais.
- `gold-history.json` — ouro, já convertido para reais por grama.
- `usdbrl-history.json` — cotação do dólar (Banco Central). Este é
  auxiliar: só é usado internamente pelos scripts do S&P 500 e do
  Ouro para converter de dólar para real — a calculadora no navegador
  nunca lê esse arquivo.

**IMPORTANTE — ativação na primeira vez:** diferente do Bitcoin, esses
cinco arquivos começam vazios neste repositório. Depois de publicar o
site, vá em **Actions → "Atualizar dados de mercado (comparador)" →
Run workflow** uma vez, manualmente. Os scripts detectam que os
arquivos estão vazios e buscam o histórico completo desde 2015
automaticamente (isso pode levar alguns minutos, dependendo da
quantidade de dias). Depois dessa primeira vez, o robô diário
(`.github/workflows/update-market-history.yml`, todo dia às 09:20 UTC)
cuida sozinho de manter tudo atualizado, buscando só os dias novos —
mesmo modelo de "Permissão de escrita para o robô" descrito na seção 7
acima, que também precisa estar ativa para este workflow.

**Fontes de dado usadas por cada script** (todos em `scripts/`):

| Ativo | Script | Fonte |
|---|---|---|
| Câmbio USD/BRL (auxiliar) | `update_usdbrl_history.py` | Banco Central — SGS, série 1 (oficial) |
| CDI | `update_cdi_history.py` | Banco Central — SGS, série 12 (oficial) |
| Ibovespa | `update_ibovespa_history.py` | Yahoo Finance (não-oficial), ticker `^BVSP` |
| S&P 500 | `update_sp500_history.py` | Yahoo Finance (não-oficial), ticker `^SP500TR`, com fallback para `^GSPC` |
| Ouro | `update_gold_history.py` | Yahoo Finance (não-oficial), ticker `GC=F` |

As duas fontes do Banco Central são oficiais e de baixo risco de
manutenção. As três via Yahoo Finance usam uma API não documentada
(mesma categoria de risco já aceita para o Bitcoin via CoinGecko) — se
algum desses três scripts começar a falhar no log do Actions, é o
primeiro lugar a checar. Esses scripts substituíram um plano inicial
de usar B3 (Ibovespa) e LBMA (Ouro) diretamente: não foi possível
confirmar os endpoints exatos dessas duas fontes durante o
desenvolvimento, então optou-se por um único mecanismo (Yahoo Finance)
reaproveitado três vezes, mais simples de manter do que três
integrações diferentes.

## 9. Comparador de Ciclos — metodologia congelada (não editar sem revisão)

A ferramenta em `/comparador-ciclos/` usa exclusivamente preço (nunca
halving) para definir ciclos do Bitcoin, com datas e preços de topo e
fundo **congelados manualmente** em `assets/js/comparador-ciclos.js`
(array `CICLOS`) — sem detecção automática nesta versão.

**Critério de congelamento (decisão editorial, revisão de PR2):**
prioriza consenso de mercado (o número mais citado pela imprensa
financeira e por ferramentas de análise de ciclo) acima da precisão
histórica de um índice único. Por isso os valores abaixo **não vêm**
de `assets/data/btc-history-usd.json` (que é usado só para desenhar a
trajetória do preço *entre* um marco e outro) — os extremos de cada
linha são sempre o valor desta tabela, não o valor bruto do dataset
naquele dia.

**Ciclo de Alta** (fundo → topo, mesmo ciclo):

| Ciclo | Fundo | Topo | Fonte |
|---|---|---|---|
| 2011 | 2011-11-22 — US$ 2,30 | 2013-12-05 — US$ 1.137,00 | Mt. Gox / Bitstamp (dado de 2011 é o mais fraco de toda a tabela — mercado muito ilíquido na época, sem consenso de dia exato) |
| 2015 | 2015-01-14 — US$ 152,00 | 2017-12-17 — US$ 19.783,00 | Bitstamp (mínima intradiária); CoinDesk BPI |
| 2018 | 2018-12-07 — US$ 3.122,00 | 2021-11-10 — US$ 68.789,00 | Figura mais repetida no mercado ("$3.122") — a data 07/12 é onde ela realmente ocorreu (CoinDesk), não 15/12 como muitas retrospectivas citam de forma solta; CoinMarketCap |
| 2022 | 2022-11-21 — US$ 15.476,00 | 2025-10-06 — US$ 126.296,00 | Consenso geral (mesma âncora que o CycleTop usa); Coinbase |
| Atual | 2026-07-01 — US$ 58.534,28 (provisório) | ainda sem topo confirmado | blockchain.info — este ponto **não** foi congelado (ciclo em andamento, sem consenso de mercado ainda formado) |

**Ciclo de Baixa** (topo de um ciclo → fundo do ciclo seguinte):

| Ciclo | Topo | Fundo | Fonte |
|---|---|---|---|
| 2013→2015 | 2013-12-05 — US$ 1.137,00 | 2015-01-14 — US$ 152,00 | ver linhas acima |
| 2017→2018 | 2017-12-17 — US$ 19.783,00 | 2018-12-07 — US$ 3.122,00 | ver linhas acima |
| 2021→2022 | 2021-11-10 — US$ 68.789,00 | 2022-11-21 — US$ 15.476,00 | ver linhas acima |
| 2025→atual | 2025-10-06 — US$ 126.296,00 | 2026-07-01 — US$ 58.534,28 (provisório) | ver linhas acima |

Não existe uma entrada de Ciclo de Baixa isolada para 2011 (topo de
jun/2011 → fundo de nov/2011) — essa mini-bolha nunca foi implementada
como uma entidade própria no array `CICLOS`; ela só existe hoje como o
ponto de partida (fundo) da grande alta 2011→2013. Ficou como limitação
conhecida, não corrigida nesta rodada.

**Como os extremos são aplicados no gráfico:** os dias *entre* o fundo
e o topo de cada ciclo continuam vindo da série real
(`assets/data/btc-history-usd.json`) — só os dois extremos (D+0 e o
último dia da linha) são sobrescritos pelo preço desta tabela, para a
curva sempre começar exatamente em 0% e terminar exatamente na
porcentagem oficial. Ver `construirCicloUp`/`construirCicloDown` em
`assets/js/comparador-ciclos.js`.

**Auditoria de fontes (PR2):** pesquisa cruzada contra Glassnode, Into
The Cryptoverse (Cowen), LookIntoBitcoin, BitcoinCounterFlow e
CycleTop.co não encontrou, para nenhuma das 4 últimas, uma citação
direta e verificável de data+preço exatos (os 4 sites bloqueiam acesso
automatizado) — os valores acima vêm de imprensa financeira (Forbes,
CNBC, CoinDesk, Yahoo Finance) com maior taxa de confirmação cruzada.
Nenhuma fonte pesquisada usa halving como âncora de topo/fundo de forma
exclusiva; Cowen usa duas convenções em paralelo (halving E fundo
realizado), e nosso critério (fundo→topo por preço) corresponde à
segunda. Esta tabela está **congelada** — próximas mudanças exigem
revisão proposital, não pesquisa automática.

## 10. "Quando Vender Bitcoin?" — ferramenta em `/quando-vender/` (despublicada, em revisão de produto)

> **Status: fora do menu, fora do sitemap, com `noindex`.** A página foi
> publicada, testada com usuário real e depois retirada de circulação
> de propósito: no uso real, ela respondia "como uma regra teria se
> saído nos ciclos passados do Bitcoin?" (prova/backtest) em vez de
> "quando eu vendo Bitcoin?" (plano pessoal) — a pergunta que deveria
> ser a principal virou secundária, e vice-versa. O código continua no
> repositório; a reformulação da informação está em andamento antes de
> republicar. Não remova o link deste README nem o arquivo até a
> decisão de produto estar fechada.

> "Eu não preciso vender o topo. Eu só não quero assistir mais uma queda
> de 70% sem tirar nada da mesa."

Essa frase é a essência desta ferramenta: um simulador de regras de
realização parcial de lucro — sem prever topo, sem indicador
proprietário, sem recomendação financeira. Em vez de o usuário escolher
uma regra técnica, ele escolhe um perfil de investidor (Preservação,
Equilíbrio ou Convicção) — cada perfil já é uma combinação fixa e
documentada de regras testadas contra os 4 ciclos já congelados acima.
Todo o histórico de pesquisa de mercado, as 23 regras candidatas, o
backtest real, os 3 perfis, a auditoria de recorrência de uso e a
especificação de interface (wireframe textual completo) estão em
`docs/pesquisa-exit-strategy.md`, `docs/produto-quando-vender-bitcoin.md`,
`docs/perfis-de-investidor.md`, `docs/recorrencia-e-mvp-final.md` e
`docs/interface-quando-vender-bitcoin.md`. Funcionalidades futuras (o
que exige login, banco de dados, ou pode continuar 100% estático) estão
em `docs/roadmap-v2.md` — **não construídas nesta versão, só
documentadas**, de propósito, para não perder a ideia sem inchar o MVP.

**Arquitetura, para quem for mexer em `assets/js/quando-vender.js`:**
o MVP só coleta 1 aporte do usuário (BTC atual + preço médio opcional),
mas todo o motor de cálculo é escrito em cima de listas de
aportes/vendas, nunca de uma variável única de "posição" — para que
suportar múltiplos aportes, histórico de compras/vendas reais e preço
médio dinâmico no futuro não exija reescrever o motor, só passar a
alimentar essas listas com mais de 1 item. Ver `docs/roadmap-v2.md`.

Mesmo padrão 100% local das outras ferramentas (sem API, sem backend) —
única exceção é a captura de e-mail na Tela Ciclo Atual, que usa um
formulário [Formspree](https://formspree.io) (mesmo serviço já usado no
site). **Já ativado** com o endpoint `https://formspree.io/f/mgogvrrw`
em `quando-vender/index.html` — as submissões (e o e-mail de
notificação) aparecem no dashboard da conta Formspree usada para criar
esse formulário. No MVP, o envio do alerta em si (avisar quando o
gatilho realmente disparar) ainda é manual — só a captura do e-mail já
está pronta.

## 11. Halvings canônicos — definição única para todo o projeto (não editar sem revisão)

Preparação para o novo modo **"Ciclo Completo"** do Comparador de Ciclos
(e para uma futura metodologia de alinhamento por Halving, além de uso
em "Quando Vender Bitcoin?" e outras ferramentas de ciclo): os 4
halvings já ocorridos estão congelados em `assets/js/halvings.js`
(array `HALVINGS`), com a **mesma filosofia** já usada pra fundos/topo
de ciclo (seção 9 acima) — cada halving tem uma **data canônica** e um
**preço canônico** definidos manualmente, não calculados a partir de
`assets/data/btc-history-usd.json`.

**O que é objetivo vs. o que é decisão editorial:** a data e o bloco de
cada halving são fatos on-chain, sem ambiguidade (o halving acontece
exatamente a cada 210.000 blocos). Só o **preço** do dia tem a mesma
ambiguidade de fonte que já existia pra fundos/topo — por isso recebe o
mesmo tratamento: valor único, escolhido por consenso de mercado, não
recalculado do dataset.

| Halving | Data | Bloco | Recompensa (antes → depois) | Preço canônico | Fonte |
|---|---|---|---|---|---|
| 1º | 2012-11-28 | 210.000 | 50 → 25 BTC | US$ 12,35 | Figura mais repetida entre agregadores de histórico de halving (bitbo.io, pesquisa da CoinGecko, imprensa cripto) — mercado ainda muito ilíquido nessa época, mesma ressalva já feita pro fundo de 2011 na seção 9 |
| 2º | 2016-07-09 | 420.000 | 25 → 12,5 BTC | US$ 647,78 | Citação específica (43% abaixo do topo de 2013, ~US$ 1.132) — trocado de um valor redondo (US$ 650) por essa figura mais precisa, revisão de validação pós-PR |
| 3º | 2020-05-11 | 630.000 | 12,5 → 6,25 BTC | US$ 8.601,80 | Preço de fechamento citado por cobertura financeira do dia (ex: BitGo, "The Third Halvening") |
| 4º | 2024-04-20 | 840.000 | 6,25 → 3,125 BTC | US$ 63.800,00 | Consenso geral de agregadores de halving; existe uma variante mais alta (~US$ 64.990, pico intradiário Bitstamp) que não foi usada — seguimos o preço de fechamento, mesmo critério do restante da tabela |

**Auditoria de fontes:** assim como a tabela de CICLOS (seção 9), esta
pesquisa foi feita por busca cruzada em agregadores e imprensa
financeira, não por acesso direto a uma única exchange histórica — o
ambiente de desenvolvimento não tem acesso a terminais de dados pagos.
Se uma fonte primária (ex: exportação direta da Bitstamp/CoinDesk BPI
pra aquele dia exato) for encontrada depois, os valores podem ser
revisados — propositalmente, não automaticamente.

**5º halving:** ainda não ocorrido na data de hoje usada pelo projeto.
Não existe entrada estimada em `HALVINGS` — só será adicionado quando
o bloco 1.050.000 for minerado de fato e um preço puder ser congelado
com o mesmo critério acima.

**Este arquivo não está ligado a nenhuma página ainda** — `halvings.js`
só define os dados; nenhum `<script>` foi adicionado a nenhum HTML
nesta rodada. Quando "Ciclo Completo" (ou qualquer outro consumidor da
lista no topo do arquivo) for implementado, carregue-o via
`<script src="/assets/js/halvings.js">` antes do script da ferramenta,
no mesmo padrão já usado com `assets/js/utils.js`.

