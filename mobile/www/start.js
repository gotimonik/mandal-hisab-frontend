/*
 * The app's built-in pages (index.html, offline.html) only ever hand over to the website.
 * Always use the website's real address (app-url.js) — never Capacitor.getServerUrl(): on these
 * local pages that's the app's own file address, which reopens this page and gets stuck.
 */
(function () {
  var START = (window.MH_APP_URL || "https://mandalhisab.com").replace(/\/+$/, "") + "/start";
  var leaving = false;
  function $(id) { return document.getElementById(id); }
  function say(id, text) { var el = $(id); if (el) el.textContent = text; }
  window.mhOpen = function () {
    if (navigator.onLine === false) { say("wait", "Still offline — turn on mobile data or Wi-Fi."); return; }
    if (leaving) return;
    leaving = true;
    say("retry", "Opening…");
    location.replace(START);
    // if the network is still waking up, let the person try again
    setTimeout(function () { leaving = false; say("retry", "Try again"); }, 8000);
  };
  // back online: open MandalHisab without a tap
  window.addEventListener("online", function () { setTimeout(window.mhOpen, 800); });
  // take down the launch splash so this page is visible
  try { window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen && window.Capacitor.Plugins.SplashScreen.hide(); } catch (e) {}
})();
