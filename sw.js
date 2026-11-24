/* ZEDAM GYM service worker. عند أي تحديث للتطبيق غيّر رقم النسخة V ليتجدد التخزين */
const V="zg-v91";
const MD="zg-media"; /* كاش دائم للتصاميم والخطوط والصور: لا يُمسح عند تحديث التطبيق حتى تبقى البرامج تظهر بدون إنترنت */
const SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","maskable-512.png","apple-touch-icon.png"];
/* ملف مخزَّن بالكامل يُقدَّم أيضاً لطلبات المقاطع (Range) حتى يعمل الفيديو بلا إنترنت */
async function rangeOf(hit,rg){const buf=await hit.arrayBuffer(),m=/bytes=(\d*)-(\d*)/.exec(rg||""),len=buf.byteLength;let a=m&&m[1]?+m[1]:0,b=m&&m[2]?+m[2]:len-1;b=Math.min(b,len-1);if(a>b)a=0;
  return new Response(buf.slice(a,b+1),{status:206,headers:{"Content-Type":hit.headers.get("Content-Type")||"video/mp4","Content-Range":"bytes "+a+"-"+b+"/"+len,"Content-Length":String(b-a+1),"Accept-Ranges":"bytes"}})}
async function designRes(r,hasV){const c=await caches.open(MD),key=new Request(r.url),rg=r.headers.get("range");
  if(hasV){const hit=await c.match(key);if(hit)return rg?rangeOf(hit,rg):hit}
  try{const n=await fetch(r);if(!rg&&n.ok&&n.type!=="opaque")c.put(key,n.clone());return n}
  catch(_){const hit=await c.match(key);if(hit)return rg?rangeOf(hit,rg):hit;return Response.error()}}
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==MD).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(MD).then(c=>c.match(r).then(m=>m||fetch(r).then(n=>{c.put(r,n.clone());return n}).catch(()=>m))));return}
  if(u.hostname.endsWith(".supabase.co")&&u.pathname.indexOf("/storage/v1/object/public/designs/")==0){e.respondWith(designRes(r,u.searchParams.has("v")));return}
  if(u.origin!==location.origin)return;
  if(/\.(jpe?g|png|webp|gif)$/i.test(u.pathname)){
    e.respondWith(fetch(r).then(n=>{if(n.ok){const k=n.clone();caches.open(MD).then(c=>c.put(r,k))}return n}).catch(()=>caches.match(r).then(m=>m||Response.error())));return}
  if(r.mode==="navigate"){
    /* الشبكة أولاً لكن بمهلة 4 ثوانٍ: مع إنترنت ضعيف أو منقطع تفتح النسخة المحفوظة فوراً */
    e.respondWith((async()=>{const c=await caches.open(V);try{const n=await Promise.race([fetch(r),new Promise((_,j)=>setTimeout(j,4000))]);if(n&&n.ok)c.put("index.html",n.clone());return n}catch(_){return(await c.match("index.html"))||(await c.match("./"))||Response.error()}})());return}
  e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{const f=fetch(r).then(n=>{if(n.ok)c.put(r,n.clone());return n}).catch(()=>m);return m||f})))
});

/* ===== الإشعارات ===== */
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(_){d={body:e.data?e.data.text():""}}
  e.waitUntil(self.registration.showNotification(d.title||"ZEDAM GYM",{body:d.body||"",icon:"icon-192.png",badge:"icon-192.png",dir:"rtl",lang:"ar",data:{url:d.url||"./"}}))});
const SBU="https://uyiuenajzelulcfbrhab.supabase.co",SBK="sb_publishable_fQKoZUfJ1X-A8KyAgcou2A_dbEgmrMj";
self.addEventListener("notificationclick",e=>{e.notification.close();
  const cnt=fetch(SBU+"/rest/v1/rpc/push_click",{method:"POST",keepalive:true,headers:{apikey:SBK,"Content-Type":"application/json"},body:JSON.stringify({p_body:(e.notification.body||"").trim()})}).catch(()=>{});
  e.waitUntil(cnt);
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus" in c)return c.focus()}return self.clients.openWindow((e.notification.data&&e.notification.data.url)||"./")}))});
