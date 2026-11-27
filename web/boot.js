'use strict';
const f=document.getElementById('app'),loading=document.getElementById('loading');
const revision=Date.now().toString(),asset=file=>{const url=new URL('../app/src/main/assets/'+file,location.href);url.searchParams.set('v',revision);return url.href;};
let started=false;
async function boot(){
 if(started)return;
 const d=f.contentDocument;if(!d||!d.getElementById('grid'))return;
 started=true;
 try{
  for(const file of ['theme.js','simple-ui.js','cloud.js'])await new Promise((resolve,reject)=>{const s=d.createElement('script');s.src=asset(file);s.onload=resolve;s.onerror=reject;d.head.append(s);});
  if(!d.getElementById('sicorp-cloud'))throw Error('Cloud adapter missing');
  f.style.visibility='visible';loading.remove();
 }catch{loading.textContent='No se pudo cargar SICORP. Recarga la página.';}
}
f.addEventListener('load',boot);
f.src=asset('index.html');
