'use strict';
const CACHE='sicorp-shell-2.1.5',ROOT=new URL('./',self.location.href);
const files=['web/','web/index.html','web/boot.js','app/src/main/assets/index.html','app/src/main/assets/theme.js','app/src/main/assets/simple-ui.js','app/src/main/assets/cloud.js'];
const keys=new Set(files.map(p=>new URL(p,ROOT).pathname));
self.addEventListener('install',e=>e.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(files.map(p=>new Request(new URL(p,ROOT),{cache:'reload'})));await self.skipWaiting();})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('sicorp-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==ROOT.origin||!keys.has(url.pathname))return;
 const key=new URL(url.pathname,ROOT.origin).href;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const r=await fetch(e.request);if(r.ok)await cache.put(key,r.clone());return r;}catch{const old=await cache.match(key);if(old)return old;throw Error('SICORP no está disponible sin conexión en este navegador');}})());
});
