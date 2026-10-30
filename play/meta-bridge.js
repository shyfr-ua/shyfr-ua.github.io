/* SHYFR Meta CAPI opt-in attribution bridge. Inactive until metaBridgeUrl is configured. */
(() => {
  "use strict";
  const cfg=window.SHYFR_ADS_CONFIG||{};
  const endpoint=typeof cfg.metaBridgeUrl==="string" ? cfg.metaBridgeUrl.trim().replace(/\/+$/,"") : "";
  if(!/^https:\/\/[-a-z0-9.]+(?:\/[-a-z0-9/_]*)?$/i.test(endpoint))return;
  const campaign=window.SHYFR_LANDING;
  if(!campaign || !/^lp_meta(?:_[a-z0-9_-]+)?$/.test(campaign.source))return;
  const consentKey="shyfr_measurement_consent_v4";
  const query=new URLSearchParams(window.location.search);
  const clickid=query.get("fbclid")||"";
  const debug=query.get("debug")==="1";
  const debugBox=debug ? document.getElementById("debug") : null;
  function diag(status) {
    if(!debugBox)return;
    let permission="unknown";
    try { permission=localStorage.getItem(consentKey)||"not_chosen"; } catch (_) { permission="unavailable"; }
    const pair=ids();
    const original=debugBox.textContent.split(" | Meta bridge:")[0];
    debugBox.textContent=original+" | Meta bridge: "+status+
      " | consent="+permission+" | _fbc="+(pair.fbc?"yes":"no")+
      " | _fbp="+(pair.fbp?"yes":"no")+" | fbclid="+(clickid?"present":"absent");
  }
  function cookie(name) {
    const hit=document.cookie.split("; ").find((c)=>c.startsWith(name+"="));
    if(!hit)return "";
    return decodeURIComponent(hit.slice(name.length+1));
  }
  function ids() {
    let fbc=cookie("_fbc");
    if(!fbc && clickid && /^[A-Za-z0-9_~-]{4,300}$/.test(clickid))
      fbc="fb.1."+Date.now()+"."+clickid;
    const fbp=cookie("_fbp");
    return {
      fbc:/^fb\.1\.\d{10,16}\.[A-Za-z0-9_~-]{4,300}$/.test(fbc)?fbc:"",
      fbp:/^fb\.1\.\d{10,16}\.[A-Za-z0-9_~-]{4,128}$/.test(fbp)?fbp:""
    };
  }
  let tokenPromise=null;
  async function create() {
    try {
      if(localStorage.getItem(consentKey)!=="yes"){diag("consent_required");return "";}
    } catch (_) {diag("storage_unavailable");return "";}
    const pair=ids();
    if(!pair.fbc&&!pair.fbp){diag("no_valid_meta_ids");return "";}
    diag("requesting_worker");
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),3000);
    try {
      const response=await fetch(endpoint+"/v1/attribution",{
        method:"POST", mode:"cors", cache:"no-store", credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({source:campaign.source,consent:true,...pair}),
        signal:controller.signal
      });
      if(!response.ok){diag("worker_http_"+response.status);return "";}
      const body=await response.json();
      const token=typeof body.token==="string" && /^[A-Za-z0-9_-]{16,32}$/.test(body.token) ? body.token : "";
      diag(token?"token_created":"invalid_worker_response");
      return token;
    }catch(e){diag(e&&e.name==="AbortError"?"worker_timeout":"worker_network_error");return "";}
    finally{clearTimeout(timeout);}
  }
  function resolve() {
    // A new visitor may consent before Meta finishes writing the _fbp cookie.
    // Never cache a failed/empty lookup, so the next click can retry.
    if(!tokenPromise)tokenPromise=create().then((token)=>{
      if(!token)tokenPromise=null;
      return token;
    },()=>{
      tokenPromise=null;
      return "";
    });
    return tokenPromise;
  }
  document.querySelectorAll(".tg-link").forEach((a)=>a.addEventListener("click",async(e)=>{
    if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    try {if(localStorage.getItem(consentKey)!=="yes")return;}catch(_){return;}
    e.preventDefault();
    const fallback=a.href;
    const token=await resolve();
    diag(token?"redirect_ad_token":"redirect_fallback_source");
    window.location.assign(token ? "https://t.me/Shyfr_ua_bot?start=ad_"+encodeURIComponent(token) : fallback);
  },true));
  document.getElementById("consent-allow")?.addEventListener("click",()=>{
    Promise.resolve().then(()=>resolve());
  });
  diag("ready");
  try {if(localStorage.getItem(consentKey)==="yes")resolve();}catch(_){diag("storage_unavailable");}
})();