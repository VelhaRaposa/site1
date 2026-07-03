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
