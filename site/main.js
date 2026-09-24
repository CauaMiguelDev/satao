(function () {
  "use strict";

  /* ---- PWA: registra o service worker para funcionar offline/instalado ---- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduceMotion = motionPreference.matches;
  motionPreference.addEventListener("change", function (event) {
    reduceMotion = event.matches;
    if (reduceMotion) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
      document.querySelectorAll(".button").forEach(function (el) {
        el.style.removeProperty("--mag-x"); el.style.removeProperty("--mag-y");
      });
      if (aboutPhoto) aboutPhoto.style.removeProperty("transform");
      if (heroVideo) { videoPausedByUser = true; syncVideo(); }
    }
    onScroll();
  });

  // Efeitos contínuos só trabalham enquanto a seção está visível.
  function whileVisible(element, callback) {
    var visible = false;
    function sync() { callback(visible && !document.hidden && !reduceMotion); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }).observe(element);
    } else { visible = true; sync(); }
    document.addEventListener("visibilitychange", sync);
    motionPreference.addEventListener("change", sync);
  }
  document.querySelectorAll(".hero, .insta, .reach").forEach(function (section) {
    whileVisible(section, function (active) { section.classList.toggle("is-in-view", active); });
  });
  document.addEventListener("visibilitychange", function () {
    document.documentElement.classList.toggle("page-hidden", document.hidden);
  });

  /* ---- Reveal on scroll ---- */
  var revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  } else {
    // Ícones .icon-draw "se desenham": mede o traço real de cada forma e
    // prepara o stroke-dash para animar até 0 quando o card entra na tela.
    var drawSelector = "svg.icon-draw path, svg.icon-draw circle, svg.icon-draw rect, svg.icon-draw line";
    document.querySelectorAll(drawSelector).forEach(function (shape) {
      if (typeof shape.getTotalLength !== "function") return;
      var len;
      try { len = shape.getTotalLength(); } catch (e) { return; }
      if (!len) return;
      shape.style.strokeDasharray = len;
      shape.style.strokeDashoffset = len;
    });
    var drawIcons = function (root) {
      root.querySelectorAll(drawSelector).forEach(function (shape) {
        shape.style.strokeDashoffset = 0;
      });
    };
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          drawIcons(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  /* ---- Count-up numbers ---- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400, startTs = null;
    el.textContent = "0" + suffix;
    function step(ts) {
      if (startTs === null) startTs = ts;
      var p = Math.min((ts - startTs) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { countUp(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  var topbar = document.querySelector(".topbar");
  var toTop = document.querySelector("[data-to-top]");
  var footer = document.querySelector(".footer");
  var heroVideo = document.querySelector(".hero-art-video");
  var heroInner = document.querySelector(".hero-inner");
  var footerInView = false;

  /* ---- Condense on scroll + reading-progress bar + back-to-top ---- */
  var progress = document.querySelector("[data-progress]");
  var journey = document.querySelector(".timeline-list");
  var ticking = false;

  /* Parallax: o JS só publica o deslocamento em --py; o CSS decide como
     compor (alguns alvos já carregam um rotate próprio e não podem perdê-lo). */
  var parallaxItems = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  function paintParallax(vh) {
    for (var i = 0; i < parallaxItems.length; i++) {
      var el = parallaxItems[i];
      var r = el.getBoundingClientRect();
      // Fora da tela (com folga) não custa frame.
      if (r.bottom < -240 || r.top > vh + 240) continue;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.12;
      // Compensa a translação já aplicada para não criar feedback na medição.
      var offset = parseFloat(el.style.getPropertyValue("--py")) || 0;
      var center = r.top - offset + r.height / 2;
      var p = (center - vh / 2) / (vh / 2 + r.height / 2); // -1 .. 1
      el.style.setProperty("--py", (p * speed * 100).toFixed(1) + "px");
    }
  }

  function paintScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    var vh = window.innerHeight;
    if (topbar) topbar.classList.toggle("is-scrolled", y > 40);
    if (progress) {
      var max = document.documentElement.scrollHeight - vh;
      var ratio = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }
    if (toTop) toTop.classList.toggle("is-shown", y > vh * 0.7 && !footerInView);
    if (heroVideo && !reduceMotion && y < vh * 1.5) {
      var hp = Math.min(Math.max(y / vh, 0), 1);
      // Mais profundidade que antes: o fundo desce enquanto o texto sobe.
      heroVideo.style.transform = "translateY(" + (hp * 3).toFixed(2) + "%) scale(1.08)";
    }
    if (heroInner && !reduceMotion) {
      // Camada intermediária: o texto recolhe mais rápido que a rolagem,
      // abrindo espaço para a próxima seção e reforçando a profundidade.
      var hip = Math.min(Math.max(y / (vh * 0.82), 0), 1);
      heroInner.style.transform = "translate3d(0," + (hip * -3.2).toFixed(2) + "%,0)";
      heroInner.style.opacity = "1";
    }
    if (!reduceMotion && parallaxItems.length) paintParallax(vh);
    if (journey) {
      var jr = journey.getBoundingClientRect();
      journey.style.setProperty("--journey-progress", reduceMotion ? 1 : Math.min(1, Math.max(0, (vh * .68 - jr.top) / jr.height)).toFixed(4));
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(paintScroll); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  paintScroll();

  /* Vídeo: pausa explícita, fora da tela e com preferência por menos movimento. */
  var videoControl = document.querySelector(".video-control");
  var videoPausedByUser = reduceMotion;
  var videoInView = true;
  function syncVideo() {
    if (!heroVideo) return;
    if (videoPausedByUser || !videoInView || document.hidden) heroVideo.pause();
    else heroVideo.play().catch(function () {});
    if (videoControl) {
      var paused = heroVideo.paused;
      var lang = document.documentElement.lang;
      var labels = lang === "en" ? ["Pause video", "Play video"] : lang === "fr" ? ["Mettre la vidéo en pause", "Lire la vidéo"] : ["Pausar vídeo", "Reproduzir vídeo"];
      videoControl.setAttribute("aria-pressed", String(paused));
      videoControl.setAttribute("aria-label", labels[paused ? 1 : 0]);
    }
  }
  if (heroVideo && videoControl) {
    videoControl.removeAttribute("data-i18n-aria");
    videoControl.addEventListener("click", function () { videoPausedByUser = !videoPausedByUser; syncVideo(); });
    heroVideo.addEventListener("play", syncVideo);
    heroVideo.addEventListener("pause", syncVideo);
    document.addEventListener("visibilitychange", syncVideo);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (entries) {
      videoInView = entries[0].isIntersecting;
      syncVideo();
    }).observe(heroVideo);
    syncVideo();
  }

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }
  if (footer && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      footerInView = entries[0].isIntersecting;
      paintScroll();
    }, { threshold: 0 }).observe(footer);
  }

  /* ---- Scrollspy: highlight the section in view ---- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('#primary-nav a[href^="#"]:not(.nav-cta)')
  );
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);
  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
    syncNavIndicator();
  }
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---- Mobile menu ---- */
  var navToggle = document.querySelector(".nav-toggle");
  var primaryNav = document.getElementById("primary-nav");
  var scrim = document.querySelector("[data-scrim]");
  if (topbar && navToggle && primaryNav) {
    var toggleLabel = navToggle.querySelector(".sr-only");
    var setLabel = function (text) { if (toggleLabel) toggleLabel.textContent = text; };

    var openNav = function () {
      topbar.classList.add("nav-open");
      navToggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-lock");
      setLabel(translate("menu.close") || "Fechar menu");
    };
    var closeNav = function () {
      if (!topbar.classList.contains("nav-open")) return;
      topbar.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-lock");
      setLabel(translate("menu.open") || "Abrir menu");
    };

    navToggle.addEventListener("click", function () {
      if (topbar.classList.contains("nav-open")) closeNav(); else openNav();
    });
    primaryNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });
    if (scrim) scrim.addEventListener("click", closeNav);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });

    // Close the menu if the viewport grows past the mobile breakpoint.
    var desktopMq = window.matchMedia("(min-width: 1024px)");
    var onBreakpoint = function (event) { if (event.matches) closeNav(); };
    if (desktopMq.addEventListener) desktopMq.addEventListener("change", onBreakpoint);
    else if (desktopMq.addListener) desktopMq.addListener(onBreakpoint);
  }

  /* ---- Indicador deslizante do nav (desktop): um traço só, que segue o
     hover/foco e volta para o link ativo. Só existe acima de 1024px (CSS
     esconde em telas menores), então some cedo se não houver o que medir. */
  var navIndicator = document.querySelector(".nav-indicator");
  function syncNavIndicator() {
    if (!navIndicator || !primaryNav) return;
    var active = primaryNav.querySelector("a.is-active:not(.nav-cta)");
    moveNavIndicator(active);
  }
  function moveNavIndicator(link) {
    if (!navIndicator) return;
    if (!link || navIndicator.offsetParent === null) {
      navIndicator.classList.remove("is-ready");
      return;
    }
    var label = link.querySelector(".navlink-label") || link;
    var navRect = primaryNav.getBoundingClientRect();
    var labelRect = label.getBoundingClientRect();
    navIndicator.style.transform =
      "translateX(" + (labelRect.left - navRect.left).toFixed(2) + "px) scaleX(" + labelRect.width.toFixed(2) + ")";
    navIndicator.classList.add("is-ready");
  }
  if (navIndicator && primaryNav && navLinks.length) {
    navLinks.forEach(function (a) {
      a.addEventListener("mouseenter", function () { moveNavIndicator(a); });
      a.addEventListener("focus", function () { moveNavIndicator(a); });
    });
    primaryNav.addEventListener("mouseleave", syncNavIndicator);
    primaryNav.addEventListener("focusout", function (event) {
      if (!primaryNav.contains(event.relatedTarget)) syncNavIndicator();
    });
    window.addEventListener("resize", syncNavIndicator);
    syncNavIndicator();
  }

  /* ---- Cursor-follow glow (Atuação) ---- */
  var atuacao = document.querySelector(".atuacao");
  if (atuacao && !reduceMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    var gx = 50, gy = 50, tx = 50, ty = 50, glowRAF = null;
    var glowStep = function () {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      atuacao.style.setProperty("--mx", gx.toFixed(2) + "%");
      atuacao.style.setProperty("--my", gy.toFixed(2) + "%");
      if (Math.abs(tx - gx) > 0.1 || Math.abs(ty - gy) > 0.1) {
        glowRAF = window.requestAnimationFrame(glowStep);
      } else { glowRAF = null; }
    };
    atuacao.addEventListener("mousemove", function (e) {
      var r = atuacao.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (glowRAF === null) glowRAF = window.requestAnimationFrame(glowStep);
    });
  }

  /* ---- Custom cursor: exact dot + lerping ring ---- */
  var finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var cDot = document.querySelector(".cursor-dot");
  var cRing = document.querySelector(".cursor-ring");
  if (cDot && cRing && finePointer && !reduceMotion) {
    var root = document.documentElement;
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my, started = false, cursorRAF = null;
    var interactive = "a,button,[role=button],input,textarea,select,.atuacao-card,.agenda-item,.inline-link,.hero-scroll,.gallery-item,.about-frame";

    document.addEventListener("mousemove", function (e) {
      if (reduceMotion) return;
      mx = e.clientX; my = e.clientY;
      if (cursorRAF === null) cursorRAF = window.requestAnimationFrame(cursorLoop);
      cDot.style.transform = "translate(" + mx + "px," + my + "px)";
      if (!started) {
        started = true;
        document.body.classList.add("has-cursor");
        root.classList.add("cursor-ready");
      }
      root.classList.remove("cursor-hidden");
    }, { passive: true });

    document.addEventListener("mouseleave", function () { root.classList.add("cursor-hidden"); });
    document.addEventListener("mousedown", function () { cRing.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { cRing.classList.remove("is-down"); });
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(interactive)) cRing.classList.add("is-interactive");
    });
    document.addEventListener("pointerout", function (e) {
      if (!e.target.closest || !e.target.closest(interactive)) return;
      var to = e.relatedTarget;
      if (!to || !to.closest || !to.closest(interactive)) cRing.classList.remove("is-interactive");
    });

    var cursorLoop = function () {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      cRing.style.transform = "translate(" + rx.toFixed(2) + "px," + ry.toFixed(2) + "px)";
      cursorRAF = null;
      if (!document.hidden && !reduceMotion && (Math.abs(mx - rx) > .1 || Math.abs(my - ry) > .1)) {
        cursorRAF = window.requestAnimationFrame(cursorLoop);
      }
    };
  }

  /* ---- Retrato "Sobre o artista": tilt 3D que segue o cursor ---- */
  var aboutFrame = document.querySelector(".about-frame");
  var aboutPhoto = document.querySelector(".about-photo");
  if (aboutFrame && aboutPhoto && !reduceMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    var abTargetX = 0, abTargetY = 0, abTargetS = 1;
    var abCurX = 0, abCurY = 0, abCurS = 1, abRAF = null;
    var abStep = function () {
      if (reduceMotion) { aboutPhoto.style.removeProperty("transform"); abRAF = null; return; }
      abCurX += (abTargetX - abCurX) * 0.14;
      abCurY += (abTargetY - abCurY) * 0.14;
      abCurS += (abTargetS - abCurS) * 0.14;
      aboutPhoto.style.transform =
        "rotate(1.6deg) perspective(900px) rotateX(" + abCurY.toFixed(2) + "deg) rotateY(" + abCurX.toFixed(2) + "deg) scale(" + abCurS.toFixed(3) + ")";
      var settled = Math.abs(abTargetX - abCurX) < 0.05 && Math.abs(abTargetY - abCurY) < 0.05 && Math.abs(abTargetS - abCurS) < 0.001;
      if (!settled) abRAF = window.requestAnimationFrame(abStep);
      else abRAF = null;
    };
    aboutFrame.addEventListener("mousemove", function (e) {
      var r = aboutFrame.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      abTargetX = px * 14;
      abTargetY = py * -12;
      abTargetS = 1.035;
      if (abRAF === null) abRAF = window.requestAnimationFrame(abStep);
    });
    aboutFrame.addEventListener("mouseleave", function () {
      abTargetX = 0; abTargetY = 0; abTargetS = 1;
      if (abRAF === null) abRAF = window.requestAnimationFrame(abStep);
    });
  }

  /* ---- Botões: mesmo vocabulário em todo lugar ----
     Magnético (puxa na direção do cursor) + brilho de clique (spray),
     aplicados a todo .button, não só aos CTAs que já tinham. */
  var allButtons = Array.prototype.slice.call(document.querySelectorAll(".button"));
  if (allButtons.length && !reduceMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    allButtons.forEach(function (btn) {
      var mRAF = null, curX = 0, curY = 0, tgtX = 0, tgtY = 0;
      var mStep = function () {
        if (reduceMotion || btn.disabled) { mRAF = null; return; }
        curX += (tgtX - curX) * 0.18;
        curY += (tgtY - curY) * 0.18;
        btn.style.setProperty("--mag-x", curX.toFixed(2) + "px");
        btn.style.setProperty("--mag-y", curY.toFixed(2) + "px");
        if (Math.abs(tgtX - curX) > 0.1 || Math.abs(tgtY - curY) > 0.1) {
          mRAF = window.requestAnimationFrame(mStep);
        } else { mRAF = null; }
      };
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        tgtX = ((e.clientX - r.left) / r.width - 0.5) * 13;
        tgtY = ((e.clientY - r.top) / r.height - 0.5) * 8;
        if (mRAF === null) mRAF = window.requestAnimationFrame(mStep);
      });
      btn.addEventListener("mouseleave", function () {
        tgtX = 0; tgtY = 0;
        if (mRAF === null) mRAF = window.requestAnimationFrame(mStep);
      });
    });
  }
  if (allButtons.length && !reduceMotion) {
    allButtons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (reduceMotion || btn.disabled) return;
        var r = btn.getBoundingClientRect();
        btn.style.setProperty("--click-x", (e.detail ? e.clientX - r.left : r.width / 2).toFixed(1) + "px");
        btn.style.setProperty("--click-y", (e.detail ? e.clientY - r.top : r.height / 2).toFixed(1) + "px");
        btn.classList.remove("is-clicked");
        void btn.offsetWidth; // reinicia a animação em cliques seguidos
        btn.classList.add("is-clicked");
      });
      btn.addEventListener("animationend", function (e) {
        if (e.animationName === "button-spray") btn.classList.remove("is-clicked");
      });
    });
  }

  /* ---- Kinetic ticker: seamless, sempre preenchido + boost pelo scroll ---- */
  var ticker = document.querySelector(".ticker");
  var track = document.querySelector(".ticker-track");
  if (ticker && track) {
    // Coleta as palavras já presentes no markup (preserva acentos/conteúdo).
    var tSpans = track.querySelectorAll("span");
    var words = [], seen = {};
    for (var wi = 0; wi < tSpans.length; wi++) {
      var wt = tSpans[wi].textContent.trim();
      if (!wt || seen[wt]) break;
      seen[wt] = true; words.push(wt);
    }
    if (!words.length) words = ["GRAFITE", "HIP HOP", "CEILÂNDIA", "BRASÍLIA", "MEMÓRIA URBANA"];

    var groupHTML = '<span class="ticker-group">';
    for (var gi = 0; gi < words.length; gi++) groupHTML += "<span>" + words[gi] + "</span><i></i>";
    groupHTML += "</span>";

    var unit = 0;
    var buildTicker = function () {
      track.style.animation = "none";
      track.innerHTML = groupHTML;
      var first = track.firstElementChild;
      unit = first ? first.getBoundingClientRect().width : 0;
      // Duplica os grupos até cobrir com folga a largura da tela (sem vãos).
      var need = window.innerWidth * 2 + unit;
      var guard = 0;
      while (unit > 0 && track.scrollWidth < need && guard < 60) {
        track.insertAdjacentHTML("beforeend", groupHTML);
        guard++;
      }
    };
    buildTicker();

    if (!reduceMotion && unit > 0) {
      track.style.willChange = "transform";
      var pos = 0, base = 44, boost = 0, paused = false, last = null, tickerRAF = null, tickerActive = false;
      var prevY = window.scrollY || window.pageYOffset || 0;

      window.addEventListener("resize", function () { buildTicker(); pos = 0; last = null; });
      if (window.matchMedia("(hover:hover)").matches) {
        ticker.addEventListener("mouseenter", function () { paused = true; });
        ticker.addEventListener("mouseleave", function () { paused = false; });
      }
      window.addEventListener("scroll", function () {
        var y = window.scrollY || window.pageYOffset || 0;
        boost = Math.min(boost + Math.abs(y - prevY) * 0.85, 560);
        prevY = y;
      }, { passive: true });

      var tickerLoop = function (ts) {
        if (last === null) last = ts;
        var dt = Math.min((ts - last) / 1000, 0.05); last = ts;
        boost *= 0.92;
        var speed = paused ? 0 : base + boost;
        pos -= speed * dt;
        if (unit > 0) { while (pos <= -unit) pos += unit; }
        track.style.transform = "translateX(" + pos.toFixed(2) + "px)";
        tickerRAF = tickerActive ? window.requestAnimationFrame(tickerLoop) : null;
      };
      whileVisible(ticker, function (active) {
        tickerActive = active;
        if (tickerRAF !== null) window.cancelAnimationFrame(tickerRAF);
        tickerRAF = null; last = null;
        track.style.willChange = active ? "transform" : "auto";
        if (active) tickerRAF = window.requestAnimationFrame(tickerLoop);
      });
    }
  }

  /* ---- Galeria: filtro por categoria + lightbox ----
     Os itens iniciais vêm do HTML estático; itens vindos do Supabase
     (site/community.js, carregados de forma assíncrona) chegam depois
     que este bloco já rodou, então tudo aqui é pensado para ser
     re-executável via window.SATAO_REGISTER_GALLERY_ITEMS em vez de
     capturar um snapshot fixo do DOM. */
  var galleryFilters = Array.prototype.slice.call(document.querySelectorAll(".gallery-filter"));
  var galleryGrid = document.querySelector(".gallery-grid");
  var galleryItems = [];
  var allGalleryImgs = [];
  var galleryImgs = [];
  var activeGalleryFilter = "all";

  function refreshVisibleGalleryImgs() {
    galleryImgs = allGalleryImgs.filter(function (img) {
      var fig = img.closest("figure");
      return fig && !fig.classList.contains("is-hidden");
    });
  }

  function applyGalleryFilter(cat) {
    activeGalleryFilter = cat;
    if (galleryGrid) galleryGrid.classList.toggle("is-filtered", cat !== "all");
    var shown = 0;
    galleryItems.forEach(function (item) {
      var show = cat === "all" || item.getAttribute("data-cat") === cat;
      item.classList.toggle("is-hidden", !show);
      item.classList.remove("is-entering");
      if (show) {
        item.style.setProperty("--stagger", Math.min(shown, 6) * 30 + "ms");
        shown++;
      }
    });
    if (galleryGrid) void galleryGrid.offsetWidth; // força reflow p/ reiniciar a animação de entrada
    if (!reduceMotion) {
      galleryItems.forEach(function (item) {
        if (!item.classList.contains("is-hidden")) item.classList.add("is-entering");
      });
    }
    refreshVisibleGalleryImgs();
  }

  if (galleryFilters.length) {
    galleryFilters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        galleryFilters.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        applyGalleryFilter(btn.getAttribute("data-filter"));
      });
    });
  }

  var lb, lbImg, lbCap, lbIndex = -1, lbLastFocus = null;
  function showImg(i) {
    if (!galleryImgs.length) return;
    lbIndex = (i + galleryImgs.length) % galleryImgs.length;
    var src = galleryImgs[lbIndex];
    if (!reduceMotion && lbImg.animate) {
      lbImg.getAnimations().forEach(function (animation) { animation.cancel(); });
      lbImg.animate([{ opacity: .35, transform: "scale(.985)" }, { opacity: 1, transform: "scale(1)" }], { duration: 240, easing: "cubic-bezier(.16,1,.3,1)" });
    }
    lbImg.setAttribute("src", src.currentSrc || src.src);
    lbImg.setAttribute("alt", src.getAttribute("alt") || "");
    var fig = src.closest("figure");
    var cap = fig ? fig.querySelector("figcaption") : null;
    lbCap.textContent = cap ? cap.textContent : "";
  }
  function openLb(i) {
    lbLastFocus = document.activeElement;
    showImg(i);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-lock");
    lb.querySelector(".lightbox-close").focus();
  }
  function closeLb() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-lock");
    if (lbLastFocus && lbLastFocus.focus) lbLastFocus.focus();
  }
  function ensureLightbox() {
    if (lb) return;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Galeria");
    lb.setAttribute("aria-hidden", "true");
    lb.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Fechar galeria" data-i18n-aria="aria.closeGallery">×</button>' +
      '<button class="lightbox-nav lightbox-prev" type="button" aria-label="Imagem anterior" data-i18n-aria="aria.prevImg">‹</button>' +
      '<figure class="lightbox-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lightbox-nav lightbox-next" type="button" aria-label="Próxima imagem" data-i18n-aria="aria.nextImg">›</button>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector(".lightbox-fig img");
    lbCap = lb.querySelector(".lightbox-fig figcaption");
    lb.querySelector(".lightbox-close").addEventListener("click", closeLb);
    lb.querySelector(".lightbox-prev").addEventListener("click", function (e) { e.stopPropagation(); showImg(lbIndex - 1); });
    lb.querySelector(".lightbox-next").addEventListener("click", function (e) { e.stopPropagation(); showImg(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Tab") {
        var controls = Array.prototype.slice.call(lb.querySelectorAll("button"));
        var index = controls.indexOf(document.activeElement);
        e.preventDefault();
        controls[(index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
      }
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") showImg(lbIndex - 1);
      else if (e.key === "ArrowRight") showImg(lbIndex + 1);
    });
  }

  // Registra figuras .gallery-item (estáticas no load, ou anexadas depois
  // pelo Supabase) no filtro e no lightbox. Idempotente por figura.
  window.SATAO_REGISTER_GALLERY_ITEMS = function (figures) {
    if (!figures || !figures.length) return;
    ensureLightbox();
    figures.forEach(function (fig) {
      if (galleryItems.indexOf(fig) !== -1) return;
      galleryItems.push(fig);
      var cat = fig.getAttribute("data-cat");
      fig.classList.toggle("is-hidden", activeGalleryFilter !== "all" && cat !== activeGalleryFilter);
      var img = fig.querySelector("img");
      if (!img) return;
      allGalleryImgs.push(img);
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.addEventListener("click", function () { img.focus(); openLb(galleryImgs.indexOf(img)); });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(galleryImgs.indexOf(img)); }
      });
    });
    refreshVisibleGalleryImgs();
  };

  window.SATAO_REGISTER_GALLERY_ITEMS(Array.prototype.slice.call(document.querySelectorAll(".gallery-item")));

  /* ---- Idioma: PT (padrão) / EN / FR ---- */
  var currentLang = "pt";
  function translate(key) {
    if (currentLang === "pt") return undefined;
    var dict = window.SATAO_I18N && window.SATAO_I18N[currentLang];
    return dict ? dict[key] : undefined;
  }
  var i18nItems = [];
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    var isHtml = el.hasAttribute("data-i18n-html");
    i18nItems.push({ el: el, key: key, isHtml: isHtml, pt: isHtml ? el.innerHTML : el.textContent });
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
    var key = el.getAttribute("data-i18n-aria");
    i18nItems.push({ el: el, key: key, attr: "aria-label", pt: el.getAttribute("aria-label") });
  });
  var langButtons = Array.prototype.slice.call(document.querySelectorAll(".lang-btn"));
  var langIndicator = document.querySelector(".lang-indicator");
  function moveLangIndicator() {
    if (!langIndicator) return;
    var active = langButtons.filter(function (b) { return b.classList.contains("is-active"); })[0];
    if (!active) return;
    var trackRect = langIndicator.parentElement.getBoundingClientRect();
    var btnRect = active.getBoundingClientRect();
    langIndicator.style.transform =
      "translateX(" + (btnRect.left - trackRect.left).toFixed(2) + "px) scaleX(" + btnRect.width.toFixed(2) + ")";
  }
  function applyLang(lang) {
    currentLang = lang;
    window.SATAO_LANG = lang; // lido pelos widgets de comunidade/avaliação para status dinâmicos
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    var dict = (lang !== "pt" && window.SATAO_I18N && window.SATAO_I18N[lang]) || {};
    i18nItems.forEach(function (item) {
      var val = lang === "pt" || dict[item.key] === undefined ? item.pt : dict[item.key];
      if (item.attr) item.el.setAttribute(item.attr, val);
      else if (item.isHtml) item.el.innerHTML = val;
      else item.el.textContent = val;
    });
    langButtons.forEach(function (b) {
      var active = b.getAttribute("data-lang") === lang;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    moveLangIndicator();
    syncVideo();
    try { localStorage.setItem("satao-lang", lang); } catch (e) {}
  }
  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { applyLang(btn.getAttribute("data-lang")); });
  });
  window.addEventListener("resize", moveLangIndicator);
  moveLangIndicator();
  var savedLang = "pt";
  try { savedLang = localStorage.getItem("satao-lang") || "pt"; } catch (e) {}
  if (savedLang !== "pt" && window.SATAO_I18N && window.SATAO_I18N[savedLang]) applyLang(savedLang);

  /* ---- Ano civil do copyright ---- */
  var copyrightYear = document.querySelector("#copyright-year");
  if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

  /* ---- Âncoras: foco lógico na seção de destino após a navegação ---- */
  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
})();
