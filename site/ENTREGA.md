# Mural com profundidade, hover e parallax — 19/09/2026

Esta rodada amplia o refinamento anterior e atende ao pedido específico sobre o retrato.

- Retrato composto como mural em camadas: fundo de tinta existente, moldura de papel, faixa e lettering SATÃO. A fotografia original não foi editada.
- Parallax na rolagem do retrato e do mural RUA / TEM / VOZ. Mouse acrescenta inclinação limitada a 3 graus no retrato; toque mantém apenas metade da intensidade da rolagem.
- Efeitos calculados somente em eventos, com um frame por vez, para cenas próximas da tela. Sem loop permanente, biblioteca nova ou alteração da rolagem nativa.
- Pausa e preferência de movimento reduzido zeram os deslocamentos. A escolha de pausa é lembrada durante a sessão, quando o armazenamento está disponível.
- Botões de pausa e início compactos no celular e separados nos cantos inferiores.
- Áreas de atuação recebem fotos existentes e zoom discreto no hover. Galeria usa colunas com proporção original das fotos, evitando os recortes anteriores.
- Visor de fotos com miniaturas, acesso ao original e tentativa de carregamento novamente, inclusive em categoria com uma foto. Rodapé ganha lettering de marca.

## Verificação desta rodada

Passaram os sete testes locais de `tests/motion-effects.test.cjs`: rolagem e agendamento único, inatividade fora da tela, limite de inclinação/retorno, toque e intensidade reduzida, pausa/retomada, movimento reduzido/aba oculta e fallback sem IntersectionObserver. Sintaxe dos dois JavaScripts, referências locais, âncoras, IDs e diff também verificados.

**Conferência visual pendente nesta rodada:** o navegador automatizado foi bloqueado porque a revisão automática de aprovação atingiu o limite de uso. Os testes de navegador registrados nas rodadas anteriores não validam este novo layout. Não foi feita publicação.

---

# Refinamento visual e de interação — 19/09/2026

- Abertura com letras que assentam de uma névoa curta de tinta, segunda linha em papel rosado e atalho para a trajetória. Vídeos e fotografias originais preservados.
- Navegação ganha contraste ao rolar. Encerramento usa a textura já existente no acervo do projeto.
- Marcos da trajetória expansíveis com HTML nativo, funcionando também sem JavaScript.
- Galeria com duas imagens em destaque no desktop, contagem por categoria e transição de posição ao filtrar. Animações anteriores são canceladas para não se acumular durante cliques rápidos.
- Lightbox mantém teclado, retorno de foco e tratamento de falhas; recebe gesto horizontal por toque.
- Pausa manual também encerra a entrada do título e desativa a rolagem suave. Preferência de movimento reduzido interrompe as animações. Controles dependentes de JavaScript ficam ocultos quando ele está indisponível.
- Contatos com valores de exemplo e imprensa sem fontes/PDF foram preservados em `template#contact-draft` e `template#press-draft`, fora da página pública. O Instagram já presente no site é o contato ativo. Preencher e verificar os dados antes de reativar os rascunhos.
- Imagem Open Graph usa URL absoluta baseada no endereço de produção já presente no HTML. Poster do vídeo usa o arquivo menor, sem modificar o vídeo.

## Verificação desta rodada

24 verificações no navegador: larguras 320/390/768/1024/1440 sem transbordamento; expansão de trajetória; filtros; paginação; álbum de foto única; setas; Escape e retorno do foco; menu móvel; pausa; movimento reduzido sem animações ativas; gesto sintético; erro de carregamento com recuperação; filtros sucessivos; navegação e 18 fotos disponíveis sem JavaScript. Sintaxe JavaScript e diff verificados. Nenhum erro de console no percurso normal; a falha de imagem foi provocada somente para testar sua recuperação.

