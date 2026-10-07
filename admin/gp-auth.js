/* Sign-in and saving for the German Plus admin.

   Sign-in is the SkiFi login (a WhatsApp code, Google, or an emailed code),
   reached through this site's own /auth/v1, so nothing here holds a secret.
   Who may change what is decided by the database, checked on every save.
   This file only asks and shows. */
(function () {
  "use strict";
  var LIB = "/vendor/supabase.js";
  var client = null, loading = null;

  function load() {
    if (client) return Promise.resolve(client);
    if (loading) return loading;
    loading = new Promise(function (ok, bad) {
      function make() {
        client = window.supabase.createClient(location.origin, "public", {
          auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true,
                  detectSessionInUrl: true, storageKey: "gp-auth" }
        });
        ok(client);
      }
      if (window.supabase && window.supabase.createClient) return make();
      var s = document.createElement("script");
      s.src = LIB; s.async = true;
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) make();
        else { loading = null; bad(new Error("The sign-in part did not load. Reload the page.")); }
      };
      s.onerror = function () { loading = null; bad(new Error("The sign-in part did not load. Check the connection and reload.")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function nice(err) {
    var m = (err && (err.message || err.msg || err.error_description)) || "Something went wrong.";
    if (/not on the team|no account uses this number|not registered|signups not allowed/i.test(m))
      return "This number is not on the German Plus team. Ask a German Plus admin to add it.";
    if (/not available for this country/i.test(m)) return "WhatsApp codes are not available for this country yet. Use email or Google instead.";
    if (/already/i.test(m) && /number|phone/i.test(m)) return "This number is already on another account.";
    if (/not on whatsapp/i.test(m)) return "This number is not on WhatsApp.";
    if (/could not send/i.test(m)) return "We could not send the code on WhatsApp. Try again in a minute.";
    if (/rate limit|too many/i.test(m)) return "Too many tries. Wait a minute and try again.";
    if (/invalid|expired|not right/i.test(m) && /token|otp|code/i.test(m)) return "That code is wrong or has expired. Ask for a new one.";
    if (/jwt|token is expired|not authenticated/i.test(m)) return "Your sign-in ran out. Sign in again.";
    if (/failed to fetch|network/i.test(m)) return "No connection. Check the internet and try again.";
    return m;
  }

  var GP = {
    client: load,
    session: function () {
      return load().then(function (c) { return c.auth.getSession(); })
        .then(function (r) { return (r.data && r.data.session) || null; });
    },
    /* { email, phone, name, id, role, admin, super } for whoever is signed in, or null */
    whoami: function () {
      return GP.session().then(function (s) {
        if (!s) return null;
        return client.rpc("whoami").then(function (r) {
          if (r.error) throw new Error(nice(r.error));
          return r.data;
        });
      });
    },
    google: function (next) {
      return load().then(function (c) {
        return c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + (next || location.pathname) } });
      }).then(function (r) { if (r.error) throw new Error(nice(r.error)); });
    },
    sendCode: function (email) {
      return load().then(function (c) {
        return c.auth.signInWithOtp({ email: String(email).trim().toLowerCase(), options: { shouldCreateUser: true } });
      }).then(function (r) { if (r.error) throw new Error(nice(r.error)); });
    },
    verifyCode: function (email, code) {
      return load().then(function (c) {
        return c.auth.verifyOtp({ email: String(email).trim().toLowerCase(), token: String(code).trim(), type: "email" });
      }).then(function (r) { if (r.error) throw new Error(nice(r.error)); });
    },
    /* WhatsApp codes only go to numbers on the team; any other number is
       turned away before a code is sent. */
    sendPhoneCode: function (phone) {
      return load().then(function (c) {
        return c.rpc("can_sign_in", { phone: phone }).then(function (r) {
          if (r.error) throw new Error(nice(r.error));
          if (!r.data) throw new Error(nice({ message: "not on the team" }));
          return c.auth.signInWithOtp({ phone: phone, options: { shouldCreateUser: true, channel: "whatsapp" } });
        });
      }).then(function (r) { if (r.error) throw new Error(nice(r.error)); });
    },
    verifyPhoneCode: function (phone, code) {
      return load().then(function (c) {
        return c.auth.verifyOtp({ phone: phone, token: String(code).trim(), type: "sms" });
      }).then(function (r) { if (r.error) throw new Error(nice(r.error)); });
    },
    signOut: function () { return load().then(function (c) { return c.auth.signOut(); }); },
    rpc: function (name, args) {
      return load().then(function (c) { return c.rpc(name, args || {}); })
        .then(function (r) { if (r.error) throw new Error(nice(r.error)); return r.data; });
    },
    nice: nice
  };
  window.GP = GP;
})();
