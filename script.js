/* Torque Motorsports — spec mockup. Instrument-panel motion: precise, mechanical, data-like.
   Everything renders in its final state without JS or under reduced motion. */
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) root.classList.add("js-motion");

  // Copyright year is scripted so it can never go stale (their footer still says 2025)
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Mobile nav — sits under the sticky header whatever its height
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav"), head = document.querySelector(".site-head");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      nav.style.setProperty("--nav-top", head.getBoundingClientRect().bottom + "px");
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { btn.click(); btn.focus(); } });
  }
  if (head) {
    var onScroll = function () { head.classList.toggle("is-condensed", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  // Count-up — verified published figures only. The final value is already in the HTML.
  function countUp(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    if (isNaN(end) || reduce) return;
    var t0 = null, dur = 520;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = end;
    }
    requestAnimationFrame(step);
  }

  // Table rows populate top-to-bottom like a timing screen. Gap rows reveal with everything else.
  document.querySelectorAll(".rows-in tbody tr").forEach(function (tr, i, all) {
    tr.style.setProperty("--r", Array.prototype.indexOf.call(tr.parentNode.children, tr));
  });

  if (root.classList.contains("js-motion")) {
    document.querySelectorAll(".rv-stagger").forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.classList.add("rv"); c.style.setProperty("--i", i); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        en.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".rv, .rows-in, .rule-in").forEach(function (el) { io.observe(el); });
  }

  // Race clock. Ticks only when data-target holds a real ISO date. No event is published,
  // so in the mockup it stays idle at "--" (B3). The tick logic is built and ready.
  document.querySelectorAll("[data-race-clock]").forEach(function (clock) {
    var target = clock.getAttribute("data-target");
    if (!target) return;
    var t = new Date(target).getTime();
    if (isNaN(t)) return;
    var f = { d: clock.querySelector('[data-unit="d"]'), h: clock.querySelector('[data-unit="h"]'), m: clock.querySelector('[data-unit="m"]'), s: clock.querySelector('[data-unit="s"]') };
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var ms = Math.max(0, t - Date.now()), s = Math.floor(ms / 1000);
      f.d.textContent = pad(Math.floor(s / 86400)); f.h.textContent = pad(Math.floor(s % 86400 / 3600));
      f.m.textContent = pad(Math.floor(s % 3600 / 60)); f.s.textContent = pad(s % 60);
    }
    tick(); if (!reduce) setInterval(tick, 1000);
  });

  // Calendar renders the current month (structure only — no event data exists)
  document.querySelectorAll("[data-cal]").forEach(function (cal) {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    var label = cal.querySelector("[data-cal-month]"), grid = cal.querySelector("[data-cal-grid]");
    if (!label || !grid) return;
    label.textContent = now.toLocaleString("en-US", { month: "long" }) + " " + y;
    var html = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(function (d) { return '<span class="dow">' + d + "</span>"; }).join("");
    var first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < first; i++) html += '<span class="out" aria-hidden="true">.</span>';
    for (var d = 1; d <= days; d++) html += '<span' + (d === now.getDate() ? ' class="today" aria-current="date"' : "") + ">" + (d < 10 ? "0" + d : d) + "</span>";
    while ((first + days) % 7) { html += '<span class="out" aria-hidden="true">.</span>'; days++; }
    grid.innerHTML = html;
  });

  // Forms — not wired. Surfaces the phone number on submit (B7). Validation never uses blue or red.
  document.querySelectorAll("form[data-mock]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var errId = f.id + "-err", err = document.getElementById(errId);
        var bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
        f.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) {
          ok = false;
          if (!err) {
            err = document.createElement("p"); err.className = "err"; err.id = errId;
            err.textContent = f.type === "email" ? "Enter a valid email address." : "Please fill this in.";
            f.insertAdjacentElement("afterend", err); f.setAttribute("aria-describedby", errId);
          }
        } else if (err) { err.remove(); f.removeAttribute("aria-describedby"); }
      });
      if (!ok) { var first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
      var status = form.querySelector(".form-status");
      status.hidden = false;
      status.textContent = "Mockup only — [FORM ENDPOINT — NOT WIRED]. Nothing was sent. To reach Torque now, call 678.349.2124.";
      status.focus();
    });
  });
})();