Inspeção visual em desktop e celular. O detector de design executou com parser limitado: sinalizou cores derivadas já usadas pela paleta e a imagem dinâmica do lightbox, cuja fonte é atribuída somente ao abrir. Isso não equivale a auditoria completa de acessibilidade ou medição em aparelho físico. Nenhuma biblioteca adicionada e nenhuma publicação realizada.

---

# Atualização — botões com identidade própria

CTAs com geometria mais firme, preenchimento vermelho ascendente, ícone em disco com rotação direcional e pressão curta ao toque. Rótulo e ícone usam camadas separadas para manter legibilidade. Filtros e áreas de atuação ganharam feedback visual consistente. Sem dependências novas e sem mudanças nos vídeos.

Verificados 390 e 1440 px sem transbordamento, alvos de 48 a 72 px, foco de teclado e contraste do texto nos fundos claros/vermelhos. Preferência de movimento reduzido e pausa manual continuam respeitadas.

---

# Atualização — navegação e apresentação do hero

Menu flutuante mais compacto, estado ativo com fundo, descritores preservados e painel móvel com fechamento ao sair pelo teclado. No desktop, o overlay protege a leitura à esquerda e deixa a cena mais visível à direita. No celular, a mídia aparece em uma área de proporção 16:10 acima do texto, evitando o zoom causado pelo preenchimento de uma tela vertical.

A seleção do vídeo agora considera a área renderizada e a densidade de pixels. Usa o arquivo 4K existente quando a demanda ultrapassa 1920 pixels; mantém a versão menor em 3G. Não houve reencode, upscale, filtro, alteração de velocidade nem modificação do conteúdo. SHA-256 dos dois MP4 conferidos antes e depois: idênticos.

Validado: 1440 px em densidade 2x reproduzindo 4K; 390 px sem transbordamento e com menu contido na tela. Esta atualização substitui a regra anterior de seleção apenas pela largura do viewport.

---

# Atualização — links e movimento

A pedido do usuário, esta rodada amplia as animações mantendo a organização da rodada anterior.

- Links das áreas de atuação agora nomeiam o destino Instagram; CTA principal “Falar com Satão”.
- Sublinhados progressivos, setas direcionais, feedback de pressão e indicadores nos links do rodapé.
- Revelações em sequência nas fotografias e áreas de atuação; entrada própria para as letras do legado e marcos da trajetória, sem contadores que alterem datas.
- Menu móvel com transição e ícone de fechar; lightbox com entrada e transição ao carregar imagens.
- Controle de pausa acompanha a página; botão de voltar ao início surge após 800 px.
- Ticker interrompido fora da tela. Animações respeitam preferência de movimento reduzido, pausa manual e aba oculta. Sem bibliotecas adicionais.
- Verificados menu móvel, âncoras e foco, pausa (zero animações em execução), lightbox e ausência de transbordamento em 390 e 1440 px. Lighthouse móvel: acessibilidade, boas práticas e SEO 100; Performance não pontuada.

O vídeo barroco e seus arquivos originais permanecem intactos. Os detalhes de assets abaixo continuam válidos; as descrições de movimento anteriores foram ampliadas nesta atualização.

---

# Gilmar Satão — organização e legibilidade

## Plano da rodada

Os rótulos pequenos, títulos longos e informações dispersas dificultavam a leitura.
Ajustamos a escala tipográfica e organizamos cada seção em título, contexto e ação.
O menu ganhou descritores, os botões receberam textos maiores e o rodapé foi dividido por finalidade.
O vídeo barroco original foi recuperado do histórico; efeitos secundários foram reduzidos.

## Arquivos completos

`site/index.html`, `site/style.css` e `site/main.js` são os arquivos finais, completos e comentados. Publique o conteúdo de `site/`, incluindo a pasta `media/`. Não há framework nem etapa de build. Para prévia local, execute `python serve.py` na raiz do projeto e acesse http://localhost:5173/.

## Alterações

