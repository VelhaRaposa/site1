# Site do Caio Garé — guia rápido

## Como o site é organizado

- Cada página é um arquivo `.html` (index.html = Home, sobre.html, agenda.html, etc.)
- `assets/js/content.js` → **único arquivo que você mexe no dia a dia**: vídeos, agenda, parceiros, cursos.
- `assets/js/analytics.js` → onde você cola seu ID do Google Analytics.
- `assets/css/style.css` → cores e estilo visual (só mexer se quiser mudar o design).

## 1. Publicar o site de graça (GitHub Pages)

1. Crie uma conta em [github.com](https://github.com) (gratuito).
2. Crie um repositório novo, público, com o nome `caiogare-site` (pode ser outro nome).
3. Envie todos os arquivos desta pasta para esse repositório (dá pra arrastar e soltar os arquivos direto pelo site do GitHub, em "Add file → Upload files").
4. No repositório, vá em **Settings → Pages**.
5. Em "Branch", selecione `main` e clique em **Save**.
6. Em "Custom domain", digite `www.caiogare.com.br` e salve — o GitHub cria automaticamente o arquivo `CNAME` (já incluí um pronto nesta pasta também).
7. No painel onde você comprou o domínio (registro.br ou outro), configure o DNS apontando para o GitHub Pages:
   - Um registro CNAME: `www` → `SEUUSUARIO.github.io`
   - Registros A no domínio raiz (`caiogare.com.br` sem www) apontando para:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
8. Aguarde algumas horas para o DNS propagar. O GitHub emite HTTPS automaticamente.

## 2. Editar conteúdo (vídeos, parceiros, cursos, agenda)

Abra `assets/js/content.js` em qualquer editor de texto simples (ou direto no GitHub, clicando no lápis ✎ do arquivo).
Troque os textos entre aspas. Para adicionar um item novo, copie um bloco `{ ... }` inteiro e cole abaixo do último, editando os textos.
Salve (Commit changes) — o site atualiza sozinho em 1–2 minutos.

## 3. Ativar o formulário de contato (Formspree — gratuito)

1. Crie conta em [formspree.io](https://formspree.io)
2. Crie um novo formulário, copie o ID gerado (algo como `xzznabcd`)
3. Abra `contato.html` e troque `SEU_ID_AQUI` pelo ID copiado, na linha:
   `<form action="https://formspree.io/f/SEU_ID_AQUI" method="POST">`

## 4. Ativar relatório de cliques de parceiros (Google Analytics — gratuito)

1. Crie conta em [analytics.google.com](https://analytics.google.com)
2. Crie uma propriedade para `www.caiogare.com.br`
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

