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
const style=element('style');style.textContent='#sicorp-cloud{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}#sicorp-cloud button{min-height:40px;padding:8px 12px;border-radius:12px;background:var(--selected);color:var(--accent)}#sicorp-cloud-status{flex:1;font-size:12px;color:var(--muted)}#sicorp-cloud-login{width:min(92vw,420px);padding:22px;border:1px solid var(--line);border-radius:22px;background:var(--surface);color:var(--text)}#sicorp-cloud-login input{width:100%;margin:14px 0;min-height:48px}#sicorp-cloud-login::backdrop{background:#071324e8}#sicorp-cloud-login h2{margin:0 0 12px}#sicorp-cloud-login button{min-height:46px;margin-top:8px}#sicorp-cloud-login p{font-size:13px;color:var(--muted);white-space:pre-wrap}';
document.head.append(style);
const bar=element('div');bar.id='sicorp-cloud';const badge=element('span');badge.id='sicorp-cloud-status';const syncButton=element('button','Conectar nube'),logoutButton=element('button','Cerrar sesión');syncButton.type=logoutButton.type='button';logoutButton.hidden=true;bar.append(badge,syncButton,logoutButton);document.querySelector('header').append(bar);
const login=element('dialog');login.id='sicorp-cloud-login';
const form=element('form'),title=element('h2','SICORP Ventas'),msg=element('p','Acceso privado con tu clave maestra.'),pass=element('input'),enter=element('button','Acceder'),local=element('button','Continuar sin conexión');
pass.type='password';pass.required=true;pass.autocomplete='off';pass.placeholder='Clave maestra';pass.setAttribute('aria-label','Clave maestra');enter.type='submit';enter.className='full primary';local.type='button';local.className='full';local.hidden=!native;form.append(title,msg,pass,enter,local);login.append(form);document.body.append(login);
login.addEventListener('cancel',e=>{if(!native)e.preventDefault();});local.onclick=()=>login.close();
function status(s){badge.textContent=s;}
function save(){
 try{const v=canonical(records);if(native&&!Native.cloudSave(JSON.stringify(v),JSON.stringify(meta)))throw Error('No se pudo guardar');last=clone(v);return true;}catch(e){return false;}
}
function rollbackLocal(){records=clone(last);render();}
function dirty(){return !!meta.pending||!meta.base||!equal(records,meta.base.records);}
function showLogin(){if(!login.open)login.showModal();pass.value='';}
function resetIdle(){if(native)return;clearTimeout(timer);if(session)timer=setTimeout(()=>endSession(true),300000);}
for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,resetIdle,{passive:true});
function endSession(automatic){
 const pending=dirty()&&(!meta.base||!empty(records)||meta.pending);
 if(!native&&!automatic&&pending&&!confirm('Hay cambios sin confirmar en la nube. ¿Cerrar sesión de todas formas?'))return;
 const old=session;session=null;epoch++;busy=false;clearTimeout(timer);clearTimeout(expiry);
 if(!native){if($('modal').open)$('modal').close();records={};last={};meta={base:null,pending:null};conflict=false;$('restoretext').value='';render();showLogin();}
 syncButton.textContent='Conectar nube';logoutButton.hidden=true;status(pending&&!native?'Sesión cerrada; verifica cambios pendientes.':'Sin conexión a la nube');
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
  login.close();syncButton.textContent='Sincronizar';logoutButton.hidden=false;await sync();
 }catch(e){msg.textContent='No se pudo acceder. Comprueba tu clave y conexión.';}finally{enter.disabled=false;}
};
syncButton.onclick=()=>session?sync():showLogin();logoutButton.onclick=()=>endSession(false);
setInterval(()=>{if(session&&!conflict)sync();},12000);window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&session)sync();});
status(native?'Historial local · conecta la nube':'Acceso privado');render();if(!native)showLogin();else if(!meta.base)showLogin();
})();
