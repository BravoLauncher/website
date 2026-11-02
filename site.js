/* Bravo Launcher site: theme toggle, mobile menu, scroll reveal, screenshot gallery.
   No dependencies, no network requests. Every feature degrades to plain HTML without it. */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- theme ---------- */
  var themeBtn = document.querySelector(".theme-toggle");
  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  function syncThemeLabel() {
    if (!themeBtn) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    themeBtn.setAttribute("aria-label", "Switch to " + next + " theme");
    themeBtn.title = "Switch to " + next + " theme";
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncThemeLabel();
    });
    syncThemeLabel();
  }

  /* ---------- mobile menu ---------- */
  var header = document.querySelector(".site-header");
  var menuBtn = document.querySelector(".menu-btn");
  function setMenu(open) {
    if (!header || !menuBtn) return;
    header.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      setMenu(!header.classList.contains("open"));
    });
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("open")) { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (header.classList.contains("open") && !header.contains(e.target)) setMenu(false);
    });
  }

  /* ---------- shared header links ----------
     Every page carries the same header, so its section links read "index.html#x".
     On the landing page itself, scroll in place instead of reloading the page. */
  if (document.querySelector(".hero")) {
    document.querySelectorAll('a[href^="index.html#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice("index.html#".length);
        var target = document.getElementById(id);
        if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        target.scrollIntoView();
        if (history.pushState) history.pushState(null, "", "#" + id);
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- gallery strip ---------- */
  var strip = document.querySelector(".gallery");
  if (!strip) return;
  var prev = document.querySelector(".g-prev");
  var next = document.querySelector(".g-next");
  function step() { return Math.max(260, strip.clientWidth * 0.8); }
  function syncArrows() {
    if (!prev || !next) return;
    prev.disabled = strip.scrollLeft < 8;
    next.disabled = strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 8;
  }
  if (prev) prev.addEventListener("click", function () { strip.scrollBy({ left: -step(), behavior: "smooth" }); });
  if (next) next.addEventListener("click", function () { strip.scrollBy({ left: step(), behavior: "smooth" }); });
  strip.addEventListener("scroll", syncArrows, { passive: true });
  window.addEventListener("resize", syncArrows);
  syncArrows();

  /* ---------- lightbox ---------- */
  var box = document.querySelector(".lightbox");
  if (!box || typeof box.showModal !== "function") return;
  var shots = Array.prototype.slice.call(strip.querySelectorAll(".shot img"));
  var boxImg = box.querySelector("img");
  var caption = box.querySelector("figcaption");
  var index = 0;

  /* shows the strip's small image at once, then swaps in the full size (data-full),
     which is only downloaded when someone actually opens the viewer */
  function show(i) {
    index = (i + shots.length) % shots.length;
    var thumb = shots[index];
    var full = thumb.dataset.full;
    boxImg.style.setProperty("--ar", thumb.getAttribute("width") / thumb.getAttribute("height"));
    boxImg.src = thumb.currentSrc || thumb.src;
    boxImg.alt = thumb.alt;
    caption.textContent = thumb.alt + "  ·  " + (index + 1) + " / " + shots.length;
    if (full) {
      var shown = index;
      var big = new Image();
      big.onload = function () { if (shown === index) boxImg.src = full; };
      big.src = full;
    }
  }
  shots.forEach(function (img, i) {
    img.closest(".shot").addEventListener("click", function () { show(i); box.showModal(); });
  });
  box.querySelector(".lb-close").addEventListener("click", function () { box.close(); });
  box.querySelector(".lb-prev").addEventListener("click", function () { show(index - 1); });
  box.querySelector(".lb-next").addEventListener("click", function () { show(index + 1); });
  box.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });
  /* click on the dimmed area (not the image or a button) closes */
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target.tagName === "FIGURE") box.close();
  });
  box.addEventListener("close", function () {
    var btn = shots[index] && shots[index].closest(".shot");
    if (btn) btn.focus({ preventScroll: true });
  });
  /* swipe between screenshots on touch screens */
  var startX = null;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
