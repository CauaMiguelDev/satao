(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    }, { threshold: 0.16 });
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
  var footerInView = false;

  /* ---- Condense on scroll + reading-progress bar + back-to-top ---- */
  var progress = document.querySelector("[data-progress]");
  var ticking = false;
  function paintScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    if (topbar) topbar.classList.toggle("is-scrolled", y > 40);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }
    if (toTop) toTop.classList.toggle("is-shown", y > window.innerHeight * 0.7 && !footerInView);
    if (heroVideo && !reduceMotion) {
      var hp = Math.min(Math.max(y / window.innerHeight, 0), 1);
      heroVideo.style.transform = "translateY(" + (hp * 3).toFixed(2) + "%) scale(" + (1 + hp * 0.1).toFixed(4) + ")";
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(paintScroll); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  paintScroll();

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
      setLabel("Fechar menu");
    };
    var closeNav = function () {
      if (!topbar.classList.contains("nav-open")) return;
      topbar.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-lock");
      setLabel("Abrir menu");
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
    var desktopMq = window.matchMedia("(min-width: 761px)");
    var onBreakpoint = function (event) { if (event.matches) closeNav(); };
    if (desktopMq.addEventListener) desktopMq.addEventListener("change", onBreakpoint);
    else if (desktopMq.addListener) desktopMq.addListener(onBreakpoint);
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
    var rx = mx, ry = my, started = false;
    var interactive = "a,button,[role=button],input,textarea,select,.atuacao-card,.agenda-item,.inline-link,.hero-scroll,.gallery-item,.about-frame";

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
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
      window.requestAnimationFrame(cursorLoop);
    };
    window.requestAnimationFrame(cursorLoop);
  }

  /* ---- Retrato "Sobre o artista": tilt 3D que segue o cursor ---- */
  var aboutFrame = document.querySelector(".about-frame");
  var aboutPhoto = document.querySelector(".about-photo");
  if (aboutFrame && aboutPhoto && !reduceMotion && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    var abTargetX = 0, abTargetY = 0, abTargetS = 1;
    var abCurX = 0, abCurY = 0, abCurS = 1, abRAF = null;
    var abStep = function () {
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
      var pos = 0, base = 44, boost = 0, paused = false, last = null;
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
        var speed = (paused ? 0 : base) + boost;
        pos -= speed * dt;
        if (unit > 0) { while (pos <= -unit) pos += unit; }
        track.style.transform = "translateX(" + pos.toFixed(2) + "px)";
        window.requestAnimationFrame(tickerLoop);
      };
      window.requestAnimationFrame(tickerLoop);
    }
  }

  /* ---- Lightbox da galeria (clicar para ampliar) ---- */
  var galleryImgs = Array.prototype.slice.call(document.querySelectorAll(".gallery-item img"));
  if (galleryImgs.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("aria-hidden", "true");
    lb.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Fechar galeria">×</button>' +
      '<button class="lightbox-nav lightbox-prev" type="button" aria-label="Imagem anterior">‹</button>' +
      '<figure class="lightbox-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lightbox-nav lightbox-next" type="button" aria-label="Próxima imagem">›</button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector(".lightbox-fig img");
    var lbCap = lb.querySelector(".lightbox-fig figcaption");
    var lbIndex = -1, lbLastFocus = null;
    var showImg = function (i) {
      lbIndex = (i + galleryImgs.length) % galleryImgs.length;
      var src = galleryImgs[lbIndex];
      lbImg.setAttribute("src", src.currentSrc || src.src);
      lbImg.setAttribute("alt", src.getAttribute("alt") || "");
      var fig = src.closest("figure");
      var cap = fig ? fig.querySelector("figcaption") : null;
      lbCap.textContent = cap ? cap.textContent : "";
    };
    var openLb = function (i) {
      lbLastFocus = document.activeElement;
      showImg(i);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.classList.add("nav-lock");
      lb.querySelector(".lightbox-close").focus();
    };
    var closeLb = function () {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-lock");
      if (lbLastFocus && lbLastFocus.focus) lbLastFocus.focus();
    };
    galleryImgs.forEach(function (img, i) {
      img.addEventListener("click", function () { openLb(i); });
    });
    lb.querySelector(".lightbox-close").addEventListener("click", closeLb);
    lb.querySelector(".lightbox-prev").addEventListener("click", function (e) { e.stopPropagation(); showImg(lbIndex - 1); });
    lb.querySelector(".lightbox-next").addEventListener("click", function (e) { e.stopPropagation(); showImg(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") showImg(lbIndex - 1);
      else if (e.key === "ArrowRight") showImg(lbIndex + 1);
    });
  }
})();
