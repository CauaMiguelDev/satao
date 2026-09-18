# Gilmar Satão — Site Oficial

Site institucional e portfólio de **Gilmar Satão** — grafiteiro, jornalista, educador
e produtor cultural de Ceilândia/DF. Três décadas de grafite, Hip Hop e memória urbana,
da Ceilândia para os muros do Distrito Federal — e até a França.

## 🔴 Site no ar

### 👉 https://cauamigueldev.github.io/satao/

[![Deploy site to GitHub Pages](https://github.com/CauaMiguelDev/satao/actions/workflows/pages.yml/badge.svg)](https://github.com/CauaMiguelDev/satao/actions/workflows/pages.yml)

> Dica: no computador salve nos favoritos; no celular use **"Adicionar à tela de início"**
> para abrir como se fosse um app.

## Sobre o artista

- Grafiteiro, jornalista, educador e produtor cultural. Nascido e criado na Ceilândia (DF).
- Começou ainda garoto, aos 12 anos.
- Em **1993**, ao lado de **Sowtto** e **Supla**, formou a **OS-3S** — a primeira crew de
  grafite do Distrito Federal.
- O traço **wild-style** virou referência na memória visual de Brasília e levou seu nome
  de vários estados até a **França**.
- Uma das vozes mais antigas e ativas da cultura Hip Hop no DF.
- Instagram: [@gilmar_satao](https://www.instagram.com/gilmar_satao/)

## O que o site tem

- **Hero** com vídeo em loop e entrada animada
- **História**, **Satão em números**, **Legado**
- **Atuação** — murais, oficinas, palestras e produção cultural
- **Galeria "Obras pela cidade"** — 13 fotos reais dos trabalhos (autorizadas pelo
  artista), em mosaico com **lightbox** (clicar para ampliar)
- **Agenda** e chamada final com link para o Instagram
- Detalhes de interação: cursor customizado, faixa de palavras cinética, animações
  suaves ao rolar, menu responsivo, botão "voltar ao topo"
- **Responsivo** (celular e desktop) e com cuidados de **acessibilidade**
  (contraste, foco visível, respeito a `prefers-reduced-motion`)

## Tecnologia

- **HTML** semântico + **CSS** puro + **JavaScript** vanilla (sem framework)
- Tipografia: Archivo Black (display), Archivo (texto), Space Mono (rótulos)
- Paleta vermelha / grafite ("ink"), com sistema de tokens em CSS
- Hospedagem: **GitHub Pages** com deploy automático via **GitHub Actions**

## Estrutura do projeto

```
site/                        # o site publicado (o que vai ao ar)
  index.html                 # página principal
  style.css                  # estilos
  main.js                    # interações (cursor, ticker, galeria/lightbox, etc.)
  media/                     # vídeo do hero, posters e fotos
    galeria/                 # as 13 fotos da galeria
.github/workflows/pages.yml  # deploy automático para o GitHub Pages
serve.py                     # servidor local para desenvolvimento
```

## Rodar localmente

Requer apenas Python 3 (nenhuma dependência a instalar):

```bash
PORT=5173 python3 serve.py
# depois abra http://localhost:5173 no navegador
```

## Como publicar (deploy)

O deploy é **automático**: todo push na branch **`main`** publica o site no GitHub Pages
(o workflow `.github/workflows/pages.yml` envia a pasta `site/`).

Para republicar manualmente: **Actions → "Deploy site to GitHub Pages" → Run workflow**.

## Onde ver o link no GitHub

- **Settings → Pages** → *"Your site is live at …"*
- Caixa **"About"** na página inicial do repositório (dá para fixar o link)
- **Actions** → execução verde *"Deploy site to GitHub Pages"*

---

**Gilmar Satão** · Grafite & cultura urbana · Ceilândia · DF · Brasil
