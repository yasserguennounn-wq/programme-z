/* ZEDAM GYM service worker. عند أي تحديث للتطبيق غيّر رقم النسخة V ليتجدد التخزين */
const V="zg-v25";
const SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>m||fetch(r).then(n=>{c.put(r,n.clone());return n}).catch(()=>m))));return}
  if(u.hostname.endsWith(".supabase.co")&&u.pathname.indexOf("/storage/v1/object/public/designs/")==0&&r.destination!=="video"&&!r.headers.has("range")){
    e.respondWith(fetch(r).then(n=>{if(n.ok&&n.type!=="opaque"){const k=n.clone();caches.open(V).then(c=>c.put(r,k))}return n}).catch(()=>caches.match(r).then(m=>m||Response.error())));return}
  if(u.origin!==location.origin)return;
  if(/\.(jpe?g|png|webp|gif)$/i.test(u.pathname)){
    e.respondWith(fetch(r).then(n=>{if(n.ok){const k=n.clone();caches.open(V).then(c=>c.put(r,k))}return n}).catch(()=>caches.match(r).then(m=>m||Response.error())));return}
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(n=>{const k=n.clone();caches.open(V).then(c=>c.put("index.html",k));return n}).catch(()=>caches.match("index.html")));return}
  e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>{const f=fetch(r).then(n=>{if(n.ok)c.put(r,n.clone());return n}).catch(()=>m);return m||f})))
});
