# Proposta visual — Comparador de Ciclos

> Mockup para validação visual, **sem implementação**. Nenhum arquivo de
> `comparador-ciclos/` foi alterado nesta PR.

## Correção de direção

A primeira rodada desta proposta usou `assets/img/favicon.svg` como
"logo Caio Garé" para a marca d'água — **arquivo errado**. Esse SVG é um
"C" tipográfico órfão: não é referenciado por nenhum `<img>` do site,
é resto de uma identidade visual antiga.

## Passo 1 — logo correta

O header/navbar (`assets/js/nav.js`, função `brandHtml()`, linha 27)
usa:

```html
<img src="/favicon.svg" alt="" class="brand-mark" aria-hidden="true">
```

Ou seja, `/favicon.svg` **na raiz do repositório** — um arquivo
diferente de `assets/img/favicon.svg`, apesar do nome igual. É
estilizado por `.brand-mark` em `assets/css/style.css:137` (32×32px,
`border-radius:8px`) e injetado em `#site-header` por `brandHtml()` em
toda página do site (via `document.getElementById("site-header")`).

Essa é a marca real: squircle navy (`#0B2138`) com um anel aberto
laranja (`#F9A845`) e um ponto central — não um "C" de letra.

## Passo 2 — validação

![Validação: arquivo /favicon.svg vs. renderização real no menu](img/comparador-ciclos-logo-validacao.png)

Captura direta da página real (`comparador-ciclos/`, servidor local),
sem edição, ao lado do arquivo fonte — confirma que é a mesma marca. O
arquivo antigo (`assets/img/favicon.svg`) aparece riscado na parte de
baixo, para deixar claro por que foi descartado.

## Passo 3 — marca d'água (adiada)

Fora do escopo desta rodada até a logo acima ser confirmada. Quando
aprovada, o componente de marca d'água deve nascer genérico (não
exclusivo do Comparador de Ciclos) para reaproveitar em Comparador de
Investimentos, Calculadora DCA e ferramentas futuras — provavelmente
como um helper compartilhado em `assets/js/utils.js` ou um plugin
Chart.js reaproveitável entre as três ferramentas, em vez de código
duplicado em cada uma.

## Passo 4 — legenda: reposicionamento mínimo

A rodada anterior errou o alvo (virou 2ª linha / novo bloco). Correção:
**mesma barra, mesma linha, zero mudança de estrutura** — só aproximar
a legenda dos controles Fundo/Halving.

**Atual** — `.ciclos-toolbar` usa `justify-content:space-between`,
empurrando `.legenda-toolbar` para a ponta oposta da barra:

![Toolbar atual — legenda empurrada para a ponta oposta](img/comparador-ciclos-toolbar-atual.png)

**Proposto** — troca só o `justify-content` da barra (de
`space-between` para o alinhamento natural ao início); a legenda passa
a ficar logo depois do divisor que já existe entre `.alinhamento-toggle`
e `.legenda-toolbar` no HTML atual. Mesmo markup, mesma linha, nenhum
elemento novo:

![Toolbar proposto — legenda aproximada dos controles Fundo/Halving](img/comparador-ciclos-toolbar-proposto.png)

## Entrega desta PR

Screenshot 1 (validação da logo), Screenshot 2 (toolbar atual) e
Screenshot 3 (toolbar com legenda reposicionada) — nada além disso.
Aguardando confirmação da logo antes de retomar a marca d'água.
