/* ══════════════════════════════════════════════════════════════════════
   PhaseParadise, language handling

   Every visible string lives in locales/<code>.js. English ships with
   the page and doubles as the safety net: if any other language file is
   missing or broken, the whole page simply stays English.

   To add a language: drop in locales/<code>.js and add one line to
   LANGS below. The switcher in the header builds itself from that list.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var LANGS = [
    { code: "de", label: "DE", html: "de", og: "de_DE" },
    { code: "en", label: "EN", html: "en", og: "en_US" }
  ];

  /* loaded with the page, and what everything falls back to */
  var BASE = "en";
  var STORAGE_KEY = "phaseparadise-lang";
  var DIR = "locales/";
  var GIVE_UP_AFTER = 4000;

  var root = document.documentElement;
  var current = null;
  var pending = null;

  function bank() {
    return window.PPLocale || {};
  }

  function known(code) {
    for (var i = 0; i < LANGS.length; i++) {
      if (LANGS[i].code === code) return LANGS[i];
    }
    return null;
  }

  /* ──────────────────────────────────────────────── picking a language */
  function stored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null; /* private mode, or storage switched off */
    }
  }

  function remember(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {}
  }

  /* an earlier choice wins, otherwise the browser decides */
  function preferred() {
    var saved = stored();
    if (saved && known(saved)) return saved;

    var list = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < list.length; i++) {
      var base = String(list[i]).toLowerCase().split("-")[0];
      if (known(base)) return base;
    }
    return BASE;
  }

  /* ──────────────────────────────────────────────────── reading a key */
  /* "partner.ui.rows.2.value" walks objects and arrays alike */
  function lookup(dict, path) {
    var parts = path.split(".");
    var node = dict;
    for (var i = 0; i < parts.length; i++) {
      if (node === null || node === undefined) return null;
      node = node[parts[i]];
    }
    return typeof node === "string" ? node : null;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* the only markup a translator can use:
     *word* sets the accent colour, a line break becomes one */
  function rich(s) {
    return escapeHtml(s)
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  /* ─────────────────────────────────────────── writing it into the page */
  function fill(dict, backup) {
    function read(key) {
      var value = lookup(dict, key);
      if (value !== null) return value;
      value = lookup(backup, key);
      if (value !== null && window.console) {
        console.warn("[i18n] " + key + " is missing, using " + BASE);
      }
      return value;
    }

    function bind(attr, write) {
      var nodes = document.querySelectorAll("[" + attr + "]");
      for (var i = 0; i < nodes.length; i++) {
        var value = read(nodes[i].getAttribute(attr));
        if (value !== null) write(nodes[i], value);
      }
    }

    bind("data-i18n", function (el, v) { el.textContent = v; });
    bind("data-i18n-rich", function (el, v) { el.innerHTML = rich(v); });
    bind("data-i18n-alt", function (el, v) { el.setAttribute("alt", v); });
    bind("data-i18n-aria", function (el, v) { el.setAttribute("aria-label", v); });
    bind("data-i18n-content", function (el, v) { el.setAttribute("content", v); });

    var title = read("meta.title");
    if (title) document.title = title;
  }

  /* ──────────────────────────────────────────────────────── the switcher */
  function buildSwitcher(dict) {
    var host = document.getElementById("langSwitch");
    if (!host) return;

    var label = lookup(dict, "nav.language");
    if (label) host.setAttribute("aria-label", label);

    host.innerHTML = "";
    LANGS.forEach(function (lang, i) {
      if (i) {
        var sep = document.createElement("span");
        sep.className = "lang__sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "/";
        host.appendChild(sep);
      }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang__btn";
      btn.lang = lang.html;
      btn.textContent = lang.label;
      btn.setAttribute("aria-pressed", String(lang.code === current));
      btn.addEventListener("click", function () {
        if (lang.code !== current) set(lang.code, true);
      });
      host.appendChild(btn);
    });
  }

  /* ────────────────────────────────────────────────────────── switching */
  function paint(code) {
    var lang = known(code) || known(BASE);
    var dict = bank()[lang.code] || bank()[BASE] || {};
    current = lang.code;

    root.setAttribute("lang", lang.html);
    fill(dict, bank()[BASE] || {});
    buildSwitcher(dict);

    var locale = document.querySelector('meta[property="og:locale"]');
    if (locale) locale.setAttribute("content", lang.og);

    root.classList.remove("i18n-pending");
    document.dispatchEvent(
      new CustomEvent("pp:i18n", { detail: { lang: lang.code } })
    );
  }

  /* fetches a language file once, and settles on English if it will not
     come. the callback always fires, so the page is never left blank. */
  function ensure(code, done) {
    if (bank()[code]) return done(code);

    var settled = false;
    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(pending);
      done(result);
    }

    var tag = document.createElement("script");
    tag.src = DIR + code + ".js";
    tag.async = true;
    tag.onload = function () {
      finish(bank()[code] ? code : BASE);
    };
    tag.onerror = function () {
      if (window.console) {
        console.warn("[i18n] " + code + " could not be loaded, showing " + BASE);
      }
      finish(BASE);
    };

    pending = setTimeout(function () { finish(BASE); }, GIVE_UP_AFTER);
    document.head.appendChild(tag);
  }

  function set(code, byHand) {
    var lang = known(code) || known(BASE);
    if (byHand) remember(lang.code);
    ensure(lang.code, paint);
  }

  window.PPI18n = {
    langs: LANGS,
    set: function (code) { set(code, true); },
    get current() { return current; }
  };

  set(preferred(), false);
})();
