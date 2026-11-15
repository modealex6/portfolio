/* ════════════════════════════════════════════════════════════
   Mohammed Nabil — portfolio behaviour. No dependencies.
   1. Language (AR is the real markup, EN comes from content/en.js)
   2. Overlay menu (focus trap, Esc, scroll lock)
   3. Lattice canvas (hero background)
   4. Pointer tilt + hero spotlight
   5. Scroll rail, reveal, parallax
   6. Copy email + toast + live clock
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var STORAGE_KEY = "mn-portfolio-lang";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  var slice = function (list) {
    return Array.prototype.slice.call(list);
  };

  /* ---------------------------------------------------------
     1 · Language
     --------------------------------------------------------- */
  var i18nNodes = slice(doc.querySelectorAll("[data-i18n]"));
  var ariaNodes = slice(doc.querySelectorAll("[data-i18n-aria]"));
  var arMarkup = new Map();
  var arAria = new Map();

  i18nNodes.forEach(function (node) {
    var key = node.getAttribute("data-i18n");
    if (!arMarkup.has(key)) arMarkup.set(key, node.innerHTML);
  });
  ariaNodes.forEach(function (node) {
    var key = node.getAttribute("data-i18n-aria");
    if (!arAria.has(key)) arAria.set(key, node.getAttribute("aria-label") || "");
  });

  var AR_META = {
    title: doc.title,
    desc: (doc.querySelector('meta[name="description"]') || {}).content || "",
    ogTitle: (doc.querySelector('meta[property="og:title"]') || {}).content || "",
    ogDesc: (doc.querySelector('meta[property="og:description"]') || {}).content || ""
  };

  var lang = "ar";

  function lookup(dict, path) {
    return path.split(".").reduce(function (acc, part) {
      return acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined;
    }, dict);
  }

  /* Only returns a string in English mode. In Arabic the markup is the source. */
  function en(key) {
    var dict = window.PORTFOLIO_EN;
    if (lang !== "en" || !dict) return null;
    var value = lookup(dict, key);
    return typeof value === "string" ? value : null;
  }

  function setMeta(selector, attr, value) {
    var node = doc.querySelector(selector);
    if (node && value) node.setAttribute(attr, value);
  }

  function applyLanguage(next, persist) {
    lang = next === "en" ? "en" : "ar";
    var isEn = lang === "en";
    var dict = window.PORTFOLIO_EN;

    i18nNodes.forEach(function (node) {
      var key = node.getAttribute("data-i18n");
      if (isEn) {
        var value = en(key);
        if (value !== null) node.innerHTML = value;
      } else if (arMarkup.has(key)) {
        node.innerHTML = arMarkup.get(key);
      }
    });

    ariaNodes.forEach(function (node) {
      var key = node.getAttribute("data-i18n-aria");
      if (isEn) {
        var value = en(key);
        if (value !== null) node.setAttribute("aria-label", value);
      } else if (arAria.has(key)) {
        node.setAttribute("aria-label", arAria.get(key));
      }
    });

    root.lang = isEn ? "en" : "ar";
    root.dir = isEn ? "ltr" : "rtl";

    if (isEn && dict && dict.meta) {
      doc.title = dict.meta.title || AR_META.title;
      setMeta('meta[name="description"]', "content", dict.meta.desc);
      setMeta('meta[property="og:title"]', "content", dict.meta.ogTitle);
      setMeta('meta[property="og:description"]', "content", dict.meta.ogDesc);
    } else {
      doc.title = AR_META.title;
      setMeta('meta[name="description"]', "content", AR_META.desc);
      setMeta('meta[property="og:title"]', "content", AR_META.ogTitle);
      setMeta('meta[property="og:description"]', "content", AR_META.ogDesc);
    }

    slice(doc.querySelectorAll("[data-lang-btn]")).forEach(function (btn) {
      var active = btn.getAttribute("data-lang-btn") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    setMenuLabel();
    updateRail(true);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        /* storage blocked — choice simply won't persist */
      }
    }
  }

  slice(doc.querySelectorAll("[data-lang-btn]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLanguage(btn.getAttribute("data-lang-btn"), true);
    });
  });

  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    saved = null;
  }

  var requested = null;
  try {
    requested = new URLSearchParams(window.location.search).get("lang");
  } catch (e) {
    requested = null;
  }

  if (requested === "en" || requested === "ar") applyLanguage(requested, true);
  else if (saved === "en") applyLanguage("en", false);

  /* ---------------------------------------------------------
     2 · Overlay menu
     --------------------------------------------------------- */
  var menu = doc.getElementById("menu");
  var toggle = doc.getElementById("menuToggle");
  var menuOpen = false;
  var lastFocused = null;
  var closeTimer = null;

  function setMenuLabel() {
    if (!toggle) return;
    var label = toggle.querySelector('[data-i18n="nav.menu"]');
    if (label) {
      var text = menuOpen
        ? en("nav.close") || "إغلاق"
        : en("nav.menu") || arMarkup.get("nav.menu") || "القائمة";
      label.textContent = text;
    }
    toggle.setAttribute(
      "aria-label",
      menuOpen
        ? en("nav.closeMenu") || "إغلاق القائمة"
        : en("nav.openMenu") || "فتح القائمة"
    );
  }

  function focusables() {
    return slice(menu.querySelectorAll('a[href], button:not([disabled])')).filter(function (el) {
      return el.offsetParent !== null;
    });
  }

  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    lastFocused = doc.activeElement;
    if (closeTimer) window.clearTimeout(closeTimer);
    menu.hidden = false;
    /* Flush layout so the clip-path transition starts from the closed state
       instead of being skipped. rAF is not reliable when the tab is hidden. */
    void menu.offsetWidth;
    menu.classList.add("is-open");
    body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    setMenuLabel();
    window.setTimeout(function () {
      var items = focusables();
      if (items.length && menuOpen) items[0].focus();
    }, 260);
  }

  function closeMenu(restoreFocus) {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
    setMenuLabel();
    closeTimer = window.setTimeout(function () {
      if (!menuOpen) menu.hidden = true;
    }, 680);
    if (restoreFocus !== false) {
      var target = lastFocused && lastFocused.focus ? lastFocused : toggle;
      if (target && target.focus) target.focus({ preventScroll: true });
    }
  }

  if (menu && toggle) {
    toggle.addEventListener("click", function () {
      if (menuOpen) closeMenu(true);
      else openMenu();
    });

    menu.addEventListener("click", function (event) {
      var link = event.target.closest ? event.target.closest("a[href]") : null;
      if (!link) return;
      var hash = link.getAttribute("href");
      closeMenu(false);
      var target = hash && hash.charAt(0) === "#" ? doc.getElementById(hash.slice(1)) : null;
      if (target) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        window.setTimeout(function () {
          target.focus({ preventScroll: true });
        }, 80);
      }
    });

    doc.addEventListener("keydown", function (event) {
      if (!menuOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== "Tab") return;
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     3 · Lattice canvas
     --------------------------------------------------------- */
  var canvas = doc.getElementById("lattice");
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;

  if (ctx) {
    var dpr = 1;
    var width = 0;
    var height = 0;
    var nodes = [];
    var pointer = { x: -9999, y: -9999, active: false };
    var frame = 0;
    var running = false;

    var resize = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(24, Math.min(74, Math.round(width / 19)));
      var link = width < 700 ? 112 : 152;
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: 0.7 + Math.random() * 1.2,
          link: link
        });
      }
      draw(0, true);
    };

    var draw = function (dt, still) {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      var i, j, a, b, dx, dy, dist, alpha;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!still) {
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          if (a.x < -20) a.x = width + 20;
          if (a.x > width + 20) a.x = -20;
          if (a.y < -20) a.y = height + 20;
          if (a.y > height + 20) a.y = -20;
        }

        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x;
          dy = a.y - b.y;
          if (Math.abs(dx) > a.link || Math.abs(dy) > a.link) continue;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > a.link) continue;
          alpha = (1 - dist / a.link) * 0.3;
          var near = pointer.active && Math.hypot((a.x + b.x) / 2 - pointer.x, (a.y + b.y) / 2 - pointer.y) < 170;
          ctx.strokeStyle = near
            ? "rgba(155,108,255," + (alpha * 1.6).toFixed(3) + ")"
            : "rgba(120,132,190," + alpha.toFixed(3) + ")";
          ctx.lineWidth = near ? 0.8 : 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        var pd = pointer.active ? Math.hypot(a.x - pointer.x, a.y - pointer.y) : 9999;
        var glow = pd < 170 ? 1 - pd / 170 : 0;
        ctx.fillStyle = glow > 0.2
          ? "rgba(171,128,255," + (0.55 + glow * 0.45).toFixed(3) + ")"
          : "rgba(150,162,215,0.5)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r + glow * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    var loop = function (now) {
      if (!running) return;
      if (!frame) frame = now;
      var dt = Math.min(now - frame, 48) / 16.6;
      frame = now;
      draw(dt, false);
      window.requestAnimationFrame(loop);
    };

    var start = function () {
      if (running || reduceMotion.matches) return;
      running = true;
      frame = 0;
      window.requestAnimationFrame(loop);
    };

    var stop = function () {
      running = false;
    };

    resize();
    if (!reduceMotion.matches) start();

    var resizeTick = false;
    window.addEventListener(
      "resize",
      function () {
        if (resizeTick) return;
        resizeTick = true;
        window.requestAnimationFrame(function () {
          resize();
          resizeTick = false;
        });
      },
      { passive: true }
    );

    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) stop();
      else start();
    });

    reduceMotion.addEventListener("change", function () {
      if (reduceMotion.matches) {
        stop();
        draw(0, true);
      } else {
        start();
      }
    });

    if (finePointer.matches) {
      var hero = doc.querySelector(".hero");
      if (hero) {
        hero.addEventListener(
          "pointermove",
          function (event) {
            var rect = hero.getBoundingClientRect();
            pointer.x = event.clientX - rect.left;
            pointer.y = event.clientY - rect.top;
            pointer.active = true;
            hero.style.setProperty("--mx", pointer.x + "px");
            hero.style.setProperty("--my", pointer.y + "px");
          },
          { passive: true }
        );
        hero.addEventListener("pointerleave", function () {
          pointer.active = false;
          pointer.x = -9999;
          pointer.y = -9999;
          hero.style.removeProperty("--mx");
          hero.style.removeProperty("--my");
        });
      }
    }
  }

  /* ---------------------------------------------------------
     4 · Pointer tilt
     --------------------------------------------------------- */
  if (finePointer.matches && !reduceMotion.matches) {
    slice(doc.querySelectorAll("[data-tilt]")).forEach(function (card) {
      var pending = false;
      var last = null;

      var update = function () {
        pending = false;
        if (!last) return;
        var rect = card.getBoundingClientRect();
        var px = (last.clientX - rect.left) / rect.width - 0.5;
        var py = (last.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ty", (px * 4).toFixed(2) + "deg");
        card.style.setProperty("--tx", (-py * 3.5).toFixed(2) + "deg");
        card.style.setProperty("--gx", (px * 60).toFixed(0) + "px");
        card.style.setProperty("--gy", (py * 60).toFixed(0) + "px");
      };

      card.addEventListener(
        "pointermove",
        function (event) {
          if (event.pointerType !== "mouse") return;
          last = { clientX: event.clientX, clientY: event.clientY };
          if (pending) return;
          pending = true;
          window.requestAnimationFrame(update);
        },
        { passive: true }
      );

      card.addEventListener("pointerleave", function () {
        last = null;
        card.style.removeProperty("--tx");
        card.style.removeProperty("--ty");
        card.style.removeProperty("--gx");
        card.style.removeProperty("--gy");
      });
    });
  }

  /* ---------------------------------------------------------
     5 · Reveal + rail + hero parallax
     --------------------------------------------------------- */
  var revealTargets = slice(doc.querySelectorAll("[data-reveal]"));

  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    revealTargets.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    root.classList.add("reveal-ready");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
    /* Safety net: never leave content invisible if the observer stalls. */
    window.setTimeout(function () {
      revealTargets.forEach(function (el) {
        el.classList.add("is-in");
      });
    }, 4000);
  }

  var railFill = doc.getElementById("railFill");
  var railIdx = doc.getElementById("railIdx");
  var railName = doc.getElementById("railName");
  var menuLinks = slice(doc.querySelectorAll(".menu-nav a[href^='#']"));
  var sections = menuLinks
    .map(function (link) {
      return doc.getElementById(link.getAttribute("href").slice(1));
    })
    .filter(Boolean);

  function updateRail(force) {
    if (!railFill || !railIdx || !railName || !sections.length) return;
    var y = window.scrollY || window.pageYOffset;
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
    railFill.style.transform = "scaleY(" + ratio.toFixed(4) + ")";

    var probe = y + window.innerHeight * 0.34;
    var index = 0;
    sections.forEach(function (section, i) {
      if (section.offsetTop <= probe) index = i;
    });

    railIdx.textContent = ("0" + (index + 1)).slice(-2);
    var label = menuLinks[index] && menuLinks[index].querySelector(".menu-label");
    var text = label ? label.textContent.trim() : "";
    if (force || railName.textContent !== text) railName.textContent = text;
  }

  var heroName = doc.querySelector(".hero-name");
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateRail(false);
      if (heroName && !reduceMotion.matches) {
        var y = window.scrollY || window.pageYOffset;
        var shift = Math.min(y * 0.16, 120);
        heroName.style.transform = shift ? "translate3d(0," + shift.toFixed(1) + "px,0)" : "";
      }
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    updateRail(true);
  });
  updateRail(true);

  /* ---------------------------------------------------------
     6 · Copy email, toast, clock
     --------------------------------------------------------- */
  var toast = doc.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = doc.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.insetBlockStart = "-1000px";
      body.appendChild(area);
      area.select();
      var ok = false;
      try {
        ok = doc.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      body.removeChild(area);
      if (ok) resolve();
      else reject(new Error("copy failed"));
    });
  }

  slice(doc.querySelectorAll("[data-copy]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      copyText(value).then(
        function () {
          showToast(en("toast.copied") || "تم نسخ البريد");
          var label = btn.querySelector("[data-i18n]") || btn;
          var original = label.textContent;
          label.textContent = en("toast.copied") || "تم النسخ";
          window.setTimeout(function () {
            label.textContent = original;
          }, 2000);
        },
        function () {
          showToast(en("toast.error") || "تعذّر النسخ — انسخه يدويًا");
        }
      );
    });
  });

  var clock = doc.getElementById("clock");
  if (clock) {
    var timeFormat = null;
    try {
      timeFormat = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Aden",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch (e) {
      timeFormat = null;
    }
    var tick = function () {
      var date = new Date();
      var text;
      if (timeFormat) {
        text = timeFormat.format(date);
      } else {
        text = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
      }
      clock.textContent = text;
    };
    tick();
    window.setInterval(tick, 20000);
  }
})();
