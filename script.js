/* ==========================================================
   Adhisha & Shivasheesh — invitation behaviour
   - Opening cover (envelope) with "Open" seal
   - Story-style progress bar + active nav link
   - Scroll reveal
   - Countdown to 10 Dec 2026, 7:00 PM IST
   - Background music toggle (starts after the Open tap)
   ========================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Opening cover ---------- */
  var intro = $("#intro");
  var openBtn = $("#openInvite");
  var audio = $("#bgm");
  var musicBtn = $("#musicBtn");
  var musicLabel = $("#musicLabel");
  var heroTitle = $("#weddingTitle");

  function setMusicState(isPlaying) {
    if (!musicBtn) return;
    musicBtn.setAttribute("aria-pressed", String(isPlaying));
    musicBtn.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    if (musicLabel) musicLabel.textContent = isPlaying ? "Music on" : "Music off";
  }

  function tryPlay() {
    if (!audio) return;
    var p = audio.play();
    if (p && typeof p.then === "function") {
      p.then(function () { setMusicState(true); })
       .catch(function () { setMusicState(false); });
    }
  }

  if (intro && openBtn) {
    intro.hidden = false;
    document.body.classList.add("is-locked");
    openBtn.focus({ preventScroll: true });

    openBtn.addEventListener("click", function () {
      intro.classList.add("is-opening");
      document.body.classList.remove("is-locked");
      window.scrollTo(0, 0);
      tryPlay(); // user gesture, so autoplay is allowed

      var done = function () {
        intro.hidden = true;
        if (heroTitle) heroTitle.focus({ preventScroll: true });
      };
      if (reduceMotion) done();
      else setTimeout(done, 1100);
    });
  }

  /* ---------- Music toggle ---------- */
  if (audio && musicBtn) {
    var canPlay = true;
    audio.addEventListener("error", function () {
      // No audio file present: keep the button hidden rather than broken.
      canPlay = false;
      musicBtn.hidden = true;
    }, true);

    // Show the control once the audio element has a source to try.
    if ($("source", audio)) musicBtn.hidden = false;

    musicBtn.addEventListener("click", function () {
      if (!canPlay) return;
      if (audio.paused) tryPlay();
      else { audio.pause(); setMusicState(false); }
    });

    // Pause when the tab is hidden, resume only if it was playing.
    var wasPlaying = false;
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        wasPlaying = !audio.paused;
        audio.pause();
      } else if (wasPlaying) {
        tryPlay();
      }
    });
  }

  /* ---------- Story progress bar ---------- */
  var slideSelectors = [
    "#home", "#couple", "#countdown-title", "#celebrations",
    "#venue", "#family", ".children-section", "footer"
  ];

  var slides = slideSelectors
    .map(function (sel) {
      var el = $(sel);
      if (!el) return null;
      // The countdown selector targets the heading; use its section instead.
      return el.closest("section") || el;
    })
    .filter(Boolean);

  var bar = document.createElement("div");
  bar.className = "story-progress";
  bar.setAttribute("aria-hidden", "true");
  var segments = slides.map(function () {
    var s = document.createElement("span");
    bar.appendChild(s);
    return s;
  });
  document.body.appendChild(bar);

  function setActiveSlide(index) {
    segments.forEach(function (seg, i) {
      seg.classList.toggle("is-done", i < index);
      seg.classList.toggle("is-active", i === index);
    });
  }
  setActiveSlide(0);

  // Nav links: highlight the current section.
  var navLinks = $$(".section-nav a");
  function setCurrentNav(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle("is-current", a.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window) {
    var slideObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = slides.indexOf(entry.target);
        if (idx > -1) setActiveSlide(idx);
        if (entry.target.id) setCurrentNav(entry.target.id);
        else setCurrentNav("");
      });
    }, { threshold: 0.55 });

    slides.forEach(function (s) { slideObserver.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$("[data-reveal]");

  // Gentle stagger for siblings revealed together.
  revealEls.forEach(function (el, i) {
    var siblings = el.parentElement ? $$("[data-reveal]", el.parentElement).length : 1;
    if (siblings > 1) {
      var pos = $$("[data-reveal]", el.parentElement).indexOf(el);
      el.style.setProperty("--reveal-delay", pos * 120 + "ms");
    }
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Countdown ---------- */
  // 10 Dec 2026, 7:00 PM IST (UTC+5:30) = 13:30 UTC
  var target = Date.UTC(2026, 11, 10, 13, 30, 0);

  var dEl = $("#d"), hEl = $("#h"), mEl = $("#m"), sEl = $("#s");
  var countdownBox = $("#countdown");
  var message = $("#countdown-message");

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  var timer;
  function tick() {
    var diff = target - Date.now();

    if (diff <= 0) {
      if (dEl) dEl.textContent = "00";
      if (hEl) hEl.textContent = "00";
      if (mEl) mEl.textContent = "00";
      if (sEl) sEl.textContent = "00";
      if (message) message.hidden = false;
      if (countdownBox) countdownBox.setAttribute("aria-label", "The wedding day is here");
      clearInterval(timer);
      return;
    }

    var secs = Math.floor(diff / 1000);
    var days = Math.floor(secs / 86400);
    var hours = Math.floor((secs % 86400) / 3600);
    var mins = Math.floor((secs % 3600) / 60);
    var s = secs % 60;

    if (dEl) dEl.textContent = days < 100 ? pad(days) : String(days);
    if (hEl) hEl.textContent = pad(hours);
    if (mEl) mEl.textContent = pad(mins);
    if (sEl) sEl.textContent = pad(s);
  }

  tick();
  timer = setInterval(tick, 1000);
})();