- **Hero restaurado:** arquivos originais recuperados da versão anterior a `8da8d8e`, sem recodificação, filtros ou alteração de velocidade. Autoplay, muted, loop e playsinline; poster e carregamento condicionado à visibilidade. Overlay vermelho escuro garante leitura sem alterar o arquivo.
- **Menu:** História, Legado, Atuação, Galeria e Agenda com descritores curtos e indicação ativa. Acesso ao Instagram no botão principal. No celular e tablet, menu vertical com área rolável em telas baixas.
- **Botões:** texto 16 px no desktop e pelo menos 15 px no CTA compacto, altura mínima 48 px, contraste alto, foco visível e rótulos explícitos. Controle de menu 44 × 44 px.
- **Leitura:** corpo de 17 px, legendas de 14 px, títulos menores e diretos, texto da história em uma coluna de leitura. Marcos empilhados no celular.
- **Agenda:** estado sem datas confirmadas explicado uma única vez, com ação para acompanhar novidades reais.
- **Ticker:** dois grupos iguais, animação linear de 55 segundos e espaçamento simétrico para evitar salto na emenda. Conteúdo acessível não duplicado.
- **Rodapé:** apresentação profissional, localização, navegação, Instagram e copyright com ano atualizado automaticamente.
- **Movimento:** retirados o parallax e o fundo pulsante; mantidas apenas entradas curtas, ticker e vídeo original. Pausa manual e preferência de movimento reduzido continuam disponíveis.
- **Galeria:** preservadas as 13 fotografias, miniaturas WebP e lightbox com navegação por teclado.

## Vídeo: já incluído

Não é necessário enviar o vídeo novamente. Estes assets foram recuperados do Git:

- `site/media/track-video-4k.mp4`
- `site/media/track-video-2k.mp4`
- `site/media/hero-still-4k.jpg`
- `site/media/hero-still-2k.jpg`

O nome 2K vem do arquivo original; o navegador informa 1920 × 1072 para essa versão. A versão maior tem 3840 × 2144 e é selecionada a partir de 1920 px; sua reprodução também foi confirmada no navegador. Não houve upscale nesta rodada: a restauração preserva exatamente os bytes recuperados. Os elementos gráficos de rastreamento que aparecem na cena já pertencem ao clipe original.

Se quiser atualizar a qualidade no futuro, substitua esses quatro arquivos nos mesmos caminhos, sempre com o próprio clipe e frames correspondentes. `source[data-src]` no HTML contém os caminhos. O carregador já está ativo (`data-enabled="true"`). A versão menor funciona como fallback da maior.

O poster permanece quando a pessoa solicita movimento reduzido ou economia de dados, quando o navegador bloqueia reprodução ou quando há falha de mídia. Esse fallback de acessibilidade não substitui o vídeo no uso normal. Fora da tela ou com a aba oculta, a reprodução pausa.

## Fotos

Coloque os novos arquivos em `site/media/galeria/`. No `index.html`, procure o comentário `GALERIA` e duplique um `figure.gallery-item`:

- `href`: imagem grande para o lightbox.
- `img src`: miniatura WebP.
- `width` e `height`: proporção real.
- `alt`: descrição objetiva da imagem.
- `figcaption`: legenda com fatos confirmados.

O JavaScript reconhece os novos itens automaticamente. O `template#instagram-placeholder` continua disponível como modelo editorial inativo. Use somente imagens autorizadas; não há extração automática do Instagram.

## Validação

- Lighthouse móvel desta rodada: acessibilidade 100, boas práticas 100, SEO 100. A ferramenta não pontua Performance.
- Reprodução real do vídeo e avanço do tempo confirmados; pausa manual testada.
- Menu móvel e destinos das âncoras verificados; sem scroll horizontal em 360 px e desktop.
- JavaScript validado e diff sem erros de whitespace.

O domínio de produção não foi fornecido: canonical e og:url continuam sem valores inventados. Ao publicar, use o domínio real e uma URL absoluta para og:image. Nenhuma publicação em produção foi realizada.
