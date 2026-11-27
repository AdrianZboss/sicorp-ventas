// Web pilot. No secrets or session persistence in the browser.
const $=id=>document.getElementById(id);
let cfg,session=null,catalog=[],selected=new Map(),pending=null,timer,expiryTimer,epoch=0,busy=false;
const status=s=>{$('message').textContent=s};
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const headers=auth=>({'apikey':cfg.publishableKey,...(auth?{Authorization:'Bearer '+auth}:{} )});
async function request(path,{method='GET',body,extra={},auth=session?.access_token}={}){
  const r=await fetch(cfg.url+path,{method,headers:{...headers(auth),...extra,...(body!==undefined&&!(body instanceof Blob)?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:body instanceof Blob?body:JSON.stringify(body),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  if(!r.ok){if(r.status===401&&auth&&session?.access_token===auth)logout('Sesión vencida. Vuelve a ingresar.');throw new Error('Solicitud rechazada ('+r.status+').');}
  const raw=await r.text();return raw?JSON.parse(raw):null;
}
function active(e){return !!session&&e===epoch}
function resetIdle(){clearTimeout(timer);if(session)timer=setTimeout(()=>logout('Sesión cerrada por inactividad.'),300000)}
function logout(msg='Sesión cerrada.'){
  const token=session?.access_token;epoch++;session=null;pending=null;busy=false;selected.clear();catalog=[];clearTimeout(timer);clearTimeout(expiryTimer);
  for(const id of ['products','history','files'])$(id).replaceChildren();
  $('file').value='';$('password').value='';$('search').value='';$('dashboard').hidden=true;$('logout').hidden=true;$('login').hidden=false;status(msg);
  if(token)request('/auth/v1/logout?scope=local',{method:'POST',auth:token}).catch(()=>{});
}
for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,resetIdle,{passive:true});
$('logout').onclick=()=>logout();
async function init(){
  try{cfg=await fetch('./config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()});
    const u=new URL(cfg.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||!cfg.publishableKey||!cfg.ownerEmail||cfg.publishableKey.includes('REPLACE')||cfg.ownerEmail.includes('REPLACE')||u.pathname!=='/')throw Error();
    cfg.url=u.origin;
  }catch{cfg=null;status('Nube todavía no configurada.');$('loginForm').querySelector('button').disabled=true;}
}
$('loginForm').onsubmit=async ev=>{
  ev.preventDefault();if(!cfg||busy)return;busy=true;const password=$('password').value;$('password').value='';const e=++epoch;
  const b=$('loginForm').querySelector('button');b.disabled=true;
  try{const s=await request('/auth/v1/token?grant_type=password',{method:'POST',auth:null,body:{email:cfg.ownerEmail,password}});
    if(e!==epoch)return;if(!s.access_token||s.user?.app_metadata?.sicorp_admin!==true)throw Error('Cuenta no autorizada.');
    session=s;resetIdle();expiryTimer=setTimeout(()=>logout('Sesión vencida.'),Math.max(0,(s.expires_in||3600)*1000-10000));
    const response=await fetch('../catalogo.json',{cache:'no-store'});if(!response.ok)throw Error('No se pudo cargar el catálogo.');const data=await response.json();
    if(!active(e))return;catalog=data;$('login').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;status('Conectado a la nube.');render();await Promise.all([history(),files()]);
  }catch(err){if(e===epoch){if(session)logout('No se pudo abrir el portal.');else status('No se pudo acceder. Comprueba tu clave o la configuración.');}}
  finally{if(e===epoch)busy=false;b.disabled=!cfg;}
};
const key=(p,v)=>JSON.stringify([p.id,v.size,v.code||'',v.dim||'']);
function updateCount(){
  const n=[...selected.values()].reduce((a,x)=>a+x.quantity,0);
  $('count').textContent=n+' unidades seleccionadas';$('save').disabled=busy||(!pending&&!n);
  $('save').textContent=pending?'Reintentar el mismo registro':'Registrar ventas';
  $('store').disabled=!!pending;
}
function render(){
  const q=$('search').value.trim().toLowerCase(),root=$('products');root.replaceChildren();
  const matches=catalog.filter(p=>[p.name,p.full,p.brand,p.cat,...(p.variants||[]).map(v=>v.code)].join(' ').toLowerCase().includes(q));
  for(const p of matches.slice(0,40)){
    const el=make('div');el.className='product';el.append(make('strong',p.full||p.name),make('p',[p.brand,p.cat].join(' · ')));
    for(const v of p.variants||[]){const k=key(p,v),row=make('div');row.className='variant';const label=make('span',[v.size,v.dim].filter(Boolean).join(' · ')||'Única');
      const input=make('input');input.type='number';input.min='0';input.max='999';input.step='1';input.value=selected.get(k)?.quantity||0;input.disabled=!!pending;input.setAttribute('aria-label',(p.name||'Producto')+' '+(v.size||''));
      input.onchange=()=>{const n=Math.min(999,Math.max(0,Math.trunc(Number(input.value)||0)));input.value=n;if(n)selected.set(k,{product_id:String(p.id),name:p.full||p.name,size:v.size||'',code:v.code||null,quantity:n});else selected.delete(k);updateCount()};
      row.append(label,input);el.append(row);
    }root.append(el);
  }
  if(matches.length>40)root.append(make('p','Mostrando 40 productos. Escribe para filtrar.'));updateCount();
}
$('search').oninput=render;
$('save').onclick=async()=>{
  if(!session||busy)return;
  if(!pending&&selected.size)pending={id:crypto.randomUUID(),store:$('store').value,sold_at:new Date().toISOString(),items:[...selected.values()]};
  if(!pending)return;busy=true;render();const e=epoch;
  try{await request('/rest/v1/sicorp_sale_batches?on_conflict=owner_id,id',{method:'POST',body:{...pending,owner_id:session.user.id},extra:{Prefer:'resolution=ignore-duplicates,return=minimal'}});
    if(!active(e))return;pending=null;selected.clear();status('Venta registrada en la nube.');await history();
  }catch(err){if(active(e))status('No se confirmó el registro. Reintenta sin cambiar la selección; se conservará su identificador.');}
  finally{if(active(e)){busy=false;render()}}
};
async function history(){
  const e=epoch;try{const rows=await request('/rest/v1/sicorp_sale_batches?select=id,store,sold_at,items&order=sold_at.desc&limit=50');if(!active(e))return;const root=$('history');root.replaceChildren();
  if(!rows.length)root.append(make('p','Sin ventas en la nube.'));
  for(const r of rows){const div=make('div');div.className='sale';div.append(make('strong',r.store+' · '+new Date(r.sold_at).toLocaleString('es-EC',{timeZone:'America/Guayaquil'})));for(const x of r.items)div.append(make('p',x.quantity+' × '+x.name+' '+x.size));root.append(div);}
  }catch{if(active(e))$('history').textContent='No se pudo consultar el historial.'}
}
$('reload').onclick=history;
async function files(){const e=epoch;try{const list=await request('/storage/v1/object/list/sicorp-evidence',{method:'POST',body:{prefix:session.user.id,limit:100,offset:0,sortBy:{column:'created_at',order:'desc'}}});if(!active(e))return;const root=$('files');root.replaceChildren();for(const f of list){if(!f.id)continue;const b=make('button',f.name.slice(37)||f.name);b.onclick=()=>download(f.name);root.append(b);}}catch{if(active(e))$('files').textContent='No se pudieron consultar los archivos.'}}
async function download(name){const e=epoch;try{const r=await fetch(cfg.url+'/storage/v1/object/authenticated/sicorp-evidence/'+session.user.id+'/'+encodeURIComponent(name),{headers:headers(session.access_token),cache:'no-store'});if(!r.ok)throw Error();const blob=await r.blob();if(!active(e))return;const url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download=name.slice(37)||name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{if(active(e))status('No se pudo descargar el archivo.')}}
$('upload').onclick=async()=>{const f=$('file').files[0];if(!session||!f)return;const e=epoch;if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(f.type)||f.size>10485760){status('Archivo no compatible o superior a 10 MB.');return}
  const b=$('upload');b.disabled=true;try{const name=crypto.randomUUID()+'-'+f.name.replace(/[^a-zA-Z0-9_.-]/g,'_').slice(-100);await request('/storage/v1/object/sicorp-evidence/'+session.user.id+'/'+encodeURIComponent(name),{method:'POST',body:f,extra:{'Content-Type':f.type,'x-upsert':'false'}});if(active(e)){$('file').value='';status('Archivo guardado de forma privada.');await files()}}catch{if(active(e))status('No se confirmó la subida.')}finally{b.disabled=false}
};
init();
