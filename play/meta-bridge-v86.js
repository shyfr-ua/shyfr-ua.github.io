/* SHYFR campaign A: server-only attribution, without a consent dialog or advertising cookies. */
(() => {
  "use strict";
  const cfg = window.SHYFR_ADS_CONFIG || {};
  const endpoint = String(cfg.metaBridgeUrl || "").replace(/\/+$/, "");
  const campaign = window.SHYFR_LANDING;
  if (!/^https:\/\/[-a-z0-9.]+$/i.test(endpoint) || !campaign ||
      !/^lp_meta(?:_[a-z0-9_-]+)?$/.test(campaign.source)) return;
  const query = new URLSearchParams(location.search);
  const click = query.get("fbclid") || "";
  const fbc = /^[A-Za-z0-9_~-]{4,300}$/.test(click)
      ? "fb.1." + Date.now() + "." + click : "";
  const debug = query.get("debug") === "1" ? document.getElementById("debug") : null;
  let promise = null;
  function status(value) {
    if (!debug) return;
    const original = debug.textContent.split(" | Meta bridge:")[0];
    debug.textContent = original + " | Meta bridge: " + value +
      " | fbclid=" + (click ? "present" : "absent") + " | browser_pixel=off";
  }
  async function create() {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), 4200);
    try {
      status("requesting_worker");
      const response = await fetch(endpoint + "/v1/attribution", {
        method: "POST", mode: "cors", credentials: "omit", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: campaign.source, fbc, fbp: "" }),
        signal: ctl.signal
      });
      if (!response.ok) { status("worker_http_" + response.status); return ""; }
      const value = await response.json();
      const token = typeof value.token === "string" && /^[A-Za-z0-9_-]{16,32}$/.test(value.token)
          ? value.token : "";
      status(token ? "token_created" : "invalid_worker_reply");
      return token;
    } catch (e) {
      status(e && e.name === "AbortError" ? "worker_timeout" : "worker_network_error");
      return "";
    } finally { clearTimeout(tm); }
  }
  function resolve() {
    if (!promise) promise = create().then(token => {
      if (!token) promise = null;
      return token;
    }, () => { promise = null; return ""; });
    return promise;
  }
  document.querySelectorAll(".tg-link").forEach(a => a.addEventListener("click", async e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    e.preventDefault();
    const fallback = a.href;
    const token = await resolve();
    location.assign(token ? "https://t.me/Shyfr_ua_bot?start=ad_" + encodeURIComponent(token) : fallback);
  }, true));
  status("ready");
  resolve();
})();