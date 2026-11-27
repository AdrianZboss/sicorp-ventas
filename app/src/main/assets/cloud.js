/* Shared cloud adapter for the original SICORP interface. */
(function(){
'use strict';
if(document.getElementById('sicorp-cloud'))return;
const cfg={"url":"https://jooxurfzxumbyjdcmzjs.supabase.co","publishableKey":"sb_publishable_ZYRZ5ji-puffBS1P46VlWA_Z8pEstps","ownerEmail":"admin@sicorp-ventas.example.com"};
const native=!!(window.Native&&typeof Native.cloudSave==='function');
const clone=x=>JSON.parse(JSON.stringify(x));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function canonical(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Historial inválido');
 const out={};
 for(const d of Object.keys(input).sort()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Array.isArray(input[d]))throw Error('Fecha inválida');
  const seen=new Set(),rows=[];
  for(const x of input[d]){
   const id=String(x.id),v=x.v,q=x.q,p=catalog.find(p=>p.id===id);
   if(!p||!Number.isInteger(v)||!p.variants[v]||!Number.isSafeInteger(q)||q<1||seen.has(id+'|'+v))throw Error('Referencia inválida: '+id);
   seen.add(id+'|'+v);rows.push({id,v,q});
  }
  if(rows.length)out[d]=rows.sort((a,b)=>a.id.localeCompare(b.id)||a.v-b.v);
 }
 return out;
}
const encode=x=>JSON.stringify(canonical(x));
const empty=x=>!Object.keys(x).length;
const equal=(a,b)=>encode(a)===encode(b);
const uuid=()=>{const a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const s=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20)};
const flat=o=>{const m=new Map();for(const [d,rs] of Object.entries(canonical(o)))for(const x of rs)m.set(d+'|'+x.id+'|'+x.v,x.q);return m};
function merge(b,l,r,initial){
 const base=flat(b),local=flat(l),remote=flat(r),out={},conflicts=[];
 for(const k of new Set([...base.keys(),...local.keys(),...remote.keys()])){
  const x=base.get(k)||0,y=local.get(k)||0,z=remote.get(k)||0;
  let n;
  if(y===x)n=z;else if(z===x)n=y;
  else if(initial){conflicts.push(k);n=y+z;}
  else if(y>x&&z>x)n=y+z-x;
  else if(y===z)n=y;
  else{conflicts.push(k);n=y;}
  if(!Number.isSafeInteger(n)||n<0)throw Error('Cantidad fuera de rango');
  if(n){const [d,id,v]=k.split('|');(out[d]??=[]).push({id,v:Number(v),q:n});}
 }
 return {records:canonical(out),conflicts};
}
let meta={base:null,pending:null},session=null,epoch=0,busy=false,conflict=false,callbacks=new Map(),seq=0,timer,expiry;
try{if(native){const m=JSON.parse(Native.cloudMeta()||'{}');if(m.base&&Number.isSafeInteger(m.base.revision)){m.base.records=canonical(m.base.records);meta.base=m.base;}if(m.pending){m.pending.records=canonical(m.pending.records);meta.pending=m.pending;}}else records={};records=canonical(records);}catch(e){conflict=true;}
let last=clone(records);
const element=(tag,t)=>{const n=document.createElement(tag);if(t!==undefined)n.textContent=t;return n;};
const style=element('style');style.textContent=`
#sicorp-cloud{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}
#sicorp-cloud button{min-height:40px;padding:8px 12px;border-radius:12px;background:var(--selected);color:var(--accent)}
#sicorp-cloud-status{flex:1;font-size:12px;color:var(--muted)}
#sicorp-cloud-login{
 box-sizing:border-box;width:min(calc(100vw - 32px),420px);max-width:calc(100vw - 32px);
 max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);margin:auto;padding:0;
 border:1px solid #2e6572;border-radius:3px 24px 3px 24px;overflow:auto;
 color:#e6fbff;background:#0b111b;color-scheme:dark;
 box-shadow:0 0 0 4px #0a1826,0 0 0 5px #29404e,0 22px 80px #000b,0 0 36px #26e6e71c;
}
#sicorp-cloud-login::backdrop{
 background:radial-gradient(ellipse at 20% 15%,#10313d 0%,transparent 54%),radial-gradient(ellipse at 90% 90%,#351b48 0%,transparent 58%),repeating-linear-gradient(0deg,transparent 0 31px,#1c35402b 31px 32px),repeating-linear-gradient(90deg,transparent 0 31px,#1c35402b 31px 32px),#070b12;
}
#sicorp-cloud-login form{display:grid;gap:14px;margin:0;padding:24px;position:relative;overflow:hidden;text-align:left}
#sicorp-cloud-login form::before{content:"";position:absolute;top:0;left:0;width:45%;height:3px;background:linear-gradient(90deg,#45f7e3 0 76%,#ed67dc 76% 90%,transparent 90%)}
#sicorp-cloud-login .cyber-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
#sicorp-cloud-login .cyber-id{font:700 10px/1.4 ui-monospace,monospace;letter-spacing:1.7px;color:#7cbdc9}
#sicorp-cloud-login .cyber-badge{display:flex;align-items:center;gap:7px;border:1px solid #32514f;padding:5px 7px;color:#9ce7d6;font:700 9px/1.2 ui-monospace,monospace;letter-spacing:.8px;white-space:nowrap}
#sicorp-cloud-login .cyber-badge::before{content:"";width:6px;height:6px;background:#56f1cb;box-shadow:0 0 9px #56f1cb}
#sicorp-cloud-login .cyber-brand{margin:5px 0 0;font:800 clamp(32px,8vw,46px)/.97 system-ui,sans-serif;letter-spacing:-2.5px;color:#f1fcff}
#sicorp-cloud-login .cyber-brand span{display:block;color:#42e8db;font-size:.58em;letter-spacing:6px;line-height:1.5}
#sicorp-cloud-login .cyber-rule{height:1px;background:linear-gradient(90deg,#44eadb,#2a3e52 65%,#d960bb)}
#sicorp-cloud-login .cyber-label{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#a8c7d7;font:700 11px/1.4 ui-monospace,monospace;letter-spacing:1.5px}
#sicorp-cloud-login input{box-sizing:border-box;width:100%;margin:0;min-height:62px;padding:10px 16px;background:#070d16;color:#e5fff9;border:1px solid #396678;border-radius:3px 12px 3px 12px;font:600 24px/1.2 ui-monospace,monospace;letter-spacing:5px;text-align:center;caret-color:#5bffe1;outline:none}
#sicorp-cloud-login input::placeholder{color:#688291;font-size:12px;letter-spacing:2px;font-weight:500}
#sicorp-cloud-login input:focus{border-color:#54f2de;box-shadow:0 0 0 2px #54f2de30,0 0 18px #54f2de13}
#sicorp-cloud-login button{box-sizing:border-box;min-height:48px;margin:0}
#sicorp-cloud-login button:focus-visible{outline:2px solid #f6b8ff;outline-offset:3px}
#sicorp-cloud-login .cyber-keyboard{width:auto;min-height:30px;padding:4px 9px;border:1px solid #355468;background:#121e2c;color:#9aece2;border-radius:3px;font:700 11px/1 ui-monospace,monospace;letter-spacing:.5px}
#sicorp-cloud-login .cyber-enter{width:100%;border:1px solid #6bffdf;border-radius:3px 12px 3px 12px;background:#4ef1d7;color:#071a20;font-size:14px;font-weight:850;letter-spacing:2px;box-shadow:0 0 20px #4ef1d726}
#sicorp-cloud-login .cyber-enter:disabled{opacity:.55}
#sicorp-cloud-login .cyber-local{width:100%;border:1px solid #394e60;background:#111b29;color:#9cb6c8;border-radius:3px 12px 3px 12px;font-size:12px}
#sicorp-cloud-login .cyber-message{margin:0;min-height:18px;font-size:12px;line-height:1.4;color:#a5bccc;white-space:pre-wrap;overflow-wrap:anywhere}
#sicorp-cloud-login .cyber-foot{display:flex;justify-content:space-between;gap:8px;margin-top:0;color:#6f9aaa;font:600 9px/1.4 ui-monospace,monospace;letter-spacing:1.2px}
#sicorp-cloud-login .cyber-foot span:last-child{color:#e697d6}
#sicorp-cloud-login [hidden],#sicorp-cloud [hidden]{display:none!important}
@media(max-height:480px){#sicorp-cloud-login form{gap:9px;padding:16px 20px}#sicorp-cloud-login .cyber-brand{font-size:30px}#sicorp-cloud-login input{min-height:48px}}
`;
document.head.append(style);
const bar=element('div');bar.id='sicorp-cloud';const badge=element('span');badge.id='sicorp-cloud-status';const syncButton=element('button','Conectar nube'),logoutButton=element('button','Cerrar sesión');syncButton.type=logoutButton.type='button';logoutButton.hidden=true;bar.append(badge,syncButton,logoutButton);document.querySelector('header').append(bar);
const login=element('dialog');login.id='sicorp-cloud-login';
const form=element('form'),title=element('h2','SICORP'),msg=element('p','Acceso privado con tu clave maestra.'),pass=element('input'),enter=element('button','ACCEDER  ›'),local=element('button','Continuar sin conexión');
const top=element('div'),id=element('span','S // V · TERMINAL 01'),secure=element('span','PRIVADO'),brandLine=element('span','VENTAS'),rule=element('div'),labelRow=element('div'),label=element('label','CLAVE DE ACCESO'),keyboard=element('button','ABC'),foot=element('div');
top.className='cyber-top';id.className='cyber-id';secure.className='cyber-badge';top.append(id,secure);
title.className='cyber-brand';title.id='sicorp-login-title';title.append(brandLine);login.setAttribute('aria-labelledby',title.id);
rule.className='cyber-rule';rule.setAttribute('aria-hidden','true');
labelRow.className='cyber-label';label.htmlFor='sicorp-login-key';keyboard.type='button';keyboard.className='cyber-keyboard';keyboard.setAttribute('aria-label','Cambiar a teclado completo');labelRow.append(label,keyboard);
pass.id='sicorp-login-key';pass.type='password';pass.inputMode='numeric';pass.setAttribute('enterkeyhint','go');pass.autocapitalize='off';pass.spellcheck=false;pass.required=true;pass.autocomplete='off';pass.placeholder='INTRODUCE TU CLAVE';pass.setAttribute('aria-label','Clave maestra');pass.setAttribute('aria-describedby','sicorp-login-message');
keyboard.onclick=()=>{const numeric=pass.inputMode==='numeric';pass.inputMode=numeric?'text':'numeric';keyboard.textContent=numeric?'123':'ABC';keyboard.setAttribute('aria-label',numeric?'Cambiar a teclado numérico':'Cambiar a teclado completo');pass.focus();};
msg.id='sicorp-login-message';msg.className='cyber-message';msg.setAttribute('role','status');
enter.type='submit';enter.className='cyber-enter';local.type='button';local.className='cyber-local';local.hidden=!native;
foot.className='cyber-foot';foot.append(element('span','ACCESO SEGURO'),element('span','SYS / 2.0'));foot.setAttribute('aria-hidden','true');
form.append(top,title,rule,msg,labelRow,pass,enter,local,foot);login.append(form);document.body.append(login);
login.addEventListener('cancel',e=>{if(!native)e.preventDefault();});local.onclick=()=>login.close();
function status(s){badge.textContent=s;}
function save(){
 try{const v=canonical(records);if(native&&!Native.cloudSave(JSON.stringify(v),JSON.stringify(meta)))throw Error('No se pudo guardar');last=clone(v);return true;}catch(e){return false;}
}
function rollbackLocal(){records=clone(last);render();}
function dirty(){return !!meta.pending||!meta.base||!equal(records,meta.base.records);}
function showLogin(){if(!login.open){pass.inputMode='numeric';keyboard.textContent='ABC';keyboard.setAttribute('aria-label','Cambiar a teclado completo');pass.value='';login.showModal();}else pass.value='';}
function resetIdle(){if(native)return;clearTimeout(timer);if(session)timer=setTimeout(()=>endSession(true),300000);}
for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,resetIdle,{passive:true});
function endSession(automatic){
 const pending=dirty()&&(!meta.base||!empty(records)||meta.pending);
 if(!native&&!automatic&&pending&&!confirm('Hay cambios sin confirmar en la nube. ¿Cerrar sesión de todas formas?'))return;
 const old=session;session=null;epoch++;busy=false;clearTimeout(timer);clearTimeout(expiry);
 if(!native){if($('modal').open)$('modal').close();records={};last={};meta={base:null,pending:null};conflict=false;$('restoretext').value='';render();showLogin();}
 evidence.hidden=true;fileList.replaceChildren();file.value='';syncButton.textContent='Conectar nube';logoutButton.hidden=true;status(pending&&!native?'Sesión cerrada; verifica cambios pendientes.':'Sin conexión a la nube');
 if(old)request('/auth/v1/logout?scope=local','POST',null,old.access_token).catch(()=>{});
}
window.addEventListener('beforeunload',e=>{if(!native&&session&&dirty()){e.preventDefault();e.returnValue='';}});
window.sicorpCloudReceive=(id,code,body)=>{const f=callbacks.get(id);if(f){callbacks.delete(id);f(Number(code),body);}};
async function request(path,method='GET',body=null,token=session?.access_token){
 let code,raw;
 if(native){
  [code,raw]=await new Promise((resolve,reject)=>{const id=String(++seq);const t=setTimeout(()=>{callbacks.delete(id);reject(Error('Tiempo de conexión agotado'));},35000);callbacks.set(id,(c,b)=>{clearTimeout(t);resolve([c,b]);});try{Native.cloudRequest(id,path,method,token||'',body===null?'':JSON.stringify(body));}catch(e){clearTimeout(t);callbacks.delete(id);reject(e);}});
 }else{
  const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),25000);
  try{const r=await fetch(cfg.url+path,{method,headers:{apikey:cfg.publishableKey,...(token?{Authorization:'Bearer '+token}:{}),...(body!==null?{'Content-Type':'application/json'}:{})},body:body===null?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store',signal:ctrl.signal,referrerPolicy:'no-referrer'});code=r.status;raw=await r.text();}finally{clearTimeout(t);}
 }
 if(code<200||code>=300){const e=Error('Conexión rechazada ('+code+')');e.code=code;throw e;}
 return raw?JSON.parse(raw):null;
}
async function pull(){const rows=await request('/rest/v1/sicorp_history?select=revision,records');if(!Array.isArray(rows)||rows.length>1)throw Error('Respuesta de historial inválida');return rows.length?{revision:Number(rows[0].revision),records:canonical(rows[0].records)}:{revision:0,records:{}};}
function adopt(remote){
 if(!Number.isSafeInteger(remote.revision)||remote.revision<0)throw Error('Revisión inválida');
 const prevMeta=clone(meta),prev=clone(records);
 let result;
 if(!meta.base){
  if(empty(records)||equal(records,remote.records))result={records:remote.records,conflicts:[]};
  else result=merge({},records,remote.records,true);
  if(result.conflicts.length&&!confirm('El historial de este teléfono y la nube contienen las mismas fechas y productos. ¿Son ventas independientes que deseas SUMAR? Si son copias, cancela. No se sobrescribirá nada.')){conflict=true;status('Importación pendiente: historial coincidente.');return false;}
 }else{
  result=merge(meta.base.records,records,remote.records,false);
  if(result.conflicts.length){conflict=true;status('Conflicto de cantidades: no se ha sobrescrito ningún historial.');return false;}
 }
 meta.base=clone(remote);meta.pending=null;records=result.records;conflict=false;
 if(!save()){meta=prevMeta;records=prev;throw Error('No se pudo guardar el historial');}render();return true;
}
async function sync(){
 if(!session||busy)return;
 busy=true;const e=epoch;status('Sincronizando…');
 try{
  // Resolve ambiguous previous requests before pulling a new base.
  if(!meta.pending){
   const remote=await pull();if(e!==epoch||!session)return;
   if(!meta.base||remote.revision!==meta.base.revision){if(!adopt(remote))return;}
  }
  if(!meta.pending&&equal(records,meta.base.records)){status('☁ Sincronizado');return;}
  if(!meta.pending){
   meta.pending={id:uuid(),expected:meta.base.revision,records:canonical(records)};
   if(!save()){meta.pending=null;throw Error('No se pudo conservar la operación');}
  }
  const p=clone(meta.pending);
  const response=await request('/rest/v1/rpc/sicorp_sync_commit','POST',{p_expected:p.expected,p_records:p.records,p_request:p.id});
  if(e!==epoch||!session)return;
  if(response.applied===true){
   meta.base={revision:Number(response.revision),records:p.records};meta.pending=null;
   if(!save()){meta.pending=p;throw Error('Confirmación local pendiente');}
   status(equal(records,p.records)?'☁ Sincronizado':'Cambios pendientes');
  }else if(response.applied===false){
   meta.pending=null;
   if(!adopt({revision:Number(response.revision),records:canonical(response.records)})){save();return;}
   status('Cambios combinados; sincronización pendiente');
  }else throw Error('Respuesta inesperada');
 }catch(err){if(e===epoch){if(err.code===401){endSession(true);showLogin();msg.textContent='Sesión vencida. Ingresa tu clave.';}else status('Sin confirmar · '+(err.message||'Reintentar'));}}
 finally{if(e===epoch)busy=false;}
}

// Shared private evidence panel (file chooser is native on Android).
const evidence=element('section');evidence.className='card';evidence.hidden=true;
const eh=element('h2','Evidencias privadas'),desc=element('p','Fotografías y PDF · máximo 10 MB por archivo');desc.className='muted';
const file=element('input'),upload=element('button','Subir evidencia'),refreshFiles=element('button','Actualizar archivos'),fileList=element('div');
file.type='file';file.accept='image/jpeg,image/png,image/webp,application/pdf';file.hidden=native;upload.type=refreshFiles.type='button';upload.className='full primary';refreshFiles.className='full';evidence.append(eh,desc,file,upload,refreshFiles,fileList);$('history').append(evidence);
const validMime=['image/jpeg','image/png','image/webp','application/pdf'];
function safeName(name){return String(name).replace(/[^a-zA-Z0-9_.-]/g,'_').slice(-100)||'archivo';}
function validKey(name){return /^[a-f0-9-]{36}-[a-zA-Z0-9_.-]{1,100}$/.test(name);}
function evidenceStatus(s){status(s);notify(s);}
async function listFiles(){
 if(!session)return;const e=epoch;
 try{
  const rows=await request('/storage/v1/object/list/sicorp-evidence','POST',{prefix:session.user.id,limit:100,offset:0,sortBy:{column:'created_at',order:'desc'}});
  if(e!==epoch||!session)return;fileList.replaceChildren();
  for(const x of rows){if(!x.id||!validKey(x.name))continue;const b=element('button',x.name.slice(37));b.type='button';b.className='historybtn';b.onclick=()=>downloadEvidence(x.name,x.metadata?.mimetype);fileList.append(b);}
  if(!fileList.children.length)fileList.append(element('p','Sin evidencias.'));
 }catch(e){fileList.textContent='No se pudieron consultar las evidencias.';}
}
async function downloadEvidence(name,mime){
 if(!session||!validKey(name))return;
 if(native){Native.cloudEvidenceDownload(session.user.id,session.access_token,name,validMime.includes(mime)?mime:'application/octet-stream');return;}
 const e=epoch;try{const r=await fetch(cfg.url+'/storage/v1/object/authenticated/sicorp-evidence/'+session.user.id+'/'+encodeURIComponent(name),{headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+session.access_token},cache:'no-store',credentials:'omit'});if(!r.ok)throw Error();const blob=await r.blob();if(e!==epoch||!session)return;const link=element('a'),url=URL.createObjectURL(blob);link.href=url;link.download=name.slice(37);link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{if(e===epoch)evidenceStatus('No se pudo descargar la evidencia.');}
}
upload.onclick=async()=>{
 if(!session)return;
 if(native){Native.cloudEvidenceUpload(session.user.id,session.access_token);return;}
 const f=file.files[0];if(!f)return;if(!validMime.includes(f.type)||f.size>10485760){evidenceStatus('Formato inválido o mayor a 10 MB.');return;}
 const e=epoch;upload.disabled=true;
 try{const name=uuid()+'-'+safeName(f.name);const r=await fetch(cfg.url+'/storage/v1/object/sicorp-evidence/'+session.user.id+'/'+encodeURIComponent(name),{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':f.type,'x-upsert':'false'},body:f,credentials:'omit',cache:'no-store'});if(!r.ok)throw Error();if(e===epoch&&session){file.value='';evidenceStatus('Evidencia guardada');await listFiles();}}catch{if(e===epoch)evidenceStatus('No se confirmó la subida.');}finally{upload.disabled=false;}
};
refreshFiles.onclick=listFiles;
window.sicorpEvidenceResult=(ok,message)=>{if(session){evidenceStatus(message);if(ok)listFiles();}};

const originalPersist=persist;
persist=function(){
 if(!native&&!session){rollbackLocal();notify('Inicia sesión para guardar.');return false;}
 if(!save()){rollbackLocal();notify('No se pudo guardar el historial.');return false;}
 if(session){status('Cambios pendientes');setTimeout(sync,0);}else status('Guardado en este dispositivo');
 return true;
};
form.onsubmit=async ev=>{
 ev.preventDefault();if(enter.disabled)return;enter.disabled=true;msg.textContent='Verificando acceso…';const secret=pass.value;pass.value='';
 try{
  const s=await request('/auth/v1/token?grant_type=password','POST',{email:cfg.ownerEmail,password:secret},'');
  if(!s?.access_token||s.user?.app_metadata?.sicorp_admin!==true)throw Error('Cuenta no autorizada');
  session=s;epoch++;resetIdle();clearTimeout(expiry);expiry=setTimeout(()=>{endSession(true);if(!native)showLogin();},Math.max(1000,(s.expires_in||3600)*1000-10000));
  login.close();syncButton.textContent='Sincronizar';logoutButton.hidden=false;evidence.hidden=false;await sync();listFiles();
 }catch(e){msg.textContent='No se pudo acceder. Comprueba tu clave y conexión.';}finally{enter.disabled=false;}
};
syncButton.onclick=()=>session?sync():showLogin();logoutButton.onclick=()=>endSession(false);
setInterval(()=>{if(session&&!conflict)sync();},12000);window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&session)sync();});
status(native?'Historial local · conecta la nube':'Acceso privado');render();if(!native)showLogin();else if(!meta.base)showLogin();
})();
