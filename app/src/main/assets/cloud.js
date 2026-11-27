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
let meta={base:null,pending:null,owner:null},session=null,epoch=0,busy=false,conflict=false,callbacks=new Map(),seq=0,timer,expiry;
let unlocked=false,locking=false,owner=null,refreshToken=null,sessionUntil=0, vaultKey=null,vaultSalt=null, vaultStore=null, vaultWrites=0,vaultFailed=false,vaultTail=Promise.resolve(),releaseBrowserLock=null;
const vaultName='sicorp.account.v3', encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const random=n=>crypto.getRandomValues(new Uint8Array(n));
function readNative(){
 const m=JSON.parse(Native.cloudMeta()||'{}');
 const r=canonical(JSON.parse(Native.read()||'{}'));
 const v={base:null,pending:null,owner:m.owner||null};
 if(m.base){if(!Number.isSafeInteger(m.base.revision))throw Error('Revisión local inválida');v.base={revision:m.base.revision,records:canonical(m.base.records)};}
 if(m.pending)v.pending={...m.pending,records:canonical(m.pending.records)};
 return {records:r,meta:v};
}
function validMeta(m){
 if(!m||typeof m!=='object')throw Error('Metadatos inválidos');
 const out={base:null,pending:null,owner:m.owner||null};
 if(m.base){if(!Number.isSafeInteger(m.base.revision)||m.base.revision<0)throw Error('Revisión inválida');out.base={revision:m.base.revision,records:canonical(m.base.records)};}
 if(m.pending){if(typeof m.pending.id!=='string'||!Number.isSafeInteger(m.pending.expected))throw Error('Operación inválida');out.pending={...m.pending,records:canonical(m.pending.records)};}
 return out;
}
function getVault(){if(native){const raw=Native.cloudVaultRead();return {raw:raw||null,store:'native'};}
 const temporary=sessionStorage.getItem(vaultName);if(temporary)return {raw:temporary,store:'session'};
 const permanent=localStorage.getItem(vaultName);return {raw:permanent,store:permanent?'local':null};
}
function writeVault(raw,mode){
 if(native){if(!Native.cloudVaultWrite(raw))throw Error('No se pudo guardar la sesión local');return;}
 (mode==='local'?localStorage:sessionStorage).setItem(vaultName,raw);
}
function clearVault(mode){if(native){Native.cloudVaultWrite('');return;}(mode==='local'?localStorage:sessionStorage).removeItem(vaultName);}
async function derive(secret,salt){
 if(native)return Native.cloudVaultKey(secret,b64(salt));
 if(!crypto.subtle)throw Error('Este navegador no permite almacenamiento cifrado');
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(key,salt,value){
 const iv=random(12),plain=JSON.stringify(value);
 const cipher=native?Native.cloudVaultCipher(true,key,b64(iv),plain):b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(plain))));
 if(!cipher)throw Error('No se pudo cifrar');
 return JSON.stringify({v:1,salt:b64(salt),iv:b64(iv),cipher});
}
async function unseal(secret,raw){
 const envelope=JSON.parse(raw);if(envelope.v!==1)throw Error('Copia incompatible');
 const salt=unb64(envelope.salt),key=await derive(secret,salt);
 if(!key)throw Error('Clave inválida');
 const iv=unb64(envelope.iv);
 const plain=native?Native.cloudVaultCipher(false,key,envelope.iv,envelope.cipher):decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,unb64(envelope.cipher)));
 if(!plain)throw Error('Clave inválida');
 const data=JSON.parse(plain);if(!data.owner||typeof data.owner!=='string')throw Error('Copia inválida');
 return {data,key,salt};
}
async function acquireBrowserLock(){
 if(native||releaseBrowserLock)return true;
 if(!navigator.locks)return false;
 return new Promise((resolve,reject)=>{navigator.locks.request('sicorp-account-v3',{ifAvailable:true},lock=>{if(!lock){resolve(false);return;}return new Promise(release=>{releaseBrowserLock=release;resolve(true);});}).catch(reject);});
}
function freeBrowserLock(){if(releaseBrowserLock){releaseBrowserLock();releaseBrowserLock=null;}}
function queueVault(){
 if(!unlocked||!vaultKey||!vaultStore)return false;
 const key=vaultKey,salt=vaultSalt,mode=vaultStore;
 const value={owner,refreshToken,verifiedAt:Date.now(),...(native?{}:{records:canonical(records),meta:clone(meta)})};
 vaultWrites++;
 vaultTail=vaultTail.catch(()=>{}).then(async()=>{const raw=await seal(key,salt,value);writeVault(raw,mode);vaultFailed=false;}).catch(err=>{vaultFailed=true;status('No se pudo guardar la copia local. Mantén abierta la aplicación.');throw err;}).finally(()=>{vaultWrites--;});
 vaultTail.catch(()=>{});return true;
}
async function flushVault(){await vaultTail;if(vaultFailed)throw Error('Copia local no confirmada');}
records={};let last={};
const element=(tag,t)=>{const n=document.createElement(tag);if(t!==undefined)n.textContent=t;return n;};
const style=element('style');style.textContent=`
#sicorp-cloud{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}
#sicorp-cloud button{min-height:40px;padding:8px 12px;border-radius:12px;background:var(--selected);color:var(--accent)}
#sicorp-cloud-status{flex:1;font-size:12px;color:var(--muted)}
html[data-sicorp-theme] #sicorp-cloud-login{box-sizing:border-box;width:min(calc(100vw - 32px),420px);max-width:calc(100vw - 32px);max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);margin:auto;padding:0;overflow:auto;border:1px solid var(--line);border-radius:24px;background:var(--surface);color:var(--text);box-shadow:0 18px 64px #0003}
html[data-sicorp-theme] #sicorp-cloud-login::backdrop{background:var(--canvas);opacity:1}
#sicorp-cloud-login form{display:grid;gap:12px;margin:0;padding:26px;position:relative;text-align:left}
#sicorp-cloud-login .login-top{display:flex;justify-content:flex-end}
#sicorp-cloud-login .login-theme{min-height:40px;padding:6px 12px;border:1px solid var(--line);border-radius:12px;background:var(--soft);color:var(--text);font-size:12px}
#sicorp-cloud-login .login-mark{display:grid;place-items:center;margin:0 auto;width:58px;height:58px;border-radius:17px;background:var(--navy);color:var(--on-primary)}
#sicorp-cloud-login .login-mark svg{width:30px;height:30px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#sicorp-cloud-login .login-brand{margin:0;text-align:center;color:var(--text);font:800 27px/1.15 system-ui,sans-serif;letter-spacing:-.8px}
#sicorp-cloud-login .login-brand span{display:block;color:var(--muted);font:500 13px/1.7 system-ui,sans-serif;letter-spacing:0;margin-top:4px}
#sicorp-cloud-login .login-rule{height:1px;background:var(--line);margin:4px 0}
#sicorp-cloud-login .login-welcome{margin:0;font-size:20px;font-weight:750}
#sicorp-cloud-login .login-label{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--text);font-size:13px;font-weight:650}
html[data-sicorp-theme] #sicorp-cloud-login input[type=password]{box-sizing:border-box;width:100%;margin:0;min-height:54px;padding:10px 15px;background:var(--soft);color:var(--text);border:1px solid var(--line);border-radius:13px;font:600 20px/1.2 system-ui,sans-serif;letter-spacing:3px;outline:none}
#sicorp-cloud-login input[type=password]::placeholder{color:var(--muted);font-size:13px;letter-spacing:0;font-weight:400}
#sicorp-cloud-login input[type=password]:focus{border-color:var(--focus);box-shadow:0 0 0 2px var(--selected)}
#sicorp-cloud-login button{box-sizing:border-box;min-height:46px;margin:0}
#sicorp-cloud-login button:focus-visible{outline:2px solid var(--focus);outline-offset:3px}
#sicorp-cloud-login .login-keyboard{width:auto;min-height:32px;padding:5px 9px;border:1px solid var(--line);background:var(--soft);color:var(--accent);border-radius:9px;font-size:11px;font-weight:700}
#sicorp-cloud-login .login-enter{width:100%;border:0;border-radius:14px;background:var(--navy);color:var(--on-primary);font-size:15px;font-weight:750;min-height:52px}
#sicorp-cloud-login .login-enter:disabled{opacity:.55}
#sicorp-cloud-login .login-local{width:100%;border:1px solid var(--line);background:var(--soft);color:var(--muted);border-radius:14px;font-size:12px}
#sicorp-cloud-login .login-message{margin:0;min-height:18px;font-size:13px;line-height:1.4;color:var(--muted);white-space:pre-wrap;overflow-wrap:anywhere}
#sicorp-cloud-login .login-foot{display:flex;align-items:center;justify-content:center;gap:6px;color:var(--muted);font-size:11px;padding-top:4px}
#sicorp-cloud-login .login-trust{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--text);font-weight:500}
#sicorp-cloud-login .login-trust input{width:20px;min-height:20px;accent-color:var(--accent);padding:0;margin:0;flex:none}
#sicorp-cloud-login [hidden],#sicorp-cloud [hidden]{display:none!important}
@media(max-height:550px){#sicorp-cloud-login form{gap:8px;padding:15px 20px}#sicorp-cloud-login .login-mark{width:44px;height:44px}#sicorp-cloud-login .login-mark svg{width:24px;height:24px}}
`;
document.head.append(style);
const bar=element('div');bar.id='sicorp-cloud';const badge=element('span');badge.id='sicorp-cloud-status';const syncButton=element('button','Conectar nube'),logoutButton=element('button','Cerrar sesión');syncButton.type=logoutButton.type='button';logoutButton.hidden=true;bar.append(badge,syncButton,logoutButton);document.querySelector('header').append(bar);
const login=element('dialog');login.id='sicorp-cloud-login';
const form=element('form'),title=element('h2','SICORP Ventas'),msg=element('p','Accede a tu cuenta para continuar.'),pass=element('input'),enter=element('button','Iniciar sesión'),local=element('button','Continuar sin conexión');
const top=element('div'),themeButton=element('button'),mark=element('div'),brandLine=element('span','Gestión de ventas'),rule=element('div'),welcome=element('h3','Bienvenido'),labelRow=element('div'),label=element('label','Clave de acceso'),keyboard=element('button','ABC'),foot=element('div');
top.className='login-top';themeButton.type='button';themeButton.className='login-theme';top.append(themeButton);
function updateLoginTheme(){const dark=document.documentElement.dataset.sicorpTheme==='dark';themeButton.textContent=dark?'☀ Claro':'☾ Oscuro';themeButton.setAttribute('aria-label',dark?'Cambiar inicio a modo claro':'Cambiar inicio a modo oscuro');}
themeButton.onclick=()=>{document.getElementById('sicorpThemeToggle')?.click();updateLoginTheme();};
new MutationObserver(updateLoginTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-sicorp-theme']});updateLoginTheme();
mark.className='login-mark';mark.setAttribute('aria-hidden','true');mark.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 20h16M6 16v-5m6 5V5m6 11V8"/><path d="m5 7 7-4 7 2"/></svg>';
title.className='login-brand';title.id='sicorp-login-title';title.append(brandLine);login.setAttribute('aria-labelledby',title.id);
rule.className='login-rule';rule.setAttribute('aria-hidden','true');welcome.className='login-welcome';
labelRow.className='login-label';label.htmlFor='sicorp-login-key';keyboard.type='button';keyboard.className='login-keyboard';keyboard.setAttribute('aria-label','Cambiar a teclado completo');labelRow.append(label,keyboard);
pass.id='sicorp-login-key';pass.type='password';pass.inputMode='numeric';pass.setAttribute('enterkeyhint','go');pass.autocapitalize='off';pass.spellcheck=false;pass.required=true;pass.autocomplete='off';pass.placeholder='Introduce tu clave';pass.setAttribute('aria-label','Clave maestra');pass.setAttribute('aria-describedby','sicorp-login-message');
keyboard.onclick=()=>{const numeric=pass.inputMode==='numeric';pass.inputMode=numeric?'text':'numeric';keyboard.textContent=numeric?'123':'ABC';keyboard.setAttribute('aria-label',numeric?'Cambiar a teclado numérico':'Cambiar a teclado completo');pass.focus();};
msg.id='sicorp-login-message';msg.className='login-message';msg.setAttribute('role','status');
enter.type='submit';enter.className='login-enter';local.type='button';local.className='login-local';local.hidden=true;
foot.className='login-foot';foot.append(element('span','🔒'),element('span','Acceso privado'));foot.setAttribute('aria-hidden','true');
const trust=element('input'),trustLabel=element('label',' Guardar copia cifrada en este dispositivo personal'),trustHelp=element('p','En equipos compartidos, no actives esta opción. Los cambios sin conexión se conservan en esta pestaña hasta sincronizar.');
trust.type='checkbox';trust.id='sicorp-trusted-device';trustLabel.htmlFor=trust.id;trustLabel.prepend(trust);trustLabel.className='login-trust';trustHelp.className='login-message';trustLabel.hidden=trustHelp.hidden=native;
try{trust.checked=!native&&getVault().store==='local';}catch{}
form.append(top,mark,title,rule,welcome,msg,labelRow,pass,trustLabel,trustHelp,enter,local,foot);login.append(form);document.body.append(login);
login.addEventListener('cancel',e=>e.preventDefault());local.onclick=()=>{};
function status(s){badge.textContent=s;}
function save(){
 try{
  if(!unlocked)return false;
  const v=canonical(records);meta.owner=owner;
  if(native){if(!Native.cloudSave(JSON.stringify(v),JSON.stringify(meta)))throw Error('No se pudo guardar');}
  else if(!queueVault())throw Error('No se pudo preparar copia local');
  last=clone(v);return true;
 }catch(e){return false;}
}
function rollbackLocal(){records=clone(last);render();}
function dirty(){return !!meta.pending||!meta.base||!equal(records,meta.base.records);}
function showLogin(){
 if(!login.open){pass.inputMode='numeric';keyboard.textContent='ABC';keyboard.setAttribute('aria-label','Cambiar a teclado completo');pass.value='';login.showModal();}else pass.value='';
}
function resetIdle(){clearTimeout(timer);if(unlocked&&!native&&vaultStore!=='local')timer=setTimeout(()=>endSession(true),300000);}
for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,resetIdle,{passive:true});
async function endSession(automatic){
 if(!unlocked||locking)return;
 const pending=dirty()&&(!meta.base||!empty(records)||meta.pending),old=session;
 if(!automatic&&pending&&!confirm('Hay cambios pendientes. Se conservarán en este dispositivo'+(!native&&vaultStore==='session'?' mientras esta pestaña siga abierta':'')+'. ¿Bloquear el acceso?'))return;
 locking=true;logoutButton.disabled=true;const e=++epoch;busy=false;clearTimeout(timer);clearTimeout(expiry);
 try{if(!native){if(pending)queueVault();await flushVault();}else if(!save())throw Error('Copia local no confirmada');}
 catch{locking=false;logoutButton.disabled=false;status('No se pudo guardar. La sesión sigue abierta para proteger tus ventas.');resetIdle();return;}
 if(e!==epoch)return;
 const mode=vaultStore;
 if(!native&&mode==='session'&&!pending){try{clearVault(mode);}catch{}if(old)request('/auth/v1/logout?scope=local','POST',null,old.access_token).catch(()=>{});}
 unlocked=false;locking=false;logoutButton.disabled=false;session=null;refreshToken=null;sessionUntil=0;owner=null;vaultKey=null;vaultSalt=null;vaultStore=null;vaultFailed=false;records={};last={};meta={base:null,pending:null,owner:null};conflict=false;
 if($('modal')?.open)$('modal').close();$('restoretext').value='';render();
 evidence.hidden=true;fileList.replaceChildren();file.value='';syncButton.textContent='Iniciar sesión';logoutButton.hidden=true;status('Acceso privado');freeBrowserLock();showLogin();msg.textContent='Introduce tu clave para acceder a tu cuenta.';
}
window.addEventListener('beforeunload',e=>{if(!native&&(vaultWrites||vaultFailed||(unlocked&&vaultStore==='session'&&dirty()))){e.preventDefault();e.returnValue='';}});
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
function acceptSession(s,expected){
 if(!s?.access_token||!s.refresh_token||s.user?.app_metadata?.sicorp_admin!==true||!s.user.id||(expected&&s.user.id!==expected))throw Error('Cuenta no autorizada');
 session=s;owner=s.user.id;refreshToken=s.refresh_token;sessionUntil=Date.now()+Math.max(1,Number(s.expires_in)||3600)*1000;
}
async function ensureSession(e){
 if(session&&Date.now()<sessionUntil-60000)return true;
 if(!refreshToken)throw Error('Conecta e inicia sesión para renovar el acceso');
 const s=await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:refreshToken},'');
 if(e!==epoch||!unlocked)return false;
 acceptSession(s,owner);if(!queueVault())throw Error('No se pudo guardar la sesión renovada');await flushVault();
 evidence.hidden=false;return true;
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
 if(!unlocked||locking||busy||conflict)return;
 if(!native&&navigator.onLine===false){status('Sin conexión · ventas guardadas localmente');return;}
 busy=true;const e=epoch;status('Sincronizando…');
 try{
  if(!await ensureSession(e)||e!==epoch)return;
  await flushVault();if(e!==epoch||!unlocked)return;
  // Resolve ambiguous previous requests before pulling a new base.
  if(!meta.pending){
   const remote=await pull();if(e!==epoch||!session)return;
   if(!meta.base||remote.revision!==meta.base.revision){if(!adopt(remote))return;}
  }
  if(!meta.pending&&equal(records,meta.base.records)){await flushVault();if(e===epoch)status('☁ Sincronizado');return;}
  if(!meta.pending){
   meta.pending={id:uuid(),expected:meta.base.revision,records:canonical(records)};
   if(!save()){meta.pending=null;throw Error('No se pudo conservar la operación');}
  }
  await flushVault();if(e!==epoch||!unlocked)return;
  const p=clone(meta.pending);
  const response=await request('/rest/v1/rpc/sicorp_sync_commit','POST',{p_expected:p.expected,p_records:p.records,p_request:p.id});
  if(e!==epoch||!session)return;
  if(response.applied===true){
   meta.base={revision:Number(response.revision),records:p.records};meta.pending=null;
   if(!save()){meta.pending=p;throw Error('Confirmación local pendiente');}
   await flushVault();if(e!==epoch)return;
   status(equal(records,p.records)?'☁ Sincronizado':'Cambios pendientes');
  }else if(response.applied===false){
   meta.pending=null;
   if(!adopt({revision:Number(response.revision),records:canonical(response.records)})){save();return;}
   status('Cambios combinados; sincronización pendiente');
  }else throw Error('Respuesta inesperada');
 }catch(err){if(e===epoch){if(err.code===401||err.code===400||err.code===403){session=null;sessionUntil=0;evidence.hidden=true;status('Acceso a nube pendiente · datos locales conservados');if(err.code!==401){refreshToken=null;syncButton.textContent='Renovar acceso';}}else status('Sin conexión o sincronización pendiente · datos locales conservados');}}
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

