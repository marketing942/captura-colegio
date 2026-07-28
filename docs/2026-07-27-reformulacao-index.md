# Reformulação da página de captura — `index.html`

**Data:** 2026-07-27
**Arquivos afetados:** `index.html`, `public/depoimentos/*` (novos)
**Não afetados:** `script.js`, `google-apps-script.js`, `vercel.json`, `styles.css`

---

## 1. Objetivo

A página `captura-colegio` é uma landing de contato de coluna única (560 px) que
existe para um único fim: **captar o lead no formulário**. As mudanças abaixo
reforçam a marca e adicionam prova social — replicando o site oficial
(`MVP-Colegio-CPPEM`) — sem alterar o fluxo de conversão.

## 2. Restrição inegociável — o formulário não pode ser tocado

`script.js` depende de um contrato frágil e documentado (`TRACKING.md §6.0`):

| Dependência                        | Onde                        | Consequência se quebrar          |
| ---------------------------------- | --------------------------- | -------------------------------- |
| `id="eiBtTROiAlNexbHXklSc"` no `<form>` | `index.html` linha do form  | PixelX para de registrar o Lead  |
| `#lead_name`, `#lead_email`, `#lead_phone`, `#lead_submit` | campos do form | validação e envio quebram        |
| `.field`, `.note`, `.error`, `[data-error-for]` | dentro do form | erros e tela de sucesso quebram  |

**Regras derivadas, seguidas nesta mudança:**

1. Nenhum atributo do `<form>` ou dos seus campos foi alterado.
2. Nenhum `id` novo na página (evita colisão com o identificador do painel).
3. Toda classe nova é **prefixada por seção** (`pillars__`, `pillar-card__`,
   `depos__`, `site-footer__`). Em especial, nenhuma classe nova se chama
   `.field`, `.note`, `.error`, `.form` ou `.cta` — `script.js` faz
   `form.querySelectorAll(".field, .note")` na tela de sucesso e, embora a
   busca seja escopada ao form, reutilizar esses nomes é armadilha futura.
4. Nenhum JavaScript novo. Os carrosséis são CSS puro (`@keyframes`), o que
   mantém `script.js` como único arquivo JS e zero risco de erro em runtime
   derrubar o listener de submit.

## 3. Mudanças, uma a uma

### 3.1 Logo central maior

`.emblem` 112 px → **188 px** (imagem interna 84 px → 144 px); no mobile
(≤480 px) 96 px → **150 px** (imagem 72 px → 116 px). A aura pulsante
(`.emblem::before`, `inset:-18px`) acompanha para **`-24px`**, preservando a
proporção do halo.

### 3.2 Remoção do selo "Fale com a gente"

O elemento removido é o `.badge` (o selo/pílula dourada acima do título) — não
o botão de envio. Motivo: informação redundante com o `<h1>` logo abaixo, que
já diz "Entre em contato com o Colégio CPPEM". O CSS de `.badge` sai junto
(código morto).

O botão `#lead_submit` ("QUERO ENTRAR EM CONTATO") **permanece** — é o gatilho
de conversão.

### 3.3 Formulário mais perto do subtítulo

Removido o `.gold-bar` (barra divisória de 44 px de altura + 30 px de margem) e
reduzida a margem inferior de `.sub-note` de 34 px para **16 px**.

Ganho total: **~108 px → 16 px** de espaço vertical entre o texto e o
formulário. Em telas pequenas o formulário passa a aparecer acima da dobra.

### 3.4 Headline em no máximo 2 linhas

O título tem 37 caracteres e o `.page` limita o conteúdo a 516 px. Medido no
navegador, **2 linhas cabem até ~0,0775 × a largura disponível** — ou seja, no
máximo ~40 px nesses 516 px, contra os 50 px do desenho original.

Encolher a fonte em 24% resolveria, mas custaria o impacto do título. Em vez
disso, **só o bloco do título** passa a ter `width: min(680px, 100vw - 44px)`
(ele é um flex item centralizado, então transborda a coluna de forma simétrica)
e a fonte vira `clamp(19px, calc(7.1vw - 3.2px), 48px)`.

Resultado: **48 px no desktop** (praticamente o tamanho original) e redução da
fonte apenas nas larguras em que a tela realmente não comporta 2 linhas. O
`calc` embutido no `clamp` existe porque a relação é linear com a largura
disponível (`vw - 44px`), não com a `vw` pura. A folga de ~8% sobre o limite
medido cobre variação de renderização e o fallback serif enquanto a Cinzel
carrega. Ganho colateral: o formulário subiu ~60 px.

