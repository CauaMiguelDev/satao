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

- Hero assimétrico e imersivo, com uma textura generativa abstrata e palavras de grande escala.
- Uma faixa cinética única articula os pilares culturais da página.
- História organizada como leitura editorial; agenda organizada como lista, não como cartões de produto.
- O mural abstrato da seção de legado é uma composição própria da página e não pretende reproduzir trabalhos do artista.

## Motion

- Revelações com `opacity` e `transform` ao entrar no campo de leitura.
- A faixa textual tem um único movimento contínuo, com redução total em `prefers-reduced-motion`.
- A textura do hero é estática após o desenho inicial, preservando desempenho.

## Interaction

- Botões sobem discretamente no hover e comprimem no toque.
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
