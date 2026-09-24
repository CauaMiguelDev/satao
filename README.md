# Gilmar Satão — Grafite & Cultura Urbana

Site oficial do grafiteiro **Gilmar Satão**, de Ceilândia/DF. Retrospectiva do
trabalho, galeria de obras, trajetória, agenda de oficinas e uma área de
comunidade onde visitantes enviam fotos e avaliam o site.

## 🔗 No ar

**https://cauamigueldev.github.io/satao/**

## O que tem no site

- **Hero** com vídeo do artista em ação.
- **Sobre** — identidade e a história por trás do traço.
- **Trajetória** — linha do tempo da carreira.
- **Atuação** — frentes de trabalho (muros, oficinas, eventos).
- **Galeria** — obras em grade bento com filtro por categoria e lightbox.
- **Território** — globo 3D interativo marcando os lugares por onde Satão passou.
- **Agenda** — próximas oficinas e eventos, com CTA de contato.
- **Instagram** — carrossel com posts em alta qualidade.
- **Comunidade** — envio de fotos de grafite (com moderação) e avaliação do site.
- **PWA** — instalável, com service worker para cache/offline.
- **i18n** — Português (padrão), Inglês e Francês.

## Tecnologia

Site estático, sem framework nem build step: **HTML + CSS + JavaScript puro**.

- `style.css`, `layout.css`, `motion.css` — estilos (paleta monocromática em tons de vermelho).
- `main.js` — interações, animações e navegação.
- `i18n.js` — traduções PT/EN/FR.
- `sw.js` / `manifest.json` — PWA.
- `community.js` + `supabase-config.js` — área de comunidade (backend via Supabase).
- `admin/` — painel de moderação de fotos e avaliações.

## Estrutura

```
site/            # o site publicado (raiz do GitHub Pages)
  index.html
  *.css / *.js
  media/         # imagens, video, icones
  admin/         # painel administrativo
supabase/        # schema do banco (tabelas, RLS, storage)
.github/workflows/pages.yml   # deploy automatico
```

## Rodar localmente

Qualquer servidor estático serve. Por exemplo:

```bash
python -m http.server 8137 --directory site
```

Depois abra http://localhost:8137.

## Deploy

Automático via **GitHub Pages**: todo push na branch `main` dispara o workflow
`.github/workflows/pages.yml`, que publica a pasta `site/`.

## Comunidade (Supabase)

A área de comunidade (envio de fotos + avaliações) precisa de um projeto Supabase.
Enquanto não estiver configurada, ela aparece em um estado vazio amigável.

Para ativar: crie um projeto no Supabase, aplique o schema em `supabase/`, e cole
a `url` e a `anonKey` em `site/supabase-config.js`.