### 3.5 Aba de Pilares (nova)

Réplica de `components/ui/LandingPillars.tsx` do site oficial, limitada a:
cabeçalho + grid de 4 cards + frase de fechamento. **Não** inclui o mockup do
Instagram nem o carrossel 3D de fotos (peso desnecessário numa página de
captação).

- Grid 2 colunas (desktop) → 1 coluna (≤820 px).
- Cada card tem cantos dourados em L (`::before` / `::after`), numeral grande
  em dourado translúcido, rótulo "Pilar N", título, régua dourada e texto com
  trecho de destaque em `--gold-light`.
- Conteúdo copiado literalmente do array `pillarCards` do site oficial.

### 3.6 Aba de Depoimentos (nova)

Réplica de `components/features/LandingTestimonials.tsx`, limitada ao
cabeçalho + **2 carrosséis infinitos intercalados** + frase de fechamento.
**Não** inclui a faixa de fotos de alunos (`/Alunos`, ~2,8 MB) nem o grid de
"trust signals".

- 15 prints divididos por paridade de índice, igual ao oficial: linha 1 recebe
  os índices pares (8 itens) e desliza para a **esquerda**; linha 2 recebe os
  ímpares (7 itens) e desliza para a **direita**.
- Cada linha duplica seus itens e a animação translada
  `calc(-50% - <metade do gap>)`. O `-50%` puro (usado no site oficial) causa
  um salto de meio-gap a cada volta, porque a largura total inclui um gap a
  menos que o necessário para o loop perfeito; a compensação já é o idioma
  deste repositório (ver `styles.css`, `@keyframes carousel-scroll`).
- Fade lateral nas bordas via gradiente absoluto: 96 px, reduzido para 48 px
  abaixo de 640 px (em 390 px de largura, dois fades de 96 px cobriam metade da
  tela e apagavam o depoimento inteiro).
- **Sem `loading="lazy"`.** A primeira versão usava lazy e 16 dos 30 cards
  ficavam permanentemente em branco: o navegador não reavalia o lazy-load de
  conteúdo que entra em cena por `transform`. Medido em Chromium, corrigido
  para `fetchpriority="low"` — carrega, mas atrás do topo da página na fila de
  rede.
- Animações desligadas em `prefers-reduced-motion: reduce`.

### 3.7 Rodapé institucional

Substitui o rodapé antigo (3 linhas de texto centralizado) pela estrutura de
`components/features/LandingFooter.tsx`:

```
logo + "Colégio CPPEM" + "Fé Cristã · Disciplina · Estabilidade · Liberdade"
───────────────────────────────────────────────
Endereço            |  Contato
───────────────────────────────────────────────
© 2026 …CNPJ…       |  Portaria de Credenciamento Nº 9097
```

Conforme pedido, **sem** os botões de redes sociais e **sem** o link "Trabalhe
Conosco" — por isso o grid é de 2 colunas (o oficial tem 3).

O logo do rodapé reaproveita a mesma URL do emblema do topo (já em cache do
navegador), em vez de somar um asset novo.

## 4. Decisões de implementação

| Decisão | Escolha | Motivo |
| ------- | ------- | ------ |
| Tipografia das seções novas | **Cinzel + DM Sans** (já carregadas) | Decisão do usuário. Evita somar Playfair Display + Rajdhani ao `<link>` do Google Fonts. Resultado é próximo, não idêntico ao oficial. |
| Fundo das seções novas | `#081534` **opaco** + vinheta lateral | Igual ao `bg-navy-alt` do oficial. A foto de fundo é `position:fixed` e continuaria passando por trás, prejudicando a leitura dos cards e dos prints. |
| Largura das seções novas | `max-width: 1120px` | O `.page` de 560 px é estreito demais para grid de 2 colunas. As seções ficam **fora** do `<main class="page">`, como irmãs. |
| Imagens dos depoimentos | **Copiadas** para `public/depoimentos/` | Referenciar `cppem.com.br` de outro deploy criaria acoplamento entre dois projetos e quebraria a página se o oficial mudar de rota. Custo: ~936 KB no repo. |
| Efeito de brilho no texto | `.shiny-text` (CSS `background-clip:text`) | Substitui o componente React `AnimatedShinyText`. A versão CSS aqui é funcionalmente melhor: no oficial a cor opaca cobre o gradiente e o brilho não chega a aparecer. |
| Carrosséis | CSS puro | Ver §2, regra 4. |

