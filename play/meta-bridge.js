/* SHYFR Meta CAPI opt-in attribution bridge. Inactive until metaBridgeUrl is configured. */
(() => {
  "use strict";
  const cfg=window.SHYFR_ADS_CONFIG||{};
  const endpoint=typeof cfg.metaBridgeUrl==="string" ? cfg.metaBridgeUrl.trim().replace(/\/+$/,"") : "";
  if(!/^https:\/\/[-a-z0-9.]+(?:\/[-a-z0-9/_]*)?$/i.test(endpoint))return;
  const campaign=window.SHYFR_LANDING;
  if(!campaign || !/^lp_meta(?:_[a-z0-9_-]+)?$/.test(campaign.source))return;
  const consentKey="shyfr_measurement_consent_v3";
  const query=new URLSearchParams(window.location.search);
  const clickid=query.get("fbclid")||"";
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
      if(localStorage.getItem(consentKey)!=="yes")return "";
    } catch (_) {return "";}
    const pair=ids();
    if(!pair.fbc&&!pair.fbp)return "";
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),3000);
    try {
      const response=await fetch(endpoint+"/v1/attribution",{
        method:"POST", mode:"cors", cache:"no-store", credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({source:campaign.source,consent:true,...pair}),
        signal:controller.signal
      });
      if(!response.ok)return "";
      const body=await response.json();
      return typeof body.token==="string" && /^[A-Za-z0-9_-]{16,32}$/.test(body.token) ? body.token : "";
    }catch(_){return "";}finally{clearTimeout(timeout);}
  }
  function resolve() {
    if(!tokenPromise)tokenPromise=create();
    return tokenPromise;
  }
  document.querySelectorAll(".tg-link").forEach((a)=>a.addEventListener("click",async(e)=>{
    if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    try {if(localStorage.getItem(consentKey)!=="yes")return;}catch(_){return;}
    e.preventDefault();
    const fallback=a.href;
    const token=await resolve();
    window.location.assign(token ? "https://t.me/Shyfr_ua_bot?start=ad_"+encodeURIComponent(token) : fallback);
  },true));
  document.getElementById("consent-allow")?.addEventListener("click",()=>{
    Promise.resolve().then(()=>resolve());
  });
  try {if(localStorage.getItem(consentKey)==="yes")resolve();}catch(_){}
})();