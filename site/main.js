const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

const scrollProgress = document.querySelector(".scroll-progress");
if (scrollProgress) {
  let progressTicking = false;
  const updateProgress = () => {
    progressTicking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    scrollProgress.style.width = `${pct}%`;
  };
  window.addEventListener("scroll", () => {
    if (!progressTicking) {
      progressTicking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();
}

const magnets = document.querySelectorAll(".magnetic");
if (magnets.length && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  magnets.forEach((el) => {
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
  });
}

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

const heroArt = document.querySelector(".hero-art");
const sprayLayer = document.querySelector(".hero-spray-layer");
if (heroArt && sprayLayer && !reduceMotion) {
  const sprayColors = ["var(--red)", "var(--red-hot)", "var(--paper)"];
  let lastX = null, lastY = null;

  const spawnDot = (x, y, size) => {
    const dot = document.createElement("span");
    dot.className = "spray-dot";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.setProperty("--s", `${size}px`);
    dot.style.background = sprayColors[Math.floor(Math.random() * sprayColors.length)];
    dot.style.opacity = String(0.35 + Math.random() * 0.3);
    sprayLayer.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  };

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    heroArt.addEventListener("pointermove", (event) => {
      const { left, top } = heroArt.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;
      if (lastX !== null) {
        const dist = Math.hypot(x - lastX, y - lastY);
        if (dist < 16) return;
      }
      lastX = x; lastY = y;
      spawnDot(x, y, 6 + Math.random() * 12);
    });
  }

  heroArt.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    const { left, top } = heroArt.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 30;
      spawnDot(x + Math.cos(a) * d, y + Math.sin(a) * d, 6 + Math.random() * 14);
    }
  });
}

const legacyWall = document.querySelector(".legacy-wall");
if (legacyWall && !reduceMotion) {
  let ticking = false;
  const updateParallax = () => {
    ticking = false;
    const rect = legacyWall.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    const y = Math.max(-40, Math.min(40, progress * -60));
    legacyWall.style.setProperty("--parallax-y", `${y}px`);
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });
  updateParallax();
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