persist=function(){
 if(!unlocked||locking){rollbackLocal();notify('Inicia sesión para guardar.');return false;}
 if(!save()){rollbackLocal();notify('No se pudo guardar el historial.');return false;}
 if(native){status('Guardado localmente · sincronización pendiente');setTimeout(sync,0);}
 else {status('Guardando copia local cifrada…');flushVault().then(()=>{if(unlocked){status('Copia local guardada · sincronización pendiente');sync();}}).catch(()=>notify('No se confirmó el guardado local. No cierres esta pestaña.'));}
 return true;
};
form.onsubmit=async ev=>{
 ev.preventDefault();if(enter.disabled)return;enter.disabled=true;msg.textContent='Verificando acceso…';const secret=pass.value;pass.value='';
 let existing,opened=null,online=null,mode;
 try{
  existing=getVault();mode=native?'native':(trust.checked?'local':'session');
  if(!native&&(existing.store==='local'||mode==='local')){if(!await acquireBrowserLock())throw Error('Cierra la otra pestaña SICORP para proteger tu copia local.');existing=getVault();}
  if(existing.raw){try{opened=await unseal(secret,existing.raw);}catch{throw Error('Clave incorrecta para la copia local. No se ha sobrescrito ningún dato.');}}
  try{if(!native&&navigator.onLine===false)throw Error('Sin conexión');online=await request('/auth/v1/token?grant_type=password','POST',{email:cfg.ownerEmail,password:secret},'');}
  catch(e){if(!opened||e.code&&e.code<500)throw e;online=null;}
  if(!online&&!opened)throw Error('El primer inicio de sesión requiere internet.');
  if(online)acceptSession(online,opened?.data.owner);
  else{owner=opened.data.owner;refreshToken=opened.data.refreshToken;session=null;sessionUntil=0;}
  if(native){const previous=readNative();if(previous.meta.owner&&previous.meta.owner!==owner)throw Error('El historial local pertenece a otra cuenta.');records=previous.records;meta=previous.meta;}
  else if(opened){records=canonical(opened.data.records||{});meta=validMeta(opened.data.meta||{});if(meta.owner&&meta.owner!==owner)throw Error('La copia pertenece a otra cuenta.');}
  else{records={};meta={base:null,pending:null,owner:null};}
  if(opened){vaultKey=opened.key;vaultSalt=opened.salt;}
  else{vaultSalt=random(16);vaultKey=await derive(secret,vaultSalt);}
  if(!vaultKey)throw Error('No se pudo proteger la sesión local.');
  vaultStore=mode;unlocked=true;conflict=false;epoch++;meta.owner=owner;
  if(!save()||!queueVault())throw Error('No se pudo guardar la copia de la cuenta.');
  await flushVault();
  if(!native&&existing.store&&existing.store!==mode)clearVault(existing.store);
  login.close();resetIdle();render();syncButton.textContent='Sincronizar';logoutButton.textContent='Bloquear sesión';logoutButton.hidden=false;evidence.hidden=!session;
  status(session?'Cuenta conectada · sincronizando…':'Sin conexión · datos locales protegidos');
  sync();if(session)listFiles();
 }catch(e){
  unlocked=false;session=null;sessionUntil=0;refreshToken=null;owner=null;vaultKey=null;vaultSalt=null;vaultStore=null;records={};last={};meta={base:null,pending:null,owner:null};freeBrowserLock();render();
  msg.textContent=e?.message?.startsWith('Clave incorrecta')||e?.message?.startsWith('Cierra')||e?.message?.includes('copia')||e?.message?.includes('cuenta')?e.message:'No se pudo acceder. Verifica tu clave e internet. El primer acceso requiere conexión.';
 }finally{enter.disabled=false;}
};
syncButton.onclick=async()=>{if(locking)return;if(!unlocked){showLogin();return;}if(!refreshToken&&!session){await endSession(false);return;}conflict=false;sync();};
logoutButton.onclick=()=>endSession(false);
setInterval(()=>{if(unlocked&&!conflict)sync();},12000);window.addEventListener('online',()=>{if(unlocked)sync();});window.addEventListener('offline',()=>{if(unlocked)status('Sin conexión · guardado local activo');});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&unlocked)sync();});
status('Acceso privado');render();showLogin();
})();
