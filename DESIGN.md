---
name: Gilmar Satão — Muro em Movimento
description: Uma experiência editorial de rua para contar a trajetória e a agenda de um pioneiro do grafite brasiliense.
colors:
  red: "#d91620"
  red-deep: "#a80e17"
  red-hot: "#ff5c5c"
  ink: "#14090b"
  ink-soft: "#281317"
  paper: "#f2e8dd"
  paper-muted: "#c8b4a7"
typography:
  display: "Archivo Black"
  text: "Archivo"
  utility: "Space Mono"
---

# Design System: Muro em Movimento

## North Star

O site deve se comportar como um muro de cidade: camadas, marcas, desgaste e grande escala tipográfica. O vermelho é o campo que organiza a página; o preto-vinho dá peso e o papel quente cria pausa para leitura.

## Layout

- Hero assimétrico e imersivo: textura de muro generativa de fundo, scrim para leitura e uma manchete de grande escala ancorada embaixo.
- Uma faixa cinética única articula os pilares culturais da página.
- História organizada como leitura editorial; agenda organizada como lista de cartões, não como grade de produto.
- O fundo do hero, o mural da seção de legado e a explosão do encerramento são texturas generativas próprias (`generate-assets.js`, via `canvas`), compostas por splatters, drips e grão de spray — não fotografias, não vídeo e não reproduções de obras do artista.

## Motion

- Revelações com `opacity` e `transform` ao entrar no campo de leitura.
- A faixa textual tem um único movimento contínuo, com redução total em `prefers-reduced-motion`.
- O momento autoral da página é a manchete do hero: as linhas assentam de um borrão (névoa de spray) para nitidez ao carregar.
- Dentro do hero, o cursor (mouse) ou o toque (mobile) deixam um rastro breve de respingos — confinado à arte do hero, nunca sobre texto de leitura, e totalmente desativado em `prefers-reduced-motion`.
- O mural de legado se desloca sutilmente (parallax contido) ao rolar a página.

## Interaction

- Botões e badges de status são pílulas (`border-radius:999px`), com um ícone SVG inline (seta, relógio, check) — nunca ícone de fonte ou biblioteca externa.
- Botões sobem discretamente no hover, comprimem no toque, e revelam o ícone com um leve slide; os CTAs principais (topo e encerramento) têm leve atração magnética ao cursor, desativada em `prefers-reduced-motion`.
- Uma barra fina de progresso de leitura acompanha o scroll no topo da página.
- Itens da agenda são cartões com borda e leve elevação no hover, não uma lista plana; o badge de status carrega um ícone (relógio para pendente, check para arquivado) para não depender só da cor.
- O botão de menu mobile é circular, com fundo sutil no hover.
- Todos os links mantêm foco de teclado de alto contraste.
- Datas ainda não confirmadas recebem o estado explícito “Em breve”.

## Do's

- Manter tipografia grande, compacta e assimétrica em títulos.
- Usar o vermelho como estrutura, não como detalhe.
- Atualizar agenda com fatos confirmados.

## Don'ts

- Não usar fotografia ou assinatura falsa do artista.
- Não transformar a agenda em um conjunto de cards iguais.
- Não adicionar efeitos de spray em loop ou animação que prejudique a leitura.
