'use strict';
document.documentElement.classList.add('js');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const activeMotion = new Set();
const elementMotion = new WeakMap();
// WAAPI: animações curtas podem ser encerradas imediatamente por preferência ou pausa.
function animateOnce(element, frames, options = {}) {
  elementMotion.get(element)?.cancel();
  if (motion.matches || paused || document.hidden || !element.animate) return;
  const animation = element.animate(frames, { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)', ...options });
  elementMotion.set(element, animation);
  activeMotion.add(animation);
  animation.finished.catch(() => {}).finally(() => activeMotion.delete(animation));
}

const hero = document.querySelector('.hero');
const video = document.querySelector('.hero-video');
const motionButton = document.querySelector('.motion-toggle');
let paused = false;
try { paused = sessionStorage.getItem('satao-motion-paused') === 'true'; } catch { /* Preferência opcional em navegação privada. */ }
let inView = true;
let loaded = false;
let failed = false;
let posterReady = false;
const saveData = () => connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');

// Nenhum download de vídeo até ativação editorial e condições apropriadas.
function syncVideo() {
  const allowed = !motion.matches && !saveData() && !paused && inView && !document.hidden;
  if (!video || video.dataset.enabled !== 'true' || failed || !posterReady) return;
  if (!allowed) { video.pause(); return; }
  if (!loaded) {
    const sources = [...video.querySelectorAll('source')];
    // Escolhe entre os arquivos intactos pela área exibida e densidade da tela.
    // Não troca a fonte durante reprodução: evita downloads e reinícios desnecessários.
    const frame = video.getBoundingClientRect();
    const pixelsNeeded = Math.max(frame.width, frame.height * (3840 / 2144)) * Math.min(devicePixelRatio || 1, 2);
    const use4k = connection?.effectiveType !== '3g' && pixelsNeeded > 1920;
    const selected = use4k ? sources[0] : sources[sources.length - 1];
    video.src = selected.dataset.src;
    loaded = true;
    video.load();
  }
  video.play().catch(() => { video.classList.remove('is-playing'); });
}
video?.addEventListener('playing', () => {
  if (motion.matches || saveData() || paused || !inView || document.hidden) { video.pause(); return; }
  video.classList.add('is-playing');
});
// Se uma versão maior falhar, tenta a versão menor; poster continua visível.
video?.addEventListener('error', () => {
  video.classList.remove('is-playing');
  const fallback = video.querySelector('source:last-child')?.dataset.src;
  if (fallback && !video.src.endsWith(fallback)) {
    video.src = fallback;
    video.load();
    syncVideo();
  } else { failed = true; }
});
function syncMotion() {
  document.body.classList.toggle('motion-paused', paused || motion.matches || document.hidden);
  document.documentElement.classList.toggle('motion-disabled', paused || motion.matches);
  if (paused || motion.matches || document.hidden) activeMotion.forEach(animation => animation.finish());
  motionButton.hidden = motion.matches;
  motionButton.setAttribute('aria-pressed', String(paused));
  const motionLabel = paused ? 'Retomar movimento' : 'Pausar movimento';
  motionButton.querySelector('.motion-label').textContent = motionLabel;
  motionButton.setAttribute('aria-label', motionLabel);
  if (motion.matches || saveData()) video?.classList.remove('is-playing');
  syncVideo();
  dispatchEvent(new Event('satao:motionchange'));
}
motionButton.addEventListener('click', () => {
  paused = !paused;
  try { sessionStorage.setItem('satao-motion-paused', String(paused)); } catch { /* Sem armazenamento: mantém a preferência nesta página. */ }
  syncMotion();
});
motion.addEventListener('change', syncMotion);
connection?.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncVideo();
  }).observe(hero);
  // O ticker para quando está fora da tela.
  new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
  }).observe(document.querySelector('.ticker'));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.hidden) return;
      const element = entry.target;
      const group = element.parentElement;
      const stagger = group.matches('.practice-grid,.legacy-wall');
      const index = stagger ? [...group.children].indexOf(element) % 3 : 0;
      if (element.matches('.motion-tag')) {
        const settled = getComputedStyle(element).transform;
        animateOnce(element, [{ opacity: .35, transform: `${settled} translateY(32px) scale(.96)` }, { opacity: 1, transform: settled }], { delay: index * 70, duration: 700 });
      } else {
        const from = element.matches('.gallery-item') ? 'translateY(16px)' : 'translateY(14px)';
        animateOnce(element, [{ opacity: .45, transform: from }, { opacity: 1, transform: 'none' }], { delay: index * 65 });
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: .08 });
  document.querySelectorAll('.reveal,.motion-mark,.motion-tag').forEach(item => revealObserver.observe(item));
}
syncMotion();
const poster = document.querySelector('.hero-art-bg');
poster.decode().catch(() => {}).then(() => { posterReady = true; syncVideo(); });

