/* Iris como app (Cerebrus, 2026-11-16): guarda lo básico para abrir sin internet.
   - La página (index.html) se busca primero en internet (así llegan las versiones nuevas) y, si no
     hay conexión, sale la guardada.
   - Las bibliotecas de afuera (three.js, rhino3dm, tipografías) se guardan la primera vez y después
     se usan desde el teléfono.
   Los planos ya abiertos quedan en el teléfono (Iris los guarda en "Recientes"). */
const CAJON = 'iris-v3';   // v3: íconos con nombre nuevo (sin copias viejas guardadas)
const BASICO = ['./', 'index.html', 'iris-app.webmanifest', 'iris-app-180.png', 'iris-app-192.png', 'iris-app-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CAJON).then(c=> c.addAll(BASICO)).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=> Promise.all(ks.filter(k=> k !== CAJON).map(k=> caches.delete(k)))).then(()=> self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin === location.origin){
    // la página: internet primero, guardada si no hay conexión
    e.respondWith(fetch(req).then(r=>{ const copia = r.clone(); caches.open(CAJON).then(c=> c.put(req, copia)); return r; })
      .catch(()=> caches.match(req).then(r=> r || caches.match('index.html'))));
    return;
  }
  if(/(^|\.)(jsdelivr\.net|unpkg\.com|googleapis\.com|gstatic\.com|mcneel\.com)$/.test(url.hostname)){
    // bibliotecas y letras: del teléfono si ya están; si no, de internet y se guardan
    e.respondWith(caches.match(req).then(r=> r || fetch(req).then(res=>{
      if(res.ok || res.type === 'opaque'){ const copia = res.clone(); caches.open(CAJON).then(c=> c.put(req, copia)); }
      return res;
    })));
  }
});
