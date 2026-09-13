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

  /* ---- Condense on scroll + reading-progress bar ---- */
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
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(paintScroll); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  paintScroll();

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