## 5. Estrutura final do `<body>`

```
main.page          → emblema · headline · subtítulo · FORMULÁRIO   (fundo: foto)
section.pillars    → 4 pilares                                     (fundo: #081534)
section.depos      → 2 carrosséis de depoimentos                   (fundo: #081534)
footer.site-footer → institucional                                 (fundo: #0e1b3d)
```

## 6. Dívida técnica observada (fora do escopo, não alterada)

1. **`styles.css` é código morto** — `index.html` não o referencia (usa `<style>`
   inline). É de uma versão antiga da landing (paleta verde/preta).
2. **~180 linhas de CSS de `.prizes` / `.prize-card` sem markup correspondente**
   dentro do `<style>` do `index.html`. Pode ser uma seção sazonal desligada —
   por isso foi mantida, mas deveria ser removida ou reativada.
3. **`.notice` também é CSS sem markup**, mesmo caso do item 2.
4. **Comentário de `index.html` sinaliza dúvida em aberto:** o id
   `eiBtTROiAlNexbHXklSc` é o mesmo da landing `aniversario-captura`. Precisa
   ser conferido no painel da PixelX.

## 7. Validação executada

Não há framework de testes neste projeto. A validação foi feita com Chromium
headless (Playwright) contra `npx serve .` em `127.0.0.1:4321`, nos viewports
1440×900 e 390×844.

### 7.1 Layout

| Verificação | Desktop | Mobile |
| ----------- | ------- | ------ |
| Diâmetro do emblema | 188 px | 150 px |
| Espaço entre subtítulo e formulário | 16 px | 16 px |
| Topo do formulário (a partir do topo da página) | 540 px | 443 px |
| Scroll horizontal (`scrollWidth` vs `innerWidth`) | 1440 = 1440 | 390 = 390 |
| `.badge` / `.gold-bar` ainda no DOM | não | não |
| Imagens quebradas | nenhuma | nenhuma |
| Erros de console / requisições falhas | nenhum | nenhum |

### 7.1.1 Headline em 2 linhas

Verificado em 15 larguras — 320, 360, 390, 412, 430, 480, 560, 640, 700, 768,
820, 1024, 1280, 1440 e 1920 px. Em **todas**: 2 linhas, sem scroll horizontal
e sem o bloco transbordar para fora da tela.

| Largura | Fonte | Bloco do título |
| --- | --- | --- |
| 320 px | 19,5 px | 276 px |
| 390 px | 24,5 px | 346 px |
| 560 px | 36,6 px | 516 px |
| 700 px | 46,5 px | 656 px |
| ≥ 768 px | 48 px | 680 px |

### 7.2 Loop dos carrosséis

Comparação entre o ciclo perfeito (`n × card + n × gap`) e o deslocamento
efetivo do CSS (`50% + gap/2`):

| Pista | Desktop | Mobile |
| ----- | ------- | ------ |
| Linha 1 (16 itens) | 3568 px = 3568 px → salto **0 px** | 3008 px = 3008 px → salto **0 px** |
| Linha 2 (14 itens) | 3122 px = 3122 px → salto **0 px** | 2632 px = 2632 px → salto **0 px** |

Todas as 30 imagens carregam (`complete && naturalWidth > 0`).

### 7.3 Regressão do fluxo de conversão

Executada com o POST ao Apps Script **interceptado e respondido 200**, e a
navegação para `wa.me` abortada — ou seja, **nenhum lead falso foi gravado na
planilha de produção**.

| Passo | Resultado |
| ----- | --------- |
| Submit com campos vazios | 3 mensagens de erro exibidas; nada enviado à planilha |
| Submit com dados válidos | payload correto (`nome`, `email`, `telefone`, `origem: captura_colegio`, `pagina`, `data_envio`) |
| Tela de sucesso | exibida |
| Redirect para o WhatsApp após 1,5 s | disparado, com a URL e o texto corretos |
| Erros de JavaScript | nenhum |

### 7.4 Pendente de validação humana

Envio real ponta a ponta (linha efetivamente gravada na planilha e conversão
registrada no painel da PixelX). Não foi executado de propósito, para não
poluir a base de leads — e o `script.js` não foi alterado.
