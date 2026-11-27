'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const user={id:'4ffbb42a-a85e-4ace-94d0-78dba234deab',app_metadata:{sicorp_admin:true}};
  let remote={},revision=0,commits=0;
  const accepted=()=>({access_token:'mock-access',refresh_token:'mock-refresh',expires_in:3600,user});
  await ctx.route('https://jooxurfzxumbyjdcmzjs.supabase.co/**',async route=>{
   const req=route.request(),url=new URL(req.url()),headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET, POST, OPTIONS','content-type':'application/json'};
   const send=(data,status=200)=>route.fulfill({status,headers,body:JSON.stringify(data)});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(url.pathname==='/auth/v1/token'){if(url.searchParams.get('grant_type')==='password'&&req.postDataJSON().password!=='0123456789')return send({error:'invalid'},400);return send(accepted());}
   if(url.pathname==='/rest/v1/sicorp_history')return send(revision?[{revision,records:remote}]:[]);
   if(url.pathname==='/rest/v1/rpc/sicorp_sync_commit'){
    const p=req.postDataJSON();if(p.p_expected!==revision)return send({applied:false,revision,records:remote});
    remote=p.p_records;revision++;commits++;return send({applied:true,revision});
   }
   if(url.pathname==='/storage/v1/object/list/sicorp-evidence')return send([]);
   if(url.pathname==='/auth/v1/logout')return send({});
   return send({},404);
  });
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:8765/web/');
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:45000});
  const f=page.frameLocator('#app'), login=f.locator('#sicorp-cloud-login'),key=f.locator('#sicorp-login-key');
  await login.waitFor({state:'visible'});
  await f.locator('#sicorp-trusted-device').check();
  await key.fill('0123456789');await login.getByRole('button',{name:'Iniciar sesión'}).click();
  await login.waitFor({state:'hidden'});
  await f.getByText('☁ Sincronizado',{exact:true}).waitFor();
  const inner=page.frames().find(x=>x.url().includes('/app/src/main/assets/index.html'));
  assert.ok(inner);
  const formats=await inner.evaluate(()=>{
   const oldDay=day;day='2026-11-26';
   const rows=[{id:'34',v:0,q:4},{id:'30',v:0,q:2}];
   const compact=report(rows,'compact'),long=report(rows,'detailed'),empty=report([],'compact');
   const mixed=report([{id:'8',v:0,q:1},{id:'8',v:1,q:2},{id:'37',v:0,q:1}],'detailed');
   const previous=records[day];records[day]=rows;
   page('sales');render();
   const preview=document.getElementById('report').textContent;
   const copyOriginal=copy;let copied='';copy=value=>{copied=value;};
   document.getElementById('copy').click();copy=copyOriginal;
   if(previous===undefined)delete records[day];else records[day]=previous;
   day=oldDay;page('catalog');render();
   return {compact,long,empty,mixed,preview,copied,mode:reportMode};
  });
  assert.equal(formats.compact,'*DE PRATI ROTONDA*\n\nHotel Collection Soft 70x50 #4\nHotel Collection Firm 70x50 #2\n\n*Total: 6 unidades.*');
  assert.equal(formats.long,'*DE PRATI ROTONDA*\nVentas | 26/11/2026\n\n*Almohadas*\n- 4 Hotel Collection Soft 70x50\n- 2 Hotel Collection Firm 70x50\n\n*Total: 6 unidades.*');
  assert.equal(formats.mode,'compact');
  assert.equal(formats.copied,formats.compact);
  assert.ok(formats.preview.includes('Hotel Collection Soft 70x50 #4'));
  assert.ok(formats.empty.includes('Sin ventas registradas'));
  assert.ok(formats.mixed.includes('29 cm de alto')&&formats.mixed.includes('35 cm de alto')&&formats.mixed.includes('Deconova Firme Básica'));

  const selected=await inner.evaluate(()=>{const p=catalog.find(p=>p.variants.length>=2);open(p);return {id:p.id,day};});
  const grid=await f.locator('#sicorp-batch').evaluate(n=>getComputedStyle(n).gridTemplateColumns);
  assert.notEqual(grid,'none');
  assert.ok((await f.locator('#sicorp-batch .batch-row').count())>=2);
  await f.locator('#modal').evaluate(n=>n.close());
  await ctx.setOffline(true);
  await inner.evaluate(({id,day})=>{records[day]=[{id,v:0,q:2}];if(!persist())throw Error('local save failed');render();},selected);
  await f.getByText('Sin conexión · ventas guardadas localmente',{exact:true}).waitFor();
  const stored=await inner.evaluate(()=>JSON.parse(localStorage.getItem('sicorp.account.v3')));
  assert.ok(stored.cipher);assert.equal(stored.records,undefined);assert.equal(stored.refreshToken,undefined);
  assert.equal(commits,0);
  await page.reload({waitUntil:'load'});
  await login.waitFor({state:'visible'});
  await key.fill('1111111111');await login.getByRole('button',{name:'Iniciar sesión'}).click();
  await f.getByText(/Clave incorrecta para la copia local/).waitFor();
  await key.fill('0123456789');await login.getByRole('button',{name:'Iniciar sesión'}).click();
  await login.waitFor({state:'hidden'});
  const restored=page.frames().find(x=>x.url().includes('/app/src/main/assets/index.html'));
  assert.equal(await restored.evaluate(day=>records[day][0].q,selected.day),2);
  await ctx.setOffline(false);
  await f.getByText('☁ Sincronizado',{exact:true}).waitFor({timeout:40000});
  assert.equal(commits,1);assert.equal(remote[selected.day][0].q,2);
  await f.getByRole('button',{name:'Bloquear sesión'}).click();
  await login.waitFor({state:'visible'});
  assert.equal(await restored.evaluate(()=>Object.keys(records).length),0);
  assert.deepEqual(errors,[]);
  await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