// Rolagem nativa: preserva mouse, toque e teclado; um frame por evento.
const progress = document.querySelector('.scroll-progress');
const links = [...document.querySelectorAll('#primary-nav a')];
const sections = links.map(link => document.querySelector(link.hash));
const backTop = document.querySelector('.back-top');
const header = document.querySelector('.topbar');
let ticking = false;
function updateScroll() {
  ticking = false;
  const doc = document.documentElement;
  backTop.hidden = scrollY < 800;
  header.classList.toggle('is-scrolled', scrollY > 48);
  const max = doc.scrollHeight - doc.clientHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(1,Math.max(0,scrollY / max)) : 0})`;
  let active = -1;
  sections.forEach((section, i) => { if (section.getBoundingClientRect().top <= innerHeight * .4) active = i; });
  links.forEach((link, i) => {
    if (i === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleScroll() { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', scheduleScroll);
addEventListener('load', scheduleScroll);
updateScroll();

const topbar = document.querySelector('.topbar');
// Sair do menu por Tab também fecha o painel, sem prender o teclado.
topbar.addEventListener('focusout', event => {
  if (event.relatedTarget && !topbar.contains(event.relatedTarget)) closeNav();
});
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#primary-nav');
function closeNav(restoreFocus = false) {
  topbar.classList.remove('nav-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.querySelector('.nav-toggle-label').textContent = 'Abrir menu';
  if (restoreFocus) toggle.focus();
}
toggle.addEventListener('click', () => {
  const open = topbar.classList.toggle('nav-open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.querySelector('.nav-toggle-label').textContent = open ? 'Fechar menu' : 'Abrir menu';
});
nav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  closeNav();
  const target = document.querySelector(link.hash);
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
document.addEventListener('click', event => { if (!topbar.contains(event.target)) closeNav(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && topbar.classList.contains('nav-open')) closeNav(true);
});
matchMedia('(min-width:1181px)').addEventListener('change', () => closeNav());

// Galeria: filtros e paginação partilham a mesma seleção com o lightbox.
const galleryItems = [...document.querySelectorAll('.gallery-grid .gallery-item')];
const galleryFilter = document.querySelector('.gallery-filter');
const pagination = document.querySelector('.gallery-pagination');
const summary = document.querySelector('.gallery-summary');
const pageSize = 6;
let galleryPage = 1;
let category = 'todas';
const filteredItems = () => galleryItems.filter(item => category === 'todas' || item.dataset.category === category);
galleryFilter.querySelectorAll('button').forEach(button => {
  const count = galleryItems.filter(item => button.dataset.filter === 'todas' || item.dataset.category === button.dataset.filter).length;
  const badge = document.createElement('span');
  badge.className = 'filter-count';
  badge.textContent = String(count).padStart(2, '0');
  badge.setAttribute('aria-hidden', 'true');
  button.append(badge);
});
function renderGallery(announce = false) {
  // Posições antes de filtrar; leituras de layout agrupadas antes de animar.
  const previous = new Map();
  galleryItems.forEach(item => {
    if (announce && !item.hidden) previous.set(item, item.getBoundingClientRect());
  });
  galleryItems.forEach(item => elementMotion.get(item)?.cancel());
  const items = filteredItems();
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  galleryPage = Math.min(galleryPage, pages);
  const start = (galleryPage - 1) * pageSize;
  const visible = new Set(items.slice(start, start + pageSize));
  galleryItems.forEach(item => {
    item.hidden = !visible.has(item);
  });
  summary.textContent = items.length ? `${start + 1}–${Math.min(start + pageSize, items.length)} de ${items.length} registros · Página ${galleryPage} de ${pages}` : 'Nenhum registro nesta categoria.';
  pagination.replaceChildren();
  pagination.hidden = pages <= 1;
  const addPageButton = (label, page, disabled = false, active = false) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.disabled = disabled;
    button.dataset.page = page;
    button.setAttribute('aria-controls', 'gallery-results');
    if (active) button.setAttribute('aria-current', 'page');
    if (/^\d+$/.test(label)) button.setAttribute('aria-label', `Página ${label}`);
    pagination.append(button);
  };
  addPageButton('Anterior', galleryPage - 1, galleryPage === 1);
  for (let page = 1; page <= pages; page++) addPageButton(String(page), page, false, page === galleryPage);
  addPageButton('Próxima', galleryPage + 1, galleryPage === pages);
  if (announce) {
    const positions = [...visible].map(item => [item, item.getBoundingClientRect()]);
    positions.forEach(([item, rect]) => {
      const old = previous.get(item);
      animateOnce(item, [
        { opacity: old ? 1 : .45, transform: old ? `translate(${old.left - rect.left}px,${old.top - rect.top}px)` : 'translateY(14px)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 280 });
    });
  }
  scheduleScroll();
}
pagination.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  galleryPage = Number(button.dataset.page);
  renderGallery(true);
  // Foco no início dos resultados após substituir os controles da página.
  summary.setAttribute('tabindex', '-1');
  summary.focus({ preventScroll: true });
  summary.scrollIntoView({ behavior: motion.matches || paused ? 'instant' : 'smooth', block: 'start' });
});
galleryFilter?.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.dataset.filter === category) return;
  category = button.dataset.filter; galleryPage = 1;
  galleryFilter.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  renderGallery(true);
});
renderGallery();

// Dialog nativo: foco contido, Escape e retorno ao registro de origem.
const dialog = document.querySelector('.lightbox');
const large = dialog.querySelector('.lightbox-image');
const caption = dialog.querySelector('figcaption');
const status = dialog.querySelector('.lightbox-status');
const retry = dialog.querySelector('.lightbox-retry');
const thumbnails = dialog.querySelector('.lightbox-thumbnails');
let album = [];
let current = 0;
let opener;
let imageRequest = 0;
async function showImage(index, direction = 1) {
  current = (index + album.length) % album.length;
  const link = album[current];
  const request = ++imageRequest;
  status.textContent = 'Carregando imagem…';
  retry.hidden = true;
  dialog.setAttribute('aria-busy', 'true');
  large.style.visibility = 'hidden';
  large.alt = link.querySelector('img').alt;
  large.src = link.href;
  caption.textContent = link.closest('figure').querySelector('figcaption').textContent;
  dialog.querySelector('.lightbox-original').href = link.href;
  [...thumbnails.children].forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === current));
  });
  const selectedThumb = thumbnails.children[current];
  if (selectedThumb) thumbnails.scrollTo({ left: selectedThumb.offsetLeft - thumbnails.clientWidth / 2 + selectedThumb.clientWidth / 2, behavior: 'instant' });
  dialog.querySelector('.lightbox-count').textContent = `${String(current + 1).padStart(2, '0')} / ${String(album.length).padStart(2, '0')}`;
  dialog.querySelectorAll('[data-direction]').forEach(button => { button.disabled = album.length < 2; });
  try {
    await large.decode();
    if (request !== imageRequest || !dialog.open) return;
    large.style.visibility = 'visible'; status.textContent = '';
    dialog.setAttribute('aria-busy', 'false');
    animateOnce(large, [{ opacity: .4, transform: `translateX(${direction * 16}px) scale(.99)` }, { opacity: 1, transform: 'none' }], { duration: 260 });
  } catch {
    if (request === imageRequest && dialog.open) {
      status.textContent = 'Não foi possível carregar esta foto. Tente novamente ou abra a imagem original.';
      retry.hidden = false;
      dialog.setAttribute('aria-busy', 'false');
    }
  }
}
if (typeof dialog.showModal === 'function') {
  galleryItems.forEach(item => {
    const link = item.querySelector('.gallery-link');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); opener = link;
      album = filteredItems().map(item => item.querySelector('.gallery-link'));
      thumbnails.replaceChildren(...album.map((entry, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.index = index;
        button.setAttribute('aria-label', `Foto ${index + 1}: ${entry.closest('figure').querySelector('figcaption').textContent}`);
        const thumb = document.createElement('img');
        thumb.src = entry.querySelector('img').src;
        thumb.alt = ''; thumb.width = 64; thumb.height = 64;
        thumb.loading = 'lazy'; thumb.decoding = 'async';
        button.append(thumb);
        return button;
      }));
      dialog.showModal();
      showImage(album.indexOf(link));
      animateOnce(dialog, [{ opacity: .5, transform: 'translateY(12px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 240 });
    });
  });
}
dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
retry.addEventListener('click', () => showImage(current));
thumbnails.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) showImage(Number(button.dataset.index));
});
dialog.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => {
  const direction = Number(button.dataset.direction);
  showImage(current + direction, direction);
}));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    if (album.length < 2) return;
    event.preventDefault(); const direction = event.key === 'ArrowRight' ? 1 : -1;
    showImage(current + direction, direction);
  }
});
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  imageRequest++;
  // Retorna ao registro que abriu o diálogo, mesmo após navegar pelo acervo.
  opener?.focus({ preventScroll: true });
});

// Swipe horizontal: mantém o gesto vertical de rolagem e ignora toques em controles.
let swipeStart;
const lightboxStage = dialog.querySelector('.lightbox-stage');
lightboxStage.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || !event.isPrimary || album.length < 2) return;
  swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  lightboxStage.setPointerCapture(event.pointerId);
});
lightboxStage.addEventListener('pointerup', event => {
  if (!swipeStart || event.pointerId !== swipeStart.id) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) showImage(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});
lightboxStage.addEventListener('pointercancel', () => { swipeStart = null; });

document.querySelectorAll('.milestone').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) animateOnce(item.querySelector('.milestone-detail'), [
      { opacity: .45, transform: 'translateY(-6px)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 220 });
    scheduleScroll();
  });
});

// Ano civil do copyright, sem alterar datas da trajetória.
document.querySelector('#copyright-year').textContent = new Date().getFullYear();

// Âncoras preservam o foco lógico no hero, nos botões e no rodapé.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
