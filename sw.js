const VERSION='sudmar-offline-v29';
const ROOT='/sudmar-diagnostico/';
const CORE=[ROOT,ROOT+'index.html',ROOT+'evaluacion-fabricantes.html',ROOT+'bom-conversion-equipos.html',ROOT+'manifest.json',ROOT+'ai-assistant.js',ROOT+'componentes-registro.js',ROOT+'levantamiento-instalacion.js',ROOT+'alternativas-instalacion.js',...['logo-sudmar.png','logo-prettl.png','logo-endress.png','logo-comap.png'].map(x=>ROOT+'assets/'+x)];
const OPTIONAL=['https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(VERSION);await cache.addAll(CORE);await Promise.allSettled(OPTIONAL.map(url=>cache.add(url)));await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('sudmar-')&&key!==VERSION).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).protocol!=='https:')return;
 const url=new URL(req.url);
 const own=url.origin===self.location.origin&&url.pathname.startsWith(ROOT);
 if(!own&&!OPTIONAL.some(x=>req.url.startsWith(x)))return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  const cached=await cache.match(req,{ignoreSearch:own});
  if(cached){
   if(own)event.waitUntil(fetch(req).then(response=>{if(response.ok)return cache.put(req,response.clone());}).catch(()=>{}));
   return cached;
  }
  try{
   const response=await fetch(req);
   if(response.ok)event.waitUntil(cache.put(req,response.clone()).catch(()=>{}));
   return response;
  }catch{
   if(req.mode==='navigate')return await cache.match(ROOT+'index.html')||Response.error();
   return Response.error();
  }
 })());
});