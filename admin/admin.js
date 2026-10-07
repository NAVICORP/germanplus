/* German Plus admin: products, categories and the team.

   Everything is drawn here from the database through GP (gp-auth.js). The
   database decides who may change what; this page only asks and shows. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var S = {
    me: null, products: [], categories: [], team: [], activity: null,
    view: "products", q: "", cat: "all", show: "all", reorder: false
  };

  /* ------------------------------------------------------------ small helpers */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(sel, ev, fn, root) { var el = typeof sel === "string" ? $(sel, root) : sel; if (el) el.addEventListener(ev, fn); return el; }

  var ICONS = {
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c1.9.8 3.1 2.5 3.5 5.2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M18 13l-6 6-6-6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
    out: '<path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/>',
    sort: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
  };
  function ic(name, cls) { return '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  var WA_IC = '<svg class="wa-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z"/><path fill="#fff" d="M17.3 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a8.2 8.2 0 01-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 00-.8.4 3.4 3.4 0 00-1 2.5 5.9 5.9 0 001.2 3.1 13.4 13.4 0 005.2 4.6c1.9.8 2.7.9 3.6.8.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/></svg>';
  var G_IC = '<svg class="wa-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0012 22z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 000 9.2L6.4 14z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 003.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z"/></svg>';

  function initials(n) {
    var t = String(n || "").replace(/^\+/, "").trim();
    return (t.charAt(0) || "?").toUpperCase();
  }
  function ago(iso) {
    if (!iso) return "";
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    if (s < 86400 * 7) return Math.floor(s / 86400) + " d ago";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  /* ------------------------------------------------------------ phone numbers */
  /* Digits with the country code first, no plus: how the SkiFi login keeps them. */
  var COUNTRIES = [["233", "gh", "Ghana"], ["91", "in", "India"], ["971", "ae", "UAE"], ["966", "sa", "Saudi Arabia"],
    ["974", "qa", "Qatar"], ["965", "kw", "Kuwait"], ["968", "om", "Oman"], ["973", "bh", "Bahrain"], ["1", "us", "United States"],
    ["44", "gb", "United Kingdom"], ["61", "au", "Australia"], ["65", "sg", "Singapore"], ["60", "my", "Malaysia"], ["49", "de", "Germany"]];
  function country(cc) { return COUNTRIES.filter(function (c) { return c[0] === cc; })[0] || COUNTRIES[0]; }
  function ccOf(digits) {
    var best = null;
    COUNTRIES.forEach(function (c) { if (String(digits).indexOf(c[0]) === 0 && (!best || c[0].length > best[0].length)) best = c; });
    return best;
  }
  function flag(cc) { return '<img class="flag" src="/admin/flags/' + country(cc)[1] + '.webp" alt="" width="22" height="16">'; }
  function fullPhone(cc, raw) {
    var t = String(raw || "").trim(), own = /^(\+|00)/.test(t), d = t.replace(/\D/g, "");
    if (/^00/.test(t)) d = d.slice(2);
    if (!own) d = cc + d.replace(/^0+/, "");
    return d.length >= 8 && d.length <= 15 ? d : "";
  }
  function prettyPhone(p) {
    var d = String(p || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.indexOf("91") === 0 && d.length === 12) return "+91 " + d.slice(2, 7) + " " + d.slice(7);
    if (d.indexOf("233") === 0 && d.length === 12) return "+233 " + d.slice(3, 5) + " " + d.slice(5, 8) + " " + d.slice(8);
    var c = ccOf(d);
    return c ? "+" + c[0] + " " + d.slice(c[0].length) : "+" + d;
  }
  function lastCc() {
    try { return localStorage.getItem("gp-cc") || "233"; } catch (e) { return "233"; }
  }
  function keepCc(cc) { try { localStorage.setItem("gp-cc", cc); } catch (e) { /* private mode */ } }
  /* The country code control: a rounded button that opens the same picker as
     the rest of the admin, with flags. The code sits in a hidden input. */
  function ccSelect(id, cc) {
    return '<input type="hidden" id="' + id + '" value="' + esc(cc) + '">' +
      '<button type="button" class="sel sel--cc" data-cc="' + id + '" aria-label="Country code +' + esc(cc) + '">' +
      flag(cc) + "<span>+" + esc(cc) + "</span>" + ic("chev") + "</button>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-cc]");
    if (!b) return;
    var input = document.getElementById(b.getAttribute("data-cc"));
    pick("Country code", COUNTRIES.map(function (c) {
      return { value: c[0], label: c[2], sub: "+" + c[0], lead: flag(c[0]) };
    }), input.value, { search: "Search countries" }).then(function (v) {
      if (v == null) return;
      input.value = v;
      keepCc(v);
      b.innerHTML = flag(v) + "<span>+" + esc(v) + "</span>" + ic("chev");
      b.setAttribute("aria-label", "Country code +" + v);
      var next = b.parentNode && b.parentNode.querySelector("input[type=tel]");
      if (next) next.focus();
    });
  });

  /* ------------------------------------------------------------ toasts, dialogs, picker */
  function toast(msg, bad) {
    var box = document.getElementById("toasts");
    var t = document.createElement("div");
    t.className = "toast" + (bad ? " toast--bad" : "");
    t.innerHTML = ic(bad ? "info" : "check") + "<span>" + esc(msg) + "</span>";
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, bad ? 5200 : 3200);
  }

  function layer(html) {
    var w = document.createElement("div");
    w.innerHTML = html;
    document.body.appendChild(w);
    requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add("is-open"); }); });
    return w;
  }
  function closeLayer(w) {
    w.classList.remove("is-open");
    setTimeout(function () { w.remove(); }, 320);
  }

  /* A yes/no question. Resolves true or false. */
  function confirmBox(title, text, ok, danger) {
    return new Promise(function (done) {
      var prev = document.activeElement;
      var w = layer('<div class="dialog-scrim" data-no></div><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t">' +
        '<h3 id="dlg-t">' + esc(title) + "</h3><p>" + esc(text) + "</p>" +
        '<div class="btns"><button class="btn btn--s" type="button" data-no>Cancel</button>' +
        '<button class="btn ' + (danger ? "btn--p" : "btn--ink") + '" type="button" data-yes>' + esc(ok) + "</button></div></div>");
      function end(v) { document.removeEventListener("keydown", key); closeLayer(w); if (prev && prev.focus) prev.focus(); done(v); }
      function key(e) { if (e.key === "Escape") end(false); }
      document.addEventListener("keydown", key);
      w.addEventListener("click", function (e) {
        if (e.target.closest("[data-yes]")) end(true);
        else if (e.target.closest("[data-no]")) end(false);
      });
      setTimeout(function () { var y = $("[data-yes]", w); if (y) y.focus(); }, 50);
    });
  }

  /* A list to choose from, as a sheet on phones and a card on computers:
     the one dropdown everywhere. Options: { value, label, sub, lead }.
     Resolves the value, or null when closed. */
  function pick(title, options, value, opts) {
    opts = opts || {};
    return new Promise(function (done) {
      var prev = document.activeElement;
      var w = layer('<div class="pick-scrim" data-x></div><div class="pick" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="pick-grab"></div><div class="pick-head"><h3>' + esc(title) + '</h3><button class="ibtn" type="button" data-x aria-label="Close">' + ic("close") + "</button></div>" +
        (opts.search ? '<div class="pick-search"><div class="search">' + ic("search") + '<input class="in" type="search" placeholder="' + esc(opts.search) + '" autocomplete="off"></div></div>' : "") +
        '<div class="pick-list" role="listbox"></div></div>');
      var list = $(".pick-list", w);
      function draw(q) {
        q = String(q || "").toLowerCase();
        var shown = options.filter(function (o) { return !q || (o.label + " " + (o.sub || "")).toLowerCase().indexOf(q) > -1; });
        list.innerHTML = shown.length ? shown.map(function (o) {
          return '<button type="button" class="opt" role="option" data-v="' + esc(o.value) + '" aria-selected="' + (String(o.value) === String(value)) + '">' +
            (o.lead || "") + '<span class="grow">' + esc(o.label) + (o.sub ? "<br><small>" + esc(o.sub) + "</small>" : "") + "</span>" + ic("check", "tick") + "</button>";
        }).join("") : '<p class="pick-none">Nothing by that name.</p>';
      }
      draw("");
      function end(v) { document.removeEventListener("keydown", key); closeLayer(w); if (prev && prev.focus) prev.focus(); done(v); }
      function key(e) { if (e.key === "Escape") end(null); }
      document.addEventListener("keydown", key);
      w.addEventListener("click", function (e) {
        var o = e.target.closest(".opt");
        if (o) return end(o.getAttribute("data-v"));
        if (e.target.closest("[data-x]")) end(null);
      });
      var s = $(".pick-search input", w);
      if (s) { s.addEventListener("input", function () { draw(s.value); }); setTimeout(function () { if (matchMedia("(min-width:760px)").matches) s.focus(); }, 60); }
      setTimeout(function () { var cur = $('.opt[aria-selected="true"]', w) || $(".opt", w); if (cur && !s) cur.focus(); }, 60);
    });
  }

  /* A side drawer (a full sheet on phones) for editing one thing. */
  function drawer(title, body, foot) {
    var prev = document.activeElement;
    var w = layer('<div class="scrim" data-dclose></div><section class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<header class="dr-head"><h2>' + esc(title) + '</h2><button class="ibtn" type="button" data-dclose aria-label="Close">' + ic("close") + "</button></header>" +
      '<div class="dr-body">' + body + '</div><footer class="dr-foot">' + foot + "</footer></section>");
    document.body.style.overflow = "hidden";
    var api = {
      el: w, dirty: false, guard: null,
      close: function (force) {
        if (!force && api.dirty) {
          return confirmBox("Leave without saving?", "Your changes to this will be lost.", "Leave", true).then(function (y) { if (y) api.close(true); });
        }
        document.removeEventListener("keydown", key);
        document.body.style.overflow = "";
        closeLayer(w);
        if (prev && prev.focus) prev.focus();
        return Promise.resolve();
      }
    };
    function key(e) { if (e.key === "Escape" && !document.querySelector(".pick,.dialog")) api.close(); }
    document.addEventListener("keydown", key);
    w.addEventListener("click", function (e) { if (e.target.closest("[data-dclose]")) api.close(); });
    w.addEventListener("input", function () { api.dirty = true; });
    setTimeout(function () { var f = $(".dr-body input:not([type=hidden]):not([type=file]), .dr-body textarea", w); if (f && matchMedia("(min-width:760px)").matches) f.focus(); }, 340);
    return api;
  }

  function busy(btn, label) {
    if (!btn) return function () {};
    var html = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin" style="width:16px;height:16px;border-width:2px;border-color:rgba(255,255,255,.4);border-top-color:#fff"></span>' + esc(label || "Saving");
    return function () { btn.disabled = false; btn.innerHTML = html; };
  }

  /* ------------------------------------------------------------ signing in */
  function loginView(msg, who, step) {
    step = step || "";
    var code = step === "code" || step === "pcode", wa = step === "phone" || step === "pcode";
    var email = wa ? "" : (who || ""), phone = wa ? (who || "") : "";
    var sub = step === "pcode" ? "Check WhatsApp for your 6 digit code." :
      step === "code" ? "Check your email for your 6 digit code." :
      step === "phone" ? "Use the WhatsApp number the German Plus team added for you." :
      "For the German Plus team. Sign in to manage products.";
    var form;
    if (step === "phone") {
      form = '<form id="pf" class="stack">' +
        '<label class="field"><span>WhatsApp number</span><span class="phone">' + ccSelect("pcc", lastCc()) +
        '<input id="pn" class="in" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="Phone number" required></span></label>' +
        '<button class="btn btn--p btn--wide" type="submit" id="go">' + WA_IC + "Send code on WhatsApp</button>" +
        '<button class="btn btn--ghost btn--sm" type="button" id="back">' + ic("back") + "Other ways to sign in</button></form>";
    } else if (code) {
      form = '<form id="cf" class="stack">' +
        '<p class="hint">We sent a code ' + (wa ? "on WhatsApp to <b>" + esc(prettyPhone(phone)) : "to <b>" + esc(email)) + "</b>. It works for 10 minutes.</p>" +
        '<label class="field"><span>Code</span><input id="cc" class="in code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>' +
        '<button class="btn btn--p btn--wide" type="submit" id="go">' + ic("check") + "Sign in</button>" +
        '<button class="btn btn--ghost btn--sm" type="button" id="back">' + ic("back") + (wa ? "Use another number" : "Use another email") + "</button></form>";
    } else {
      form = '<form id="ef" class="stack">' +
        '<label class="field"><span>Email</span><input id="ee" class="in" type="email" autocomplete="email" autocapitalize="none" placeholder="you@example.com" required value="' + esc(email) + '"></label>' +
        '<button class="btn btn--s btn--wide" type="submit" id="go">' + ic("mail") + "Email me a code</button></form>";
    }
    app.className = "";
    app.removeAttribute("aria-busy");
    app.innerHTML = '<main class="login"><div class="login-card">' +
      '<img class="login-logo" src="/assets/brand/logo.webp" alt="German Plus" width="150" height="57">' +
      "<h1>Admin</h1><p class=\"sub\">" + sub + "</p>" +
      (msg ? '<p class="err" role="alert">' + esc(msg) + "</p>" : "") +
      (step ? "" : '<div class="stack"><button class="btn btn--ink btn--wide" type="button" id="wbtn">' + WA_IC + "Continue with WhatsApp</button>" +
        '<button class="btn btn--s btn--wide" type="button" id="gbtn">' + G_IC + "Continue with Google</button>" +
        '<div class="or">or</div></div>') +
      form +
      '<div class="login-back"><a class="btn btn--ghost btn--sm" href="/">' + ic("back") + "Back to the website</a></div>" +
      "</div></main>";

    on("#gbtn", "click", function (e) {
      e.currentTarget.disabled = true;
      GP.google("/admin/").catch(function (err) { loginView(err.message); });
    });
    on("#wbtn", "click", function () { loginView(null, "", "phone"); });
    on("#back", "click", function () {
      if (step === "pcode") loginView(null, "", "phone"); else loginView(null, step === "code" ? email : "");
    });
    on("#pf", "submit", function (e) {
      e.preventDefault();
      var p = fullPhone($("#pcc").value, $("#pn").value);
      if (!p) return loginView("Enter the WhatsApp number with the country code.", "", "phone");
      var done = busy($("#go"), "Sending");
      GP.sendPhoneCode(p).then(function () { loginView(null, p, "pcode"); })
        .catch(function (err) { done(); loginView(err.message, "", "phone"); });
    });
    on("#ef", "submit", function (e) {
      e.preventDefault();
      var em = $("#ee").value.trim().toLowerCase();
      var done = busy($("#go"), "Sending");
      GP.sendCode(em).then(function () { loginView(null, em, "code"); })
        .catch(function (err) { done(); loginView(err.message, em); });
    });
    on("#cf", "submit", function (e) {
      e.preventDefault();
      var c = $("#cc").value.replace(/\D/g, "").slice(-6);
      var done = busy($("#go"), "Checking");
      (wa ? GP.verifyPhoneCode(phone, c) : GP.verifyCode(email, c)).then(boot)
        .catch(function (err) { done(); loginView(err.message, who, step); });
    });
    var first = $("#pn") || $("#cc");
    if (first) first.focus();
  }

  function notTeamView(me) {
    app.className = "";
    app.innerHTML = '<main class="login"><div class="login-card">' +
      '<img class="login-logo" src="/assets/brand/logo.webp" alt="German Plus" width="150" height="57">' +
      "<h1>Not on the team yet</h1><p class=\"sub\">You are signed in as <b>" + esc(me.email || prettyPhone(me.phone)) +
      "</b>, which is not on the German Plus team. Ask a German Plus admin to add you, then sign in again.</p>" +
      '<div class="stack"><button class="btn btn--ink btn--wide" type="button" id="out">' + ic("out") + "Sign in with another account</button>" +
      '<a class="btn btn--ghost btn--sm" href="/">' + ic("back") + "Back to the website</a></div></div></main>";
    on("#out", "click", function () { GP.signOut().then(function () { loginView(); }); });
  }

  /* ------------------------------------------------------------ loading */
  function loadCatalog() {
    return GP.rpc("admin_catalog").then(function (d) {
      S.products = d.products || [];
      S.categories = d.categories || [];
    });
  }
  function loadTeam() { return GP.rpc("team_list").then(function (t) { S.team = t || []; }); }

  function boot() {
    app.className = "boot";
    app.setAttribute("aria-busy", "true");
    app.innerHTML = '<img class="boot-logo" src="/assets/brand/logo.webp" alt="German Plus" width="150" height="57"><span class="spin" aria-hidden="true"></span>';
    return GP.whoami().then(function (me) {
      if (!me) return loginView();
      if (!me.admin) return notTeamView(me);
      S.me = me;
      return Promise.all([loadCatalog(), loadTeam()]).then(function () {
        app.className = "";
        app.removeAttribute("aria-busy");
        shell();
      });
    }).catch(function (err) {
      loginView(GP.nice(err));
    });
  }

  /* ------------------------------------------------------------ the shell */
  var VIEWS = [
    { id: "products", label: "Products", icon: "box" },
    { id: "categories", label: "Categories", icon: "grid" },
    { id: "team", label: "Team", icon: "users" },
    { id: "activity", label: "Activity", icon: "clock" }
  ];
  function viewFromHash() {
    var h = location.hash.replace("#", "");
    return VIEWS.some(function (v) { return v.id === h; }) ? h : "products";
  }
  window.addEventListener("hashchange", function () {
    if (!S.me) return;
    S.view = viewFromHash();
    S.reorder = false;
    shell();
  });

  function meName() { return S.me.name || S.me.email || prettyPhone(S.me.phone); }
  function roleName(r) { return r === "super" ? "Super admin" : "Admin"; }

  function shell() {
    S.view = viewFromHash();
    var nav = function (cls) {
      return VIEWS.map(function (v) {
        var n = v.id === "products" ? S.products.length : v.id === "categories" ? S.categories.length : v.id === "team" ? S.team.length : null;
        return '<a href="#' + v.id + '"' + (S.view === v.id ? ' aria-current="page"' : "") + ">" +
          (cls === "b" ? '<span class="pill">' + ic(v.icon) + "</span>" : ic(v.icon)) + "<span>" + v.label + "</span>" +
          (cls !== "b" && n != null ? '<span class="count">' + n + "</span>" : "") + "</a>";
      }).join("");
    };
    app.innerHTML = '<div class="app">' +
      '<aside class="side"><img class="side-logo" src="/assets/brand/logo-light.webp" alt="German Plus" width="150" height="57">' +
      '<nav aria-label="Admin">' + nav("s") + '</nav><div class="sp"></div>' +
      '<a class="side-site" href="/" target="_blank" rel="noopener">' + ic("ext") + "View the website</a>" +
      '<div class="side-me"><span class="av">' + esc(initials(meName())) + "</span><div><b>" + esc(meName()) + "</b><small>" + roleName(S.me.role) + "</small></div>" +
      '<button class="ibtn" type="button" data-out aria-label="Sign out" title="Sign out">' + ic("out") + "</button></div></aside>" +
      '<div><header class="top"><img class="top-logo" src="/assets/brand/logo.webp" alt="German Plus" width="150" height="57"><span class="sp"></span>' +
      '<a class="ibtn" href="/" target="_blank" rel="noopener" aria-label="View the website">' + ic("ext") + "</a>" +
      '<button class="me-btn" type="button" id="mebtn" aria-label="Account">' + esc(initials(meName())) + "</button></header>" +
      '<main class="main" id="main"></main></div>' +
      '<nav class="bnav" aria-label="Admin">' + nav("b") + "</nav>" +
      (S.view === "products" ? '<button class="fab" type="button" data-new aria-label="Add a product">' + ic("plus") + "</button>" :
       S.view === "team" ? '<button class="fab" type="button" data-newmember aria-label="Add an admin">' + ic("plus") + "</button>" : "") +
      "</div>";
    $$("[data-out]").forEach(function (b) { b.addEventListener("click", signOut); });
    on("#mebtn", "click", accountSheet);
    on("[data-new]", "click", function () { editProduct(null); });
    on("[data-newmember]", "click", function () { editMember(null); });
    draw();
  }

  function signOut() {
    confirmBox("Sign out?", "You can sign in again any time with WhatsApp, Google or email.", "Sign out").then(function (y) {
      if (!y) return;
      GP.signOut().then(function () { S.me = null; loginView(); });
    });
  }
  function accountSheet() {
    var w = layer('<div class="pick-scrim" data-x></div><div class="pick" role="dialog" aria-modal="true" aria-label="Account"><div class="pick-grab"></div>' +
      '<div class="pick-head"><h3>Account</h3><button class="ibtn" type="button" data-x aria-label="Close">' + ic("close") + "</button></div>" +
      '<div class="menu-me"><span class="av">' + esc(initials(meName())) + "</span><div><b>" + esc(meName()) + "</b><small></small></div></div>" +
      '<div class="pick-list"><a class="opt" href="/" target="_blank" rel="noopener">' + ic("ext") + '<span class="grow">View the website</span></a>' +
      '<button class="opt" type="button" data-signout>' + ic("out") + '<span class="grow">Sign out</span></button></div></div>');
    var sm = $(".menu-me small", w); if (sm) sm.textContent = roleName(S.me.role) + (S.me.phone ? ", " + prettyPhone(S.me.phone) : S.me.email ? ", " + S.me.email : "");
    w.addEventListener("click", function (e) {
      if (e.target.closest("[data-signout]")) { closeLayer(w); signOut(); }
      else if (e.target.closest("[data-x]") || e.target.closest("a.opt")) closeLayer(w);
    });
  }

  function draw() {
    var main = $("#main");
    if (!main) return;
    main.onclick = null;
    if (S.view === "products") drawProducts(main);
    else if (S.view === "categories") drawCategories(main);
    else if (S.view === "team") drawTeam(main);
    else drawActivity(main);
  }

  function head(title, sub, acts) {
    return '<div class="head"><div><h1>' + esc(title) + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>" +
      (acts ? '<div class="acts">' + acts + "</div>" : "") + "</div>";
  }

  /* ------------------------------------------------------------ products */
  function catName(key) { var c = S.categories.filter(function (x) { return x.key === key; })[0]; return c ? c.name : key; }
  function imgOf(p) { return p.img || "/assets/products/" + p.id + ".webp"; }
  function productsShown() {
    var q = S.q.trim().toLowerCase();
    return S.products.filter(function (p) {
      if (S.cat !== "all" && p.cat !== S.cat) return false;
      if (S.show === "visible" && !p.visible) return false;
      if (S.show === "hidden" && p.visible) return false;
      if (q && (p.name + " " + (p.labels || "") + " " + (p.short || "") + " " + catName(p.cat)).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function drawProducts(main) {
    var hidden = S.products.filter(function (p) { return !p.visible; }).length;
    var canOrder = S.cat !== "all" && !S.q && S.show === "all";
    main.innerHTML = head("Products", S.products.length + " products" + (hidden ? ", " + hidden + " hidden from the website" : ", all on the website"),
        '<button class="btn btn--p" type="button" data-new2>' + ic("plus") + "Add product</button>") +
      '<div class="tools"><div class="search">' + ic("search") +
        '<label class="sr" for="q">Search products</label><input id="q" class="in" type="search" placeholder="Search products" value="' + esc(S.q) + '" autocomplete="off"></div>' +
        '<div class="chips" role="group" aria-label="Category"><button class="chip" type="button" data-cat="all" aria-pressed="' + (S.cat === "all") + '">All <i>' + S.products.length + "</i></button>" +
        S.categories.map(function (c) {
          return '<button class="chip" type="button" data-cat="' + esc(c.key) + '" aria-pressed="' + (S.cat === c.key) + '">' + esc(c.name) + " <i>" + c.count + "</i></button>";
        }).join("") + "</div>" +
        '<div class="tools-row"><div class="chips" role="group" aria-label="Show">' +
        [["all", "Everything"], ["visible", "On the website"], ["hidden", "Hidden"]].map(function (s) {
          return '<button class="chip" type="button" data-show="' + s[0] + '" aria-pressed="' + (S.show === s[0]) + '">' + s[1] + "</button>";
        }).join("") + "</div>" +
        (canOrder ? '<button class="btn btn--s btn--sm" type="button" data-reorder aria-pressed="' + S.reorder + '">' + ic(S.reorder ? "check" : "sort") + (S.reorder ? "Done" : "Change order") + "</button>" :
          '<span class="note">' + (S.cat === "all" ? "Pick a category to change the order." : "") + "</span>") +
        "</div></div>" +
      '<div id="plist"></div>';
    drawProductList();

    var q = $("#q", main);
    q.addEventListener("input", function () { S.q = q.value; S.reorder = false; drawProductList(); refreshOrderBtn(); });
    main.onclick = function (e) {
      var c = e.target.closest("[data-cat]"), sh = e.target.closest("[data-show]");
      if (c) { S.cat = c.getAttribute("data-cat"); S.reorder = false; drawProducts(main); return; }
      if (sh) { S.show = sh.getAttribute("data-show"); S.reorder = false; drawProducts(main); return; }
      if (e.target.closest("[data-reorder]")) { S.reorder = !S.reorder; drawProducts(main); return; }
      if (e.target.closest("[data-new2]")) editProduct(null);
    };
  }
  function refreshOrderBtn() {
    var b = $("[data-reorder]");
    if (b && S.q) b.style.visibility = "hidden";
  }

  function drawProductList() {
    var box = $("#plist");
    if (!box) return;
    var list = productsShown();
    if (!list.length) {
      box.innerHTML = '<div class="empty"><b>' + (S.products.length ? "No products match" : "No products yet") + "</b>" +
        (S.products.length ? "Try another word or category." : "Add the first product and it shows on the website straight away.") +
        '<br><button class="btn btn--p" type="button" data-new3>' + ic("plus") + "Add product</button></div>";
      on("[data-new3]", "click", function () { editProduct(null); }, box);
      return;
    }
    box.innerHTML = '<div class="grid">' + list.map(function (p, i) {
      return '<article class="pcard' + (p.visible ? "" : " is-hidden") + '" data-id="' + esc(p.id) + '">' +
        '<button class="open" type="button" data-edit="' + esc(p.id) + '" aria-label="Edit ' + esc(p.name) + '"></button>' +
        '<div class="ph"><img src="' + esc(imgOf(p)) + '" alt="" loading="lazy" width="200" height="150"></div>' +
        (p.visible ? "" : '<div class="flags"><span class="badge badge--hidden">' + ic("eyeoff") + "Hidden</span></div>") +
        '<div class="tx"><h3>' + esc(p.name) + '</h3><p class="cat">' + esc(catName(p.cat)) + (p.labels ? ", " + esc(p.labels.split(",").pop().trim()) : "") + "</p></div>" +
        '<div class="side-acts">' +
        (S.reorder ? '<span class="order"><button class="ibtn" type="button" data-move="-1" data-pid="' + esc(p.id) + '" aria-label="Move up"' + (i === 0 ? " disabled" : "") + ">" + ic("up") + "</button>" +
          '<button class="ibtn" type="button" data-move="1" data-pid="' + esc(p.id) + '" aria-label="Move down"' + (i === list.length - 1 ? " disabled" : "") + ">" + ic("down") + "</button></span>" :
          '<label class="switch" title="' + (p.visible ? "On the website" : "Hidden") + '"><input type="checkbox" data-vis="' + esc(p.id) + '"' + (p.visible ? " checked" : "") +
          ' aria-label="Show ' + esc(p.name) + ' on the website"><span class="track"></span></label>') +
        '<button class="ibtn" type="button" data-edit="' + esc(p.id) + '" aria-label="Edit ' + esc(p.name) + '">' + ic("edit") + "</button>" +
        "</div></article>";
    }).join("") + "</div>";

    $$("[data-edit]", box).forEach(function (b) {
      b.addEventListener("click", function () { editProduct(b.getAttribute("data-edit")); });
    });
    $$("[data-vis]", box).forEach(function (cb) {
      cb.addEventListener("change", function () {
        var id = cb.getAttribute("data-vis"), v = cb.checked;
        GP.rpc("set_product_visible", { id: id, visible: v }).then(function (p) {
          replaceProduct(id, p);
          toast(v ? "Showing on the website" : "Hidden from the website");
          drawProductList();
        }).catch(function (err) { cb.checked = !v; toast(err.message, true); });
      });
    });
    $$("[data-move]", box).forEach(function (b) {
      b.addEventListener("click", function () { move(b.getAttribute("data-pid"), Number(b.getAttribute("data-move"))); });
    });
  }

  function replaceProduct(id, p) {
    var i = S.products.findIndex(function (x) { return x.id === id; });
    if (i > -1) S.products[i] = p; else S.products.push(p);
  }

  var orderTimer = null;
  function move(id, dir) {
    var list = S.products.filter(function (p) { return p.cat === S.cat; });
    var i = list.findIndex(function (p) { return p.id === id; }), j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    var t = list[i]; list[i] = list[j]; list[j] = t;
    list.forEach(function (p, n) { p.sort = n; });
    S.products.sort(function (a, b) {
      var ca = catIndex(a.cat), cb = catIndex(b.cat);
      return ca - cb || a.sort - b.sort || a.name.localeCompare(b.name);
    });
    drawProductList();
    var el = $('[data-pid="' + cssEsc(id) + '"][data-move="' + dir + '"]');
    if (el && !el.disabled) el.focus();
    clearTimeout(orderTimer);
    var cat = S.cat, ids = list.map(function (p) { return p.id; });
    orderTimer = setTimeout(function () {
      GP.rpc("reorder_products", { cat: cat, ids: ids }).then(function () { toast("New order saved"); })
        .catch(function (err) { toast(err.message, true); loadCatalog().then(draw); });
    }, 700);
  }
  function catIndex(k) { return S.categories.findIndex(function (c) { return c.key === k; }); }
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }

  /* ---- the product editor ---- */
  function editProduct(id) {
    var p = id ? S.products.filter(function (x) { return x.id === id; })[0] : null;
    if (id && !p) return;
    if (!S.categories.length) { toast("Add a category first, under Categories.", true); return; }
    var f = {
      name: p ? p.name : "", cat: p ? p.cat : (S.cat !== "all" ? S.cat : S.categories[0].key),
      tag: p ? (p.tagOwn || "") : "", labels: p ? p.labels : "", short: p ? p.short : "", desc: p ? p.desc : "",
      spec: p ? (p.spec || []).map(function (s) { return [s[0], s[1]]; }) : [["", ""], ["", ""], ["", ""]],
      visible: p ? p.visible : true, image: p ? (p.image || null) : null,
      preview: p ? imgOf(p) : null
    };
    var body =
      '<div class="photo"><span class="section-t">Photo</span>' +
        '<div class="photo-box' + (f.preview ? " has" : "") + '" id="pbox">' +
          (f.preview ? '<img id="pimg" src="' + esc(f.preview) + '" alt="">' :
            '<div class="photo-empty">' + ic("image") + "<b>Add a product photo</b><span>A cut out photo on a clear or white background looks best. Drop it here or choose one.</span></div>") +
        "</div>" +
        '<div class="photo-acts"><label class="btn btn--s btn--sm">' + ic("upload") + (f.preview ? "Replace photo" : "Choose photo") +
        '<input type="file" id="pfile" accept="image/*" class="sr"></label><span class="hint">JPEG, PNG or WebP. Large photos are made smaller for you.</span></div></div>' +
      '<label class="field"><span>Product name</span><input class="in" id="fname" maxlength="120" required value="' + esc(f.name) + '" placeholder="GP Air Fryer 6.5L"></label>' +
      '<div class="row2"><div class="field"><span>Category</span><button type="button" class="sel" id="fcat"><span class="grow">' + esc(catName(f.cat)) + "</span>" + ic("chev") + "</button></div>" +
        '<label class="field"><span>Label on the photo</span><input class="in" id="ftag" maxlength="40" value="' + esc(f.tag) + '" placeholder="' + esc(catName(f.cat)) + '"><small>Leave empty to show the category.</small></label></div>' +
      '<label class="field"><span>Type line</span><input class="in" id="flabels" maxlength="160" value="' + esc(f.labels) + '" placeholder="Kitchen Appliances, Air Fryers"><small>Shown under the name, and used by search.</small></label>' +
      '<label class="field"><span>Short description</span><input class="in" id="fshort" maxlength="300" value="' + esc(f.short) + '" placeholder="One line about the product"></label>' +
      '<label class="field"><span>Full description</span><textarea class="in" id="fdesc" maxlength="3000" rows="4" placeholder="What it is, what it does, how it looks">' + esc(f.desc) + "</textarea></label>" +
      '<div class="field"><span>Details</span><div class="specs" id="specs"></div>' +
        '<div><button class="btn btn--ghost btn--sm" type="button" id="addspec">' + ic("plus") + "Add a detail</button></div></div>" +
      '<label class="switch"><input type="checkbox" id="fvis"' + (f.visible ? " checked" : "") + '><span class="track"></span><span><b>Show on the website</b><small>Turn off to keep it here without showing it.</small></span></label>';
    var foot = (p ? '<button class="btn btn--bad btn--sm" type="button" id="fdel">' + ic("trash") + "Delete</button>" : "") +
      '<span class="sp"></span><button class="btn btn--s" type="button" data-dclose>Cancel</button>' +
      '<button class="btn btn--p" type="button" id="fsave">' + ic("check") + (p ? "Save" : "Add product") + "</button>";
    var d = drawer(p ? "Edit product" : "Add a product", body, foot);
    var root = d.el;

    function drawSpecs() {
      $("#specs", root).innerHTML = f.spec.map(function (s, i) {
        return '<div class="spec"><input class="in" data-sk="' + i + '" maxlength="60" placeholder="Label" value="' + esc(s[0]) + '" aria-label="Detail ' + (i + 1) + ' label">' +
          '<input class="in" data-sv="' + i + '" maxlength="160" placeholder="Value" value="' + esc(s[1]) + '" aria-label="Detail ' + (i + 1) + ' value">' +
          '<button class="ibtn ibtn--bad" type="button" data-sx="' + i + '" aria-label="Remove detail ' + (i + 1) + '">' + ic("close") + "</button></div>";
      }).join("");
    }
    drawSpecs();
    root.addEventListener("input", function (e) {
      var k = e.target.getAttribute("data-sk"), v = e.target.getAttribute("data-sv");
      if (k != null) f.spec[+k][0] = e.target.value;
      if (v != null) f.spec[+v][1] = e.target.value;
    });
    root.addEventListener("click", function (e) {
      var x = e.target.closest("[data-sx]");
      if (x) { f.spec.splice(+x.getAttribute("data-sx"), 1); drawSpecs(); d.dirty = true; }
    });
    on("#addspec", "click", function () {
      f.spec.push(["", ""]); drawSpecs(); d.dirty = true;
      var last = $$("[data-sk]", root).pop(); if (last) last.focus();
    }, root);
    on("#fcat", "click", function (e) {
      var b = e.currentTarget;
      pick("Category", S.categories.map(function (c) { return { value: c.key, label: c.name, sub: c.count + " products" }; }), f.cat).then(function (v) {
        if (v == null || v === f.cat) return;
        f.cat = v; d.dirty = true;
        $(".grow", b).textContent = catName(v);
        $("#ftag", root).placeholder = catName(v);
      });
    }, root);

    /* photo: choose or drop, made smaller here, then stored straight away */
    var box = $("#pbox", root), fileIn = $("#pfile", root), uploading = false;
    function takeFile(file) {
      if (!file) return;
      if (!/^image\//.test(file.type)) { toast("That is not a photo. Use JPEG, PNG or WebP.", true); return; }
      uploading = true;
      box.insertAdjacentHTML("beforeend", '<div class="photo-busy"><span class="spin"></span>Adding the photo</div>');
      shrink(file).then(function (img) {
        return GP.rpc("add_media", { data: img.b64, mime: img.mime, width: img.w, height: img.h }).then(function (m) {
          f.image = m.id; d.dirty = true;
          box.classList.add("has");
          box.innerHTML = '<img id="pimg" src="' + esc(img.url) + '" alt="">';
          var lab = fileIn.parentNode; if (lab) lab.childNodes[1].textContent = "Replace photo";
        });
      }).catch(function (err) {
        var b = $(".photo-busy", box); if (b) b.remove();
        toast(err.message || "That photo could not be added.", true);
      }).then(function () { uploading = false; fileIn.value = ""; });
    }
    fileIn.addEventListener("change", function () { takeFile(fileIn.files && fileIn.files[0]); });
    ["dragenter", "dragover"].forEach(function (t) { box.addEventListener(t, function (e) { e.preventDefault(); box.classList.add("drag"); }); });
    ["dragleave", "drop"].forEach(function (t) { box.addEventListener(t, function (e) { e.preventDefault(); box.classList.remove("drag"); }); });
    box.addEventListener("drop", function (e) { takeFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });

    on("#fsave", "click", function (e) {
      if (uploading) { toast("Wait for the photo to finish.", true); return; }
      var name = $("#fname", root).value.trim();
      if (!name) { toast("Give the product a name.", true); $("#fname", root).focus(); return; }
      if (!p && !f.image) { toast("Add a photo for the product.", true); return; }
      var payload = {
        id: p ? p.id : "", name: name, cat: f.cat, tag: $("#ftag", root).value, labels: $("#flabels", root).value,
        short: $("#fshort", root).value, desc: $("#fdesc", root).value,
        spec: f.spec.filter(function (s) { return String(s[0]).trim() && String(s[1]).trim(); }),
        visible: $("#fvis", root).checked, image: f.image
      };
      var done = busy(e.currentTarget);
      GP.rpc("save_product", { p: payload, original: p ? p.id : null, expected: p ? p.updated_at : null }).then(function (saved) {
        if (p) replaceProduct(p.id, saved); else S.products.push(saved);
        return loadCatalog();
      }).then(function () {
        toast(p ? "Saved. The website shows it now." : "Added. It is on the website now.");
        d.close(true);
        if (S.view === "products") { var m = $("#main"); if (m) drawProducts(m); }
        shellCounts();
      }).catch(function (err) { done(); toast(err.message, true); });
    }, root);

    on("#fdel", "click", function () {
      confirmBox("Delete " + p.name + "?", "It comes off the website and out of the admin. This cannot be undone. To take it off the website only, turn off Show on the website instead.", "Delete", true).then(function (y) {
        if (!y) return;
        GP.rpc("delete_product", { id: p.id }).then(function () {
          S.products = S.products.filter(function (x) { return x.id !== p.id; });
          return loadCatalog();
        }).then(function () {
          toast("Deleted");
          d.close(true);
          draw(); shellCounts();
        }).catch(function (err) { toast(err.message, true); });
      });
    }, root);
  }

  function shellCounts() {
    $$(".side nav a").forEach(function (a) {
      var id = a.getAttribute("href").slice(1), c = $(".count", a);
      if (!c) return;
      c.textContent = id === "products" ? S.products.length : id === "categories" ? S.categories.length : id === "team" ? S.team.length : c.textContent;
    });
  }

  /* Makes a photo at most 1400px on its longest side, as WebP where the
     browser can (keeping a clear background), else PNG or JPEG. */
  function shrink(file) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var max = 1400, s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        var w = Math.max(1, Math.round(im.naturalWidth * s)), h = Math.max(1, Math.round(im.naturalHeight * s));
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(url);
        function as(type, q) { return new Promise(function (r) { c.toBlob(function (b) { r(b); }, type, q); }); }
        as("image/webp", 0.86).then(function (b) {
          if (b && b.type === "image/webp") return b;
          return as("image/png").then(function (pb) { return pb && pb.size < 2.6e6 ? pb : as("image/jpeg", 0.88); });
        }).then(function (b) {
          if (!b) throw new Error("That photo could not be read.");
          if (b.size > 3e6) throw new Error("That photo is too large even after making it smaller.");
          var r = new FileReader();
          r.onload = function () {
            var s2 = String(r.result);
            ok({ b64: s2.slice(s2.indexOf(",") + 1), mime: b.type, w: w, h: h, url: s2 });
          };
          r.onerror = function () { bad(new Error("That photo could not be read.")); };
          r.readAsDataURL(b);
        }).catch(bad);
      };
      im.onerror = function () { URL.revokeObjectURL(url); bad(new Error("That photo could not be opened. Try a JPEG or PNG.")); };
      im.src = url;
    });
  }

  /* ------------------------------------------------------------ categories */
  function coverImg(c) {
    var key = c.cover || (S.products.filter(function (p) { return p.cat === c.key; })[0] || {}).id;
    var p = S.products.filter(function (x) { return x.id === key; })[0];
    return p ? imgOf(p) : null;
  }
  function drawCategories(main) {
    main.innerHTML = head("Categories", "The groups on the website, in the order they show.",
        '<button class="btn btn--p" type="button" data-newcat>' + ic("plus") + "Add category</button>") +
      '<div class="list">' + (S.categories.length ? S.categories.map(function (c, i) {
        var im = coverImg(c);
        return '<div class="li"><div class="ph">' + (im ? '<img src="' + esc(im) + '" alt="" loading="lazy">' : "") + "</div>" +
          '<div class="tx"><b>' + esc(c.name) + '</b><div class="meta"><span>' + c.count + " product" + (c.count === 1 ? "" : "s") + "</span></div></div>" +
          '<div class="acts"><button class="ibtn" type="button" data-cmove="-1" data-ck="' + esc(c.key) + '" aria-label="Move ' + esc(c.name) + ' up"' + (i === 0 ? " disabled" : "") + ">" + ic("up") + "</button>" +
          '<button class="ibtn" type="button" data-cmove="1" data-ck="' + esc(c.key) + '" aria-label="Move ' + esc(c.name) + ' down"' + (i === S.categories.length - 1 ? " disabled" : "") + ">" + ic("down") + "</button>" +
          '<button class="ibtn" type="button" data-cedit="' + esc(c.key) + '" aria-label="Edit ' + esc(c.name) + '">' + ic("edit") + "</button></div></div>";
      }).join("") : '<div class="empty"><b>No categories yet</b>Add one to start adding products.</div>') + "</div>" +
      '<div class="mobile-add"><button class="btn btn--p btn--wide" type="button" data-newcat>' + ic("plus") + "Add category</button></div>";
    $$("[data-newcat]", main).forEach(function (b) { b.addEventListener("click", function () { editCategory(null); }); });
    $$("[data-cedit]", main).forEach(function (b) { b.addEventListener("click", function () { editCategory(b.getAttribute("data-cedit")); }); });
    $$("[data-cmove]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-ck"), dir = +b.getAttribute("data-cmove");
        var i = catIndex(k), j = i + dir;
        if (j < 0 || j >= S.categories.length) return;
        var t = S.categories[i]; S.categories[i] = S.categories[j]; S.categories[j] = t;
        drawCategories(main);
        var again = $('[data-ck="' + cssEsc(k) + '"][data-cmove="' + dir + '"]'); if (again && !again.disabled) again.focus();
        clearTimeout(orderTimer);
        orderTimer = setTimeout(function () {
          GP.rpc("reorder_categories", { keys: S.categories.map(function (c) { return c.key; }) })
            .then(function () { toast("New order saved"); })
            .catch(function (err) { toast(err.message, true); loadCatalog().then(draw); });
        }, 700);
      });
    });
  }

  function editCategory(key) {
    var c = key ? S.categories.filter(function (x) { return x.key === key; })[0] : null;
    var f = { name: c ? c.name : "", cover: c ? c.cover : null };
    var mine = c ? S.products.filter(function (p) { return p.cat === c.key; }) : [];
    function coverLabel() {
      var p = S.products.filter(function (x) { return x.id === f.cover; })[0];
      return p ? p.name : "The first product in the category";
    }
    var body = '<label class="field"><span>Name</span><input class="in" id="cname" maxlength="60" value="' + esc(f.name) + '" placeholder="Cooking"></label>' +
      (c ? '<div class="field"><span>Photo on the category tile</span><button type="button" class="sel" id="ccover"><span class="grow">' + esc(coverLabel()) + "</span>" + ic("chev") + "</button>" +
        "<small>Pick one of its products.</small></div>" : '<p class="hint">After adding it, pick it as the category when you add or edit products.</p>');
    var foot = (c ? '<button class="btn btn--bad btn--sm" type="button" id="cdel">' + ic("trash") + "Delete</button>" : "") +
      '<span class="sp"></span><button class="btn btn--s" type="button" data-dclose>Cancel</button>' +
      '<button class="btn btn--p" type="button" id="csave">' + ic("check") + (c ? "Save" : "Add category") + "</button>";
    var d = drawer(c ? "Edit category" : "Add a category", body, foot), root = d.el;
    on("#ccover", "click", function (e) {
      var b = e.currentTarget;
      if (!mine.length) { toast("This category has no products yet.", true); return; }
      pick("Photo on the tile", [{ value: "", label: "The first product in the category" }].concat(mine.map(function (p) {
        return { value: p.id, label: p.name, lead: '<img class="thumb" src="' + esc(imgOf(p)) + '" alt="">' };
      })), f.cover || "").then(function (v) {
        if (v == null) return;
        f.cover = v || null; d.dirty = true;
        $(".grow", b).textContent = coverLabel();
      });
    }, root);
    on("#csave", "click", function (e) {
      var name = $("#cname", root).value.trim();
      if (!name) { toast("Give the category a name.", true); return; }
      var done = busy(e.currentTarget);
      GP.rpc("save_category", { c: { key: c ? c.key : "", name: name, cover: f.cover }, original: c ? c.key : null })
        .then(loadCatalog).then(function () {
          toast(c ? "Saved" : "Category added");
          d.close(true); draw(); shellCounts();
        }).catch(function (err) { done(); toast(err.message, true); });
    }, root);
    on("#cdel", "click", function () {
      if (c.count > 0) { toast("Move or delete its " + c.count + " product" + (c.count === 1 ? "" : "s") + " first.", true); return; }
      confirmBox("Delete " + c.name + "?", "The category comes off the website.", "Delete", true).then(function (y) {
        if (!y) return;
        GP.rpc("delete_category", { key: c.key }).then(loadCatalog).then(function () {
          toast("Deleted"); d.close(true); if (S.cat === c.key) S.cat = "all"; draw(); shellCounts();
        }).catch(function (err) { toast(err.message, true); });
      });
    }, root);
  }

  /* ------------------------------------------------------------ team */
  function canManage(m) {
    if (m.me) return false;
    return m.role !== "super" || S.me.super;
  }
  function drawTeam(main) {
    main.innerHTML = head("Team", "Who can sign in here and change the website.",
        '<button class="btn btn--p" type="button" data-addm>' + ic("plus") + "Add admin</button>") +
      '<div class="info">' + ic("shield") + "<span>Super admins can change everything, including other super admins. Admins can change products and categories, and add or remove admins. Nobody but a super admin can remove a super admin.</span></div>" +
      '<div class="list">' + S.team.map(function (m) {
        var cc = m.phone ? ccOf(m.phone) : null;
        return '<div class="li"><span class="av' + (m.role === "super" ? " av--super" : "") + '">' + esc(initials(m.name)) + "</span>" +
          '<div class="tx"><b>' + esc(m.name) + "</b>" +
          '<div class="meta">' + (m.phone ? "<span>" + (cc ? flag(cc[0]) : ic("phone")) + esc(prettyPhone(m.phone)) + "</span>" : "") +
          (m.email ? "<span>" + ic("mail") + esc(m.email) + "</span>" : "") + "</div>" +
          '<div class="badges"><span class="badge ' + (m.role === "super" ? "badge--super" : "badge--admin") + '">' + ic(m.role === "super" ? "star" : "shield") + roleName(m.role) + "</span>" +
          (m.me ? '<span class="badge badge--me">You</span>' : "") + "</div></div>" +
          '<div class="acts">' + (canManage(m) ? '<button class="ibtn" type="button" data-medit="' + esc(m.id) + '" aria-label="Edit ' + esc(m.name) + '">' + ic("edit") + "</button>" +
            '<button class="ibtn ibtn--bad" type="button" data-mdel="' + esc(m.id) + '" aria-label="Remove ' + esc(m.name) + '">' + ic("trash") + "</button>" : "") + "</div></div>";
      }).join("") + "</div>";
    $$("[data-addm]", main).forEach(function (b) { b.addEventListener("click", function () { editMember(null); }); });
    $$("[data-medit]", main).forEach(function (b) { b.addEventListener("click", function () { editMember(b.getAttribute("data-medit")); }); });
    $$("[data-mdel]", main).forEach(function (b) {
      b.addEventListener("click", function () {
        var m = S.team.filter(function (x) { return x.id === b.getAttribute("data-mdel"); })[0];
        confirmBox("Remove " + m.name + "?", "They can no longer sign in to the German Plus admin.", "Remove", true).then(function (y) {
          if (!y) return;
          GP.rpc("remove_member", { id: m.id }).then(loadTeam).then(function () {
            toast(m.name + " removed"); draw(); shellCounts();
          }).catch(function (err) { toast(err.message, true); });
        });
      });
    });
  }

  function editMember(id) {
    var m = id ? S.team.filter(function (x) { return x.id === id; })[0] : null;
    var cc0 = m && m.phone ? (ccOf(m.phone) || [lastCc()])[0] : lastCc();
    var local = m && m.phone ? m.phone.slice(cc0.length) : "";
    var f = { role: m ? m.role : "admin" };
    var roles = [{ value: "admin", label: "Admin", sub: "Products, categories and admins" }];
    if (S.me.super) roles.push({ value: "super", label: "Super admin", sub: "Everything, including super admins" });
    var body = '<label class="field"><span>Name</span><input class="in" id="mname" maxlength="80" value="' + esc(m ? m.name : "") + '" placeholder="Their name"></label>' +
      '<label class="field"><span>WhatsApp number</span><span class="phone">' + ccSelect("mcc", cc0) +
        '<input id="mphone" class="in" type="tel" inputmode="tel" placeholder="Phone number" value="' + esc(local) + '"></span><small>They sign in with a code sent to this number on WhatsApp.</small></label>' +
      '<label class="field"><span>Email (optional)</span><input class="in" id="memail" type="email" autocapitalize="none" value="' + esc(m && m.email ? m.email : "") + '" placeholder="name@example.com"><small>Lets them sign in with Google or an emailed code too.</small></label>' +
      '<div class="field"><span>Role</span><button type="button" class="sel" id="mrole"' + (roles.length < 2 ? " disabled" : "") + '><span class="grow">' + roleName(f.role) + "</span>" + (roles.length > 1 ? ic("chev") : "") + "</button>" +
        (S.me.super ? "" : "<small>Only a super admin can make someone a super admin.</small>") + "</div>" +
      '<div class="info" style="margin:0">' + ic("info") + "<span>Send them the link germanplus.skifi.co/admin. They sign in with WhatsApp" + " or with the email above.</span></div>";
    var foot = '<span class="sp"></span><button class="btn btn--s" type="button" data-dclose>Cancel</button>' +
      '<button class="btn btn--p" type="button" id="msave">' + ic("check") + (m ? "Save" : "Add to the team") + "</button>";
    var d = drawer(m ? "Edit " + m.name : "Add an admin", body, foot), root = d.el;
    on("#mrole", "click", function (e) {
      var b = e.currentTarget;
      pick("Role", roles, f.role).then(function (v) {
        if (v == null) return;
        f.role = v; d.dirty = true; $(".grow", b).textContent = roleName(v);
      });
    }, root);
    on("#msave", "click", function (e) {
      var name = $("#mname", root).value.trim();
      var rawPhone = $("#mphone", root).value.trim();
      var phone = rawPhone ? fullPhone($("#mcc", root).value, rawPhone) : "";
      var email = $("#memail", root).value.trim().toLowerCase();
      if (!name) { toast("Add their name.", true); return; }
      if (rawPhone && !phone) { toast("That number does not look right. Check the country code.", true); return; }
      if (!phone && !email) { toast("Add their WhatsApp number or email.", true); return; }
      var done = busy(e.currentTarget);
      GP.rpc("save_member", { m: { name: name, phone: phone || null, email: email || null, role: f.role }, id: m ? m.id : null })
        .then(loadTeam).then(function () {
          toast(m ? "Saved" : name + " can sign in now");
          d.close(true); draw(); shellCounts();
        }).catch(function (err) { done(); toast(err.message, true); });
    }, root);
  }

  /* ------------------------------------------------------------ activity */
  function drawActivity(main) {
    main.innerHTML = head("Activity", "The latest changes, newest first.") + '<div id="alist"><div class="empty"><span class="spin" style="display:inline-block"></span></div></div>';
    GP.rpc("activity_list").then(function (rows) {
      var box = $("#alist");
      if (!box) return;
      if (!rows.length) { box.innerHTML = '<div class="empty"><b>Nothing yet</b>Changes made here show up in this list.</div>'; return; }
      box.innerHTML = '<div class="list">' + rows.map(function (a) {
        var kind = /^(added|showed)/.test(a.action) ? "add" : /^(deleted|removed|hid)/.test(a.action) ? "del" : "chg";
        return '<div class="li act-li"><span class="dot dot--' + kind + '"></span><div class="tx"><b>' + esc(cap(a.action)) + (a.detail ? ": " + esc(a.detail) : "") + "</b>" +
          '<div class="meta"><span>' + esc(a.who || "") + "</span><span>" + esc(ago(a.at)) + "</span></div></div></div>";
      }).join("") + "</div>";
    }).catch(function (err) {
      var box = $("#alist"); if (box) box.innerHTML = '<div class="empty"><b>Could not load the activity</b>' + esc(err.message) + "</div>";
    });
  }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------------------ start */
  function start() {
    if (!window.GP) return setTimeout(start, 30);
    boot();
  }
  start();
})();
