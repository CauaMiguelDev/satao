'use strict';

// Camadas do mural: atualiza somente em eventos e somente enquanto visíveis.
// A foto continua intacta; perspectiva, tinta e lettering são planos separados.
(() => {
  const scenes = [...document.querySelectorAll('[data-parallax-scene]')].map(element => ({
    element,
    visible: false,
    x: 0,
    y: 0,
    layers: [...element.querySelectorAll('[data-depth]')].map(layer => ({
      element: layer,
      depth: Number(layer.dataset.depth),
      tilt: layer.hasAttribute('data-tilt')
    }))
  }));
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const disabled = () => reduced.matches || document.hidden || document.body.classList.contains('motion-paused');
  const clamp = value => Math.max(-1, Math.min(1, value));
  let frame = 0;

  function render() {
    frame = 0;
    if (disabled()) return;
    // Agrupa leituras antes de escrever transforms, sem modificar o layout.
    const positions = scenes.filter(scene => scene.visible).map(scene => ({ scene, rect: scene.element.getBoundingClientRect() }));
    positions.forEach(({ scene, rect }) => {
      const progress = clamp((innerHeight / 2 - rect.top - rect.height / 2) / ((innerHeight + rect.height) / 2));
      const strength = finePointer.matches ? 1 : .5;
      scene.layers.forEach(layer => {
        const x = scene.x * layer.depth * .2;
        const y = progress * layer.depth * strength + scene.y * layer.depth * .12;
        const tilt = layer.tilt ? ` rotateX(${-scene.y * 3}deg) rotateY(${scene.x * 3}deg)` : '';
        layer.element.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)${tilt}`;
      });
    });
  }

  function schedule() {
    if (!frame && !disabled() && scenes.some(scene => scene.visible)) frame = requestAnimationFrame(render);
  }

  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    scenes.forEach(scene => {
      scene.x = scene.y = 0;
      scene.layers.forEach(layer => { layer.element.style.transform = ''; });
    });
    schedule();
  }

  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const scene = scenes.find(item => item.element === entry.target);
      scene.visible = entry.isIntersecting;
      if (!scene.visible) scene.x = scene.y = 0;
    });
    schedule();
  }, { rootMargin: '80px' });

  scenes.forEach(scene => {
    observer.observe(scene.element);
    scene.element.addEventListener('pointermove', event => {
      if (!finePointer.matches || event.pointerType === 'touch' || disabled()) return;
      const rect = scene.element.getBoundingClientRect();
      scene.x = clamp((event.clientX - rect.left) / rect.width * 2 - 1);
      scene.y = clamp((event.clientY - rect.top) / rect.height * 2 - 1);
      schedule();
    }, { passive: true });
    scene.element.addEventListener('pointerleave', () => {
      scene.x = scene.y = 0;
      schedule();
    });
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('satao:motionchange', reset);
  finePointer.addEventListener('change', reset);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
})();
