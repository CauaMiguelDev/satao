const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  revealItems.forEach((item) => observer.observe(item));
}

// Hero: generative "wall" texture — abstract, brand-colored, drawn once.
// Marks cluster toward the upper-right so the headline (lower-left) stays clean.
const heroCanvas = document.querySelector(".hero-canvas");
if (heroCanvas && heroCanvas.getContext) {
  const ctx = heroCanvas.getContext("2d");
  const C = { red: "#d91620", inkD: "#14090b", paper: "#f2e8dd", hot: "#ff5c5c" };
  const rand = (a, b) => a + Math.random() * (b - a);
  const dot = (x, y, r, c, a) => { ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; };
  const ring = (x, y, r, c, lw, a) => { ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 1; };
  const seg = (x1, y1, x2, y2, c, lw, a) => { ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalAlpha = 1; };

  const drawHero = () => {
    const w = heroCanvas.clientWidth, h = heroCanvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    heroCanvas.width = Math.round(w * dpr);
    heroCanvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.red;
    ctx.fillRect(0, 0, w, h);

    const nx = w * 0.82, ny = h * 0.18, s = Math.min(w, h);

    // Concentric transmission rings around a focal node.
    for (let i = 0; i < 8; i++) ring(nx, ny, 42 + i * (s * 0.055), i % 2 ? C.paper : C.inkD, i < 2 ? 1.6 : 1, Math.max(0.03, 0.12 - i * 0.009));
    for (let a = 0; a < 6.2832; a += 0.32) { const r1 = s * 0.09, r2 = r1 + 22 + Math.sin(a * 6) * 10; seg(nx + Math.cos(a) * r1, ny + Math.sin(a) * r1, nx + Math.cos(a) * r2, ny + Math.sin(a) * r2, C.inkD, 1, 0.12); }
    dot(nx, ny, 6, C.inkD, 0.5); dot(nx, ny, 3, C.paper, 0.85);

    // Bold diagonal strokes across the top — tags / scratches on a wall.
    seg(w * 0.52, -20, w * 1.03, h * 0.42, C.inkD, 2, 0.16);
    seg(w * 0.6, -20, w * 1.03, h * 0.3, C.paper, 1, 0.13);
    seg(-20, h * 0.06, w * 0.42, -20, C.inkD, 1.5, 0.1);

    // Paint drips from the top edge.
    [[0.18, 0.13], [0.33, 0.08], [0.71, 0.17], [0.9, 0.1]].forEach(([fx, fh]) => {
      const x = w * fx, len = h * fh, wdt = rand(3, 6);
      ctx.globalAlpha = 0.11; ctx.fillStyle = C.inkD; ctx.fillRect(x, 0, wdt, len);
      dot(x + wdt / 2, len, wdt * 0.9, C.inkD, 0.11); ctx.globalAlpha = 1;
    });

    // Spray cloud radiating from the node.
    for (let i = 0; i < 460; i++) {
      const a = rand(0, 6.2832), rr = Math.pow(Math.random(), 0.6) * s * 0.55;
      const x = nx + Math.cos(a) * rr, y = ny + Math.sin(a) * rr * 0.72;
      if (x < 0 || x > w || y < 0 || y > h) continue;
      const f = 1 - rr / (s * 0.55);
      dot(x, y, rand(0.4, 1.7), Math.random() < 0.5 ? C.inkD : C.paper, f * 0.12);
    }

    // A couple of accent nodes low on the field.
    dot(w * 0.14, h * 0.7, 3.5, C.hot, 0.55); ring(w * 0.14, h * 0.7, 11, C.hot, 1, 0.3);
    dot(w * 0.42, h * 0.86, 2.5, C.paper, 0.4);
  };

  drawHero();
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawHero, 150); });
}

const topbar = document.querySelector(".topbar");
const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.getElementById("primary-nav");
if (topbar && navToggle && primaryNav) {
  const closeNav = () => {
    topbar.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  };
  navToggle.addEventListener("click", () => {
    const isOpen = topbar.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  primaryNav.addEventListener("click", (event) => {
    if (event.target.tagName === "A") closeNav();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });
}
