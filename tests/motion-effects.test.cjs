const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

// Exercita eventos e preferências sem navegador; não substitui inspeção visual.
const source = readFileSync(join(__dirname, '../site/motion-effects.js'), 'utf8');
function setup({ reduced = false, fine = true, observer = true } = {}) {
  const events = new Map();
  const frames = new Map();
  let nextId = 0;
  let intersection;
  const on = (name, callback) => {
    if (!events.has(name)) events.set(name, []);
    events.get(name).push(callback);
  };
  const emit = (name, event = {}) => events.get(name)?.forEach(callback => callback(event));
  const media = {
    reduced: { matches: reduced, addEventListener: (_, cb) => on('reduced', cb) },
    fine: { matches: fine, addEventListener: (_, cb) => on('fine', cb) }
  };
  const layer = { dataset: { depth: '18' }, style: {}, hasAttribute: () => true };
  const scene = {
    rect: { top: 200, left: 0, height: 400, width: 300 },
    querySelectorAll: () => [layer],
    getBoundingClientRect() { return this.rect; },
    addEventListener: on
  };
  const document = {
    hidden: false,
    paused: false,
    body: { classList: { contains: () => document.paused } },
    querySelectorAll: () => [scene],
    addEventListener: on
  };
  const context = {
    document, innerHeight: 800,
    matchMedia: query => query.includes('reduced') ? media.reduced : media.fine,
    addEventListener: on,
    requestAnimationFrame: callback => { frames.set(++nextId, callback); return nextId; },
    cancelAnimationFrame: id => frames.delete(id)
  };
  if (observer) context.IntersectionObserver = class {
    constructor(callback) { intersection = callback; }
    observe() {}
  };
  context.window = context;
  vm.runInNewContext(source, context);
  const visible = state => intersection?.([{ target: scene, isIntersecting: state }]);
  const flush = () => {
    const scheduled = [...frames.values()];
    frames.clear();
    scheduled.forEach(callback => callback());
  };
  return { emit, visible, flush, frames, layer, scene, document, media };
}

test('scroll changes visible layers; events share one frame and never start an idle loop', () => {
  const app = setup();
  app.visible(true); app.flush();
  const initial = app.layer.style.transform;
  app.scene.rect.top = -200;
  app.emit('scroll'); app.emit('scroll'); app.emit('resize');
  assert.equal(app.frames.size, 1);
  app.flush();
  assert.notEqual(app.layer.style.transform, initial);
  assert.equal(app.frames.size, 0);
});

test('offscreen scenes schedule no work', () => {
  const app = setup();
  app.visible(false);
  app.emit('scroll');
  assert.equal(app.frames.size, 0);
});

test('mouse tilt is bounded and pointer leave restores the neutral angle', () => {
  const app = setup();
  app.visible(true); app.flush();
  app.emit('pointermove', { pointerType: 'mouse', clientX: 9000, clientY: 9000 }); app.flush();
  assert.match(app.layer.style.transform, /rotateX\(-3deg\) rotateY\(3deg\)/);
  app.emit('pointerleave'); app.flush();
  assert.match(app.layer.style.transform, /rotateX\(0deg\) rotateY\(0deg\)/);
});

test('touch ignores pointer tilt and uses a gentler scroll displacement', () => {
  const desktop = setup();
  const mobile = setup({ fine: false });
  for (const app of [desktop, mobile]) { app.scene.rect.top = -200; app.visible(true); app.flush(); }
  assert.match(desktop.layer.style.transform, /12\.00px/);
  assert.match(mobile.layer.style.transform, /6\.00px/);
  mobile.emit('pointermove', { pointerType: 'touch', clientX: 300, clientY: 200 });
  assert.equal(mobile.frames.size, 0);
});

test('pause cancels pending work and resets layers; resume restores the scroll position', () => {
  const app = setup();
  app.visible(true);
  app.document.paused = true;
  app.emit('satao:motionchange');
  assert.equal(app.frames.size, 0);
  assert.equal(app.layer.style.transform, '');
  app.emit('scroll'); assert.equal(app.frames.size, 0);
  app.document.paused = false;
  app.emit('satao:motionchange'); app.flush();
  assert.match(app.layer.style.transform, /translate3d/);
});

test('reduced motion and hidden tabs never animate', () => {
  const app = setup({ reduced: true });
  app.visible(true); app.emit('scroll');
  assert.equal(app.frames.size, 0);
  app.media.reduced.matches = false; app.emit('reduced'); app.flush();
  app.document.hidden = true; app.emit('visibilitychange'); app.emit('scroll');
  assert.equal(app.frames.size, 0);
  assert.equal(app.layer.style.transform, '');
});

test('missing IntersectionObserver preserves the static mural', () => {
  const app = setup({ observer: false });
  app.emit('scroll'); app.emit('pointermove');
  assert.equal(app.frames.size, 0);
  assert.equal(app.layer.style.transform, undefined);
});
