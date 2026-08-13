/* ══════════════════════════════════════════════════════════════════════
   PhaseParadise, landing page behaviour

   One orchestrated moment, the cycle ring in §3. The rest of the page
   stays with quiet fades and a little parallax. All of it steps aside
   for prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!reduced.matches) root.classList.add("js-reveal");

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ───────────────────────────────────────── year, from the visitor's clock */
  var year = document.getElementById("year");
  if (year) year.textContent = "© " + new Date().getFullYear();

  /* ─────────────────────────────────────────────── nav, once stuck */
  var nav = document.getElementById("nav");
  var darkZones = Array.prototype.slice.call(
    document.querySelectorAll(".phases, .cta, .foot")
  );

  function paintNav(y) {
    if (!nav) return;
    nav.classList.toggle("is-stuck", y > 12);

    /* the bar goes dark while a dark section is passing behind it */
    var probe = nav.offsetHeight * 0.5;
    var onDark = darkZones.some(function (el) {
      var r = el.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    nav.classList.toggle("nav--onDark", onDark);
  }

  /* ──────────────────────────────────────────── reveal on approach */
  var revealables = document.querySelectorAll("[data-reveal]");

  if (reduced.matches || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ══════════════════════════════════════════════════════════════
     §3 · THE CYCLE RING
     Four arcs on one squircle. They draw themselves in as the
     section scrolls, a marker rides the edge, the day counts up.
     ══════════════════════════════════════════════════════════ */

  /* a 29 day cycle, split the way the app's own cycle bar splits it */
  var PHASES = [
    { start: 0,  days: 5,  color: "#E85150" }, /* menstruation */
    { start: 5,  days: 12, color: "#64BC97" }, /* follicular   */
    { start: 17, days: 3,  color: "#FEBC52" }, /* ovulation    */
    { start: 20, days: 9,  color: "#A28DEA" }  /* luteal       */
  ];
  var CYCLE_DAYS = 29;

  var track   = document.getElementById("phasesTrack");
  var sticky  = track && track.querySelector(".phases__sticky");
  var arcs    = document.querySelectorAll(".ring__arc");
  var marker  = document.getElementById("ringMarker");
  var dayEl   = document.getElementById("ringDay");
  var totalEl = document.getElementById("ringTotal");
  var items   = document.querySelectorAll(".plist__item");
  var geometry = document.querySelector(".ring__track");

  if (totalEl) totalEl.textContent = CYCLE_DAYS;

  var ringLen = 0;
  var lastPhase = -1;
  var lastDay = -1;

  if (geometry && arcs.length) {
    ringLen = geometry.getTotalLength();

    /* every arc carries the whole path, the dash pattern picks the slice */
    arcs.forEach(function (arc, i) {
      var p = PHASES[i];
      arc.dataset.start = (p.start / CYCLE_DAYS) * ringLen;
      arc.dataset.len = (p.days / CYCLE_DAYS) * ringLen - 8; /* 8 = the gap */
    });
  }

  function paintRing(progress) {
    if (!ringLen) return;

    var drawn = progress * ringLen;

    arcs.forEach(function (arc) {
      var start = parseFloat(arc.dataset.start);
      var len = parseFloat(arc.dataset.len);
      var shown = clamp(drawn - start, 0, len);
      arc.style.strokeDasharray = shown + " " + ringLen;
      arc.style.strokeDashoffset = -start;
    });

    if (marker) {
      var pt = geometry.getPointAtLength(clamp(drawn, 0, ringLen - 0.01));
      marker.setAttribute("cx", pt.x);
      marker.setAttribute("cy", pt.y);
      marker.style.opacity = progress > 0.004 ? "1" : "0";
    }

    var day = clamp(Math.floor(progress * CYCLE_DAYS) + 1, 1, CYCLE_DAYS);
    if (day !== lastDay && dayEl) {
      dayEl.textContent = day;
      lastDay = day;
    }

    /* which phase are we standing in */
    var idx = 0;
    for (var i = PHASES.length - 1; i >= 0; i--) {
      if (day > PHASES[i].start) { idx = i; break; }
    }
    if (idx !== lastPhase) {
      lastPhase = idx;
      items.forEach(function (el, i) { el.classList.toggle("is-active", i === idx); });
      if (marker) marker.style.stroke = PHASES[idx].color;
      if (sticky) sticky.style.setProperty("--phase-live", PHASES[idx].color);
    }
  }

  /* height of the scroll runway that drives the ring */
  var RUNWAY = 2.6;
  var lastWidth = window.innerWidth;

  function sizeRunway() {
    if (!track || reduced.matches) return;
    track.style.height = Math.round(window.innerHeight * (1 + RUNWAY)) + "px";
  }

  /* ─────────────────────────────────────────────────────── parallax */
  var floaters = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var heroDevice = document.querySelector(".device--hero");

  function paintParallax() {
    var vh = window.innerHeight;
    var y = window.pageYOffset;

    floaters.forEach(function (el) {
      var f = parseFloat(el.getAttribute("data-parallax")) || 0;

      if (el === heroDevice) {
        /* the hero phone lags behind the page, and recedes a little */
        var p = clamp(y / vh, 0, 1.2);
        el.style.transform =
          "translate3d(0," + (y * f).toFixed(1) + "px,0) scale(" + (1 - p * 0.05).toFixed(4) + ")";
        return;
      }

      var r = el.getBoundingClientRect();
      if (r.bottom < -240 || r.top > vh + 240) return;
      var delta = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = "translate3d(0," + (delta * f * vh).toFixed(1) + "px,0)";
    });
  }

  /* ───────────────────────────────────────────── one frame, one job */
  var ticking = false;

  function frame() {
    ticking = false;
    var y = window.pageYOffset;

    paintNav(y);

    if (!reduced.matches) {
      paintParallax();

      if (track) {
        var r = track.getBoundingClientRect();
        var runway = track.offsetHeight - window.innerHeight;
        var progress = runway > 0 ? clamp(-r.top / runway, 0, 1) : 0;
        paintRing(progress);
      }
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }

  function onResize() {
    /* ignore the address bar growing and shrinking on mobile */
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    sizeRunway();
    onScroll();
  }

  /* ────────────────────────────────────────────────────────── start */
  function start() {
    if (reduced.matches) {
      paintRing(1);
      if (marker) marker.style.opacity = "0";
      if (dayEl) dayEl.textContent = CYCLE_DAYS;
      paintNav(window.pageYOffset);
      window.addEventListener("scroll", function () {
        paintNav(window.pageYOffset);
      }, { passive: true });
      return;
    }
    sizeRunway();
    paintRing(0);
    frame();
  }

  start();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", function () {
    lastWidth = -1;
    setTimeout(onResize, 120);
  });

  /* fonts land late and can shift the runway a touch */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { sizeRunway(); onScroll(); });
  }

  /* a language change rewrites every headline, so measure again */
  document.addEventListener("pp:i18n", function () {
    sizeRunway();
    onScroll();
  });

  /* someone flipping the system setting mid visit */
  var onPrefChange = function () { window.location.reload(); };
  if (reduced.addEventListener) reduced.addEventListener("change", onPrefChange);
  else if (reduced.addListener) reduced.addListener(onPrefChange);
})();
