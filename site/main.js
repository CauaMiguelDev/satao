(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Reveal on scroll ---- */
  var revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  var topbar = document.querySelector(".topbar");
  var toTop = document.querySelector("[data-to-top]");
  var footer = document.querySelector(".footer");
  var footerInView = false;
  var heroInner = document.querySelector(".hero-inner");

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
    if (heroInner && !reduceMotion) {
      var vh = window.innerHeight || 1;
      var hp = Math.min(y / vh, 1);
      heroInner.style.transform = "translateY(" + (hp * -64).toFixed(1) + "px)";
      heroInner.style.opacity = Math.max(1 - hp * 1.15, 0).toFixed(3);
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
})();
