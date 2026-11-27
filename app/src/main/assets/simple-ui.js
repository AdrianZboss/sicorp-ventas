(function(){
  'use strict';
  if(document.getElementById('sicorp-modern-ui') || typeof renderCatalog!=='function')return;
  const by=id=>document.getElementById(id);
  const catalogSection=by('catalog'), brands=by('brands'), cats=by('cats'), grid=by('grid'), search=by('search');
  if(!catalogSection||!brands||!cats||!grid||!search)return;
  const style=document.createElement('style');style.id='sicorp-modern-ui';
  style.textContent=`
    html[data-sicorp-theme="light"]{--canvas:#f2f5fa;--surface:#fff;--soft:#edf2f9;--text:#15233a;--muted:#52647b;--navy:#1455b5;--blue:#1455b5;--selected:#dceaff;--on-primary:#fff;--line:#dce5f0;--focus:#246fe0;--accent:#1559c2;--hero:#e5efff;--shadow:0 4px 18px #17376108}
    html[data-sicorp-theme="dark"]{--canvas:#0d1420;--surface:#151f2e;--soft:#202d40;--text:#edf4ff;--muted:#a6b8cf;--navy:#a5cbff;--blue:#a5cbff;--selected:#213c61;--on-primary:#10213a;--line:#2c3c51;--focus:#9fc6ff;--accent:#a5cbff;--hero:#192e4b;--shadow:none}
    *{-webkit-tap-highlight-color:transparent}
    body{font-family:system-ui,-apple-system,sans-serif;line-height:1.45}
    html[data-sicorp-theme] header{padding:12px max(18px,env(safe-area-inset-right)) 17px;position:relative;border:0;border-bottom:1px solid var(--line);background:var(--surface)}
    .modern-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:13px}
    .modern-top .modern-brand{font-size:11px;font-weight:750;letter-spacing:1.1px;color:var(--muted)}
    header .headerrow{align-items:center;flex-wrap:nowrap;gap:10px}
    header h1{font-size:clamp(17px,5vw,24px);letter-spacing:-.65px;line-height:1.15;margin:0 0 5px;font-weight:800}
    #headerdate{font-size:12px!important}
    header .headcount{background:var(--hero);color:var(--accent);border-radius:17px;padding:9px 13px;min-width:78px;text-align:center;font-size:28px;line-height:1.05;font-variant-numeric:tabular-nums}
    header .headcount small{font-size:9px!important;letter-spacing:.65px;margin-top:5px}
    #sicorpThemeToggle{margin:0;min-height:44px;border-radius:99px;background:var(--soft);color:var(--text);border:0;padding:8px 12px;font-size:12px}
    main{max-width:760px;padding:18px 15px 108px}
    h2{font-size:19px;font-weight:780;letter-spacing:-.45px}
    html[data-sicorp-theme] .card{padding:17px;margin-bottom:14px;border:1px solid var(--line);border-radius:21px;box-shadow:var(--shadow)}
    .muted,.notice{font-size:12px;line-height:1.5}
    #catalog>.card{padding:17px 14px}
    .modern-search{position:relative;margin:15px 0 12px}
    .modern-search svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
    html[data-sicorp-theme] .modern-search input{width:100%;min-height:51px;border:1px solid var(--line);border-radius:15px;background:var(--soft);padding:12px 12px 12px 42px;font-size:15px}
    #brands{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));padding:4px;gap:4px;border-radius:15px;background:var(--soft);margin:0 0 10px}
    #brands button{font-size:12px;min-width:0;min-height:44px;padding:6px 3px;background:transparent;border-radius:11px}
    #brands button.active{background:var(--navy)!important;color:var(--on-primary)!important}
    #cats{display:flex;flex-wrap:wrap;gap:6px;margin:0}
    #cats button{min-height:44px;padding:8px 12px;border-radius:99px;border:1px solid var(--line);background:var(--surface);font-size:12px}
    #cats button.active{background:var(--selected)!important;color:var(--accent)!important;border-color:var(--focus)}
    #catalogcount{font-size:11px;font-weight:650;color:var(--muted)}
    .groupcategory{font-size:13px;font-weight:700;margin:18px 3px 8px;color:var(--muted);gap:7px}
    .groupcategory .tag{font-size:10px;letter-spacing:.4px}
    .family-section{margin-bottom:9px}
    .family-toggle,.family-toggle.family-deconova{border:1px solid var(--line);border-radius:16px;padding:12px 14px;min-height:55px;background:var(--surface)}
    .family-toggle[aria-expanded="true"]{background:var(--hero);border-color:var(--focus)}
    .family-copy strong{font-size:15px;font-weight:750}
    .family-copy small{font-size:12px}
    .family-arrow{font-size:20px;color:var(--accent)}
    .family-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding-top:8px}
    html[data-sicorp-theme] .product{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr;align-items:stretch;min-width:0;min-height:168px;border-radius:16px;padding:7px;gap:5px}
    .product img{width:100%;height:110px;border-radius:11px;object-fit:contain;background:#fff}
    .product .body{padding:7px 8px;gap:4px;min-width:0}
    .product strong{font-size:13px;font-weight:750;overflow-wrap:anywhere}
    .product .smalladd{font-size:12px;font-weight:750;color:var(--accent)}
    .product .tag{font-size:10px}
    html[data-sicorp-theme] .nav{bottom:0;padding:7px 12px calc(8px + env(safe-area-inset-bottom));gap:5px;border-top:1px solid var(--line);background:var(--surface)}
    .nav button{border-radius:16px;min-height:56px;font-size:11px;font-weight:700;padding:5px 2px;position:relative}
    .nav b{display:flex;align-items:center;justify-content:center;width:48px;height:29px;margin:0 auto 2px;border-radius:99px}
    html[data-sicorp-theme] .nav .active{background:transparent!important;color:var(--accent)!important}
    .nav .active b{background:var(--selected)}
    .nav svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    .stats{gap:9px}
    .stats .card{background:var(--hero);box-shadow:none}
    .stat{font-size:33px;font-weight:800;font-variant-numeric:tabular-nums}
    .sale{padding:12px 0}
    .sale button,.qty button{border-radius:12px;min-height:44px;min-width:44px}
    .historybtn{min-height:50px;border-radius:14px;background:var(--soft);font-size:13px}
    .empty{padding:25px 8px;font-size:14px}
    .simple-details{margin:8px 0}
    .simple-details summary{padding:12px 0;min-height:44px;color:var(--muted)}
    .full{border-radius:14px;min-height:49px}
    html[data-sicorp-theme] dialog{border:1px solid var(--line);border-radius:25px;padding:18px}
    dialog .choice button{border-radius:13px;min-height:46px}
    #sicorpUpdates .row{flex-wrap:nowrap}
    #sicorpUpdates button{color:var(--accent);background:var(--selected);border-radius:13px;min-height:44px}
    #sicorpUpdates .muted{font-size:12px}
    @media(min-width:560px){.family-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:339px){main{padding-inline:10px}#brands button{font-size:11px}.product img{height:88px}.product strong{font-size:12px}}
    @media(max-height:480px) and (orientation:landscape){.nav button{min-height:44px}.nav b{display:inline-flex;margin:0 5px 0 0;vertical-align:middle}.modern-top{margin-bottom:5px}}
  `;
  document.head.appendChild(style);
  const make=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;if(cls)n.className=cls;return n;};
  const svg=(paths)=>'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
  const header=document.querySelector('header');
  const company=header&&header.querySelector('.headerrow>div:first-child>small');
  const theme=by('sicorpThemeToggle');
  if(header&&company&&theme){
    const top=make('div','','modern-top');
    company.classList.add('modern-brand');top.append(company,theme);
    header.prepend(top);
  }
  const searchWrap=make('div','','modern-search');
  searchWrap.innerHTML=svg('<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>');
  const card=brands.parentElement;
  card.insertBefore(searchWrap,brands);searchWrap.appendChild(search);
  search.placeholder='Buscar modelo o código';search.setAttribute('aria-label','Buscar productos');
  brands.setAttribute('aria-label','Filtrar por marca');cats.setAttribute('aria-label','Filtrar por categoría');
  const originalRender=renderCatalog;
  renderCatalog=function(){
    originalRender();
    [brands,cats].forEach(row=>row.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active')))));
  };
  function fold(nodes,label){
    const selected=nodes.filter(Boolean);if(!selected.length)return;
    const detail=make('details','','simple-details'),sum=make('summary',label);
    selected[0].parentNode.insertBefore(detail,selected[0]);detail.appendChild(sum);
    selected.forEach(n=>detail.appendChild(n));return detail;
  }
  const reportNode=by('report');
  if(reportNode){
    fold([reportNode.parentElement.querySelector('.reportmodes'),reportNode],'Vista previa y formato del reporte');
    by('copy').textContent='Copiar reporte';by('share').textContent='Compartir';
    fold([by('clear')],'Más opciones');
  }
  const backup=by('backup');
  if(backup){const backupCard=backup.closest('.card');if(backupCard)fold(Array.from(backupCard.children).filter(n=>n.tagName!=='H2'),'Copiar o restaurar respaldo');}
  const history=by('history');
  if(history&&!by('sicorpUpdates')&&window.Native){
    const update=make('div','','card');update.id='sicorpUpdates';
    const row=make('div','','row');row.append(make('span','Versión '+Native.installedVersion(),'muted'));
    const button=make('button','Actualizar app','ghost');button.type='button';button.onclick=()=>Native.openUpdates();
    row.append(button);update.append(row);history.append(update);
  }
  const icons={catalog:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><path d="M17.5 14v7M14 17.5h7"/>',sales:'<path d="M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21zM9 8h6M9 12h6"/>',history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>'};
  document.querySelectorAll('.nav [data-page]').forEach(b=>{const icon=b.querySelector('b');if(icon&&icons[b.dataset.page]){icon.innerHTML=svg(icons[b.dataset.page]);icon.setAttribute('aria-hidden','true');}if(b.dataset.page==='catalog'&&b.lastChild.nodeType===3)b.lastChild.nodeValue='Registrar';});
  const title=catalogSection.querySelector('h2');if(title)title.textContent='Registrar venta';
  renderCatalog();
})();

/* v1.4.10 — registro rápido basado en el historial local. */
(function(){
 'use strict';
 if(document.getElementById('sicorp-frequent'))return;
 const grid=document.getElementById('grid'), search=document.getElementById('search');
 if(!grid||!search||typeof renderCatalog!=='function')return;
 function rankHistory(history, products, selectedBrand, selectedCategory){
 const eligible=new Map(products.filter(p=>(selectedBrand==='TODAS'||p.brand===selectedBrand)&&(selectedCategory==='Todas'||p.cat===selectedCategory)).map(p=>[String(p.id),p]));
 const sums=new Map();
 for(const [date, rows] of Object.entries(history||{})){
  if(!Array.isArray(rows))continue;
  for(const x of rows){
   if(!x)continue;
   const id=String(x.id), p=eligible.get(id), v=Number(x.v), n=Number(x.q);
   if(!p||!Number.isInteger(v)||!p.variants[v]||!Number.isSafeInteger(n)||n<=0)continue;
   if(!sums.has(id))sums.set(id,{p,count:0,days:new Set(),last:'',variants:new Map()});
   const a=sums.get(id);
   a.count+=n; a.days.add(date); if(date>a.last)a.last=date;
   const b=a.variants.get(v)||{v,count:0,last:''}; b.count+=n; if(date>b.last)b.last=date; a.variants.set(v,b);
  }
 }
 return Array.from(sums.values()).sort((a,b)=>b.count-a.count||b.days.size-a.days.size||b.last.localeCompare(a.last)||a.p.name.localeCompare(b.p.name,'es')).slice(0,6).map(a=>({...a,preferred:[...a.variants.values()].sort((a,b)=>b.count-a.count||b.last.localeCompare(a.last)||a.v-b.v)[0]}));
}
 const palettes={
   black:['#20252d','#e2e5eb','#b9c3d4'],
   erica:['#1684ac','#d9f2fa','#7bd5f1'],
   world:['#7443a6','#eee3fc','#caa7f5'],
   hotel:['#987126','#faf0da','#e8c77c'],
   aqua:['#087f83','#dcf6f1','#70dcd6'],
   calm:['#6b57a2','#eee9fb','#c9b9f1'],
   carbon:['#536477','#e4ebf2','#b8c9df'],
   luxury:['#9a6a3a','#f9ebdd','#ebc197'],
   wellness:['#3e795d','#e1f2e7','#91d5ac'],
   essential:['#416da1','#e3edfa','#a8cbf6'],
   deconova:['#a65b31','#fbe9dd','#f2b591'],
   protector:['#3d8068','#e0f4eb','#90d5b7'],
   base:['#637087','#e8ecf4','#bdcbe1'],
   pillow:['#527292','#e2edf8','#a9cceb']
 };
 function palette(p){
  const f=String(p.family||p.name||'').toLowerCase();
  if(p.brand==='DECONOVA')return 'deconova';
  if(f.includes('black'))return 'black';
  if(f.includes('world class'))return 'world';
  if(f.includes('erica')||f.includes('beautysleep'))return 'erica';
  if(f.includes('hotel'))return 'hotel';
  if(f.includes('aquacool'))return 'aqua';
  if(f.includes('calm'))return 'calm';
  if(f.includes('carbon'))return 'carbon';
  if(f.includes('luxury'))return 'luxury';
  if(f.includes('wellness'))return 'wellness';
  if(f.includes('essential'))return 'essential';
  if(p.cat==='Protectores')return 'protector';
  if(p.cat==='Bases')return 'base';
  return 'pillow';
 }
 function colorize(node,p){
  if(!node||!p)return;
  const colors=palettes[palette(p)];
  node.classList.add('sicorp-family-color');
  node.style.setProperty('--family-ink',colors[0]);
  node.style.setProperty('--family-bg',colors[1]);
  node.style.setProperty('--family-dark',colors[2]);
 }
 const style=document.createElement('style');
 style.textContent=`
 .sicorp-family-color{--family-tone:var(--family-ink);--family-tint:var(--family-bg)}
 html[data-sicorp-theme="dark"] .sicorp-family-color{--family-tone:var(--family-dark);--family-tint:color-mix(in srgb,var(--family-dark) 13%,var(--surface))}
 html[data-sicorp-theme] .family-toggle.sicorp-family-color{background:var(--family-tint);border-color:var(--line);border-inline-start:5px solid var(--family-tone);color:var(--text)}
 html[data-sicorp-theme] .family-toggle.sicorp-family-color[aria-expanded="true"]{border-color:var(--family-tone)}
 .family-toggle.sicorp-family-color .family-arrow,.family-toggle.sicorp-family-color .family-copy strong{color:var(--family-tone)}
 html[data-sicorp-theme] .product.sicorp-family-color{border-inline-start:4px solid var(--family-tone)}
 .product.sicorp-family-color .smalladd,.product.sicorp-family-color .tag{color:var(--family-tone)}
 #sicorp-frequent{padding:15px;margin-bottom:18px}
 .frequent-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:11px}
 .frequent-heading h2{margin:0;font-size:19px}
 .frequent-heading p{margin:4px 0 0;font-size:12px;color:var(--muted)}
 .frequent-label{display:inline-block;font-size:10px;font-weight:750;color:var(--accent);background:var(--hero);padding:5px 8px;border-radius:99px;white-space:nowrap}
 .frequent-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .frequent-item{position:relative;display:flex;flex-direction:column;align-items:stretch;text-align:left;min-width:0;min-height:135px;border:1px solid var(--line);border-top:4px solid var(--family-tone);border-radius:14px;background:var(--surface);padding:8px;gap:5px;overflow:hidden}
 .frequent-item:active{background:var(--family-tint)}
 .frequent-item img{width:100%;height:75px;object-fit:contain;background:white;border-radius:9px}
 .frequent-item .frequent-family{font-size:10px;color:var(--family-tone);font-weight:750;line-height:1.25}
 .frequent-item strong{font-size:13px;line-height:1.3;overflow-wrap:anywhere}
 .frequent-item .frequent-size{font-size:11px;color:var(--muted);line-height:1.35;overflow-wrap:anywhere}
 .frequent-item .frequent-footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto;font-size:11px;gap:3px;color:var(--family-tone);font-weight:750}
 .frequent-item .frequent-add{border-radius:9px;background:var(--family-tint);font-size:20px;line-height:1;min-width:32px;text-align:center;padding:6px}
 .frequent-empty{font-size:13px;color:var(--muted);padding:8px 0}
 .frequent-date{font-size:11px;color:var(--muted);margin:10px 0 0}
 .catalog-section-title{font-size:18px;margin:0 3px 10px;font-weight:800;color:var(--text)}
 @media(min-width:560px){.frequent-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:320px){.frequent-grid{grid-template-columns:1fr}}
 `;
 document.head.appendChild(style);
 const make=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;if(cls)n.className=cls;return n;};
 const section=make('section','','card');section.id='sicorp-frequent';
 grid.parentNode.insertBefore(section,grid);
 const title=make('h2','Catálogo completo','catalog-section-title');
 grid.parentNode.insertBefore(title,grid);
 function renderFrequent(){
  const searching=!!search.value.trim();
  section.classList.toggle('hidden',searching);
  title.textContent=searching?'Resultados de búsqueda':'Catálogo completo';
  if(searching)return;
  section.replaceChildren();
  const heading=make('div','','frequent-heading'), copy=make('div');
  copy.append(make('h2','Más vendidos'),make('p','Según todo tu historial de ventas.'));
  heading.append(copy,make('span','Acceso rápido','frequent-label'));section.append(heading);
  const ranked=rankHistory(records,catalog,brand,cat);
  if(!ranked.length){section.append(make('p','Todavía no hay ventas en esta selección. Los productos aparecerán aquí al registrarlos.','frequent-empty'));return;}
  const cards=make('div','','frequent-grid');
  ranked.forEach(a=>{
    const p=a.p,v=a.preferred.v, item=make('button','','frequent-item');
    item.type='button';colorize(item,p);
    item.setAttribute('aria-label','Registrar '+label(p,p.variants[v])+', '+a.count+' unidades en historial');
    const image=p.variants[v].photos?.[0]||p.photos?.[0];
    if(image){const img=make('img');img.src=image;img.alt='';img.loading='lazy';item.append(img);}
    item.append(make('span',p.family||p.cat,'frequent-family'),make('strong',p.name));
    const pv=p.variants[v];
    item.append(make('span','Habitual: '+[pv.size,p.cat==='Bases'?pv.height:''].filter(Boolean).join(' · '),'frequent-size'));
    const footer=make('span','','frequent-footer');
    footer.append(make('span',a.count+' vendida'+(a.count===1?'':'s')),make('span','+','frequent-add'));item.append(footer);
    item.addEventListener('click',()=>{
      open(p);variant=v;updateVariant();
      colorize(document.getElementById('modal'),p);
    });
    cards.append(item);
  });
  section.append(cards,make('p','Elige un producto, confirma medida y cantidad. Registro: '+fmtDay(day)+'.','frequent-date'));
 }
 function decorateCatalog(){
  grid.querySelectorAll('[data-family]').forEach(node=>{
   const group=familyGroups[Number(node.dataset.family)];
   const p=group&&catalog.find(p=>group[3].includes(p.id));
   colorize(node,p);
  });
  grid.querySelectorAll('[data-product]').forEach(node=>colorize(node,catalog.find(p=>p.id===node.dataset.product)));
 }
 const originalCatalog=renderCatalog;
 renderCatalog=function(){originalCatalog();decorateCatalog();renderFrequent();};
 search.oninput=renderCatalog;
 const originalOpen=open;
 open=function(p){originalOpen(p);colorize(document.getElementById('modal'),p);};
 renderCatalog();
})();


/* v1.4.11 - registro simultaneo de medidas, guardado unico y reversible. */
(function(){
 'use strict';
 const by=id=>document.getElementById(id), modal=by('modal'), oldVariants=by('variants'), add=by('add');
 if(!modal||!oldVariants||!add||by('sicorp-batch'))return;
 const make=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;if(cls)n.className=cls;return n;};
 const style=make('style');style.textContent=`
 #modal #sicorp-batch{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:9px;margin:10px 0}
 #modal .batch-row{display:flex;flex-direction:column;justify-content:space-between;min-width:0;min-height:128px;gap:8px;align-items:stretch;padding:8px;border:1px solid var(--line);border-radius:15px;background:var(--surface)}
 #modal .batch-row.selected{border-color:var(--accent);background:var(--hero)}
 #modal .batch-label{min-width:0;display:flex;flex-direction:column;text-align:left;gap:3px;padding:5px;background:transparent;color:var(--text);font-size:14px;overflow-wrap:anywhere}
 #modal .batch-label small{font-size:11px;font-weight:500;color:var(--muted)}
 #modal .batch-stepper{display:grid;grid-template-columns:40px minmax(0,1fr) 40px;align-items:center;gap:0;min-width:0}
 #modal .batch-stepper button{padding:0;min-height:44px;min-width:40px;border-radius:12px;background:var(--selected);color:var(--accent);font-size:22px}
 #modal .batch-stepper input{width:100%;min-width:0;text-align:center;padding:3px 0;border:0;background:transparent;color:var(--text);font-size:16px;font-weight:750;appearance:textfield}
 #modal .batch-stepper input::-webkit-inner-spin-button,#modal .batch-stepper input::-webkit-outer-spin-button{appearance:none}
 #modal .batch-hint{font-size:12px;color:var(--muted);margin:3px 0}
 #modal .batch-footer{position:sticky;bottom:-1px;background:var(--surface);padding:10px 0 2px;z-index:2;border-top:1px solid var(--line)}
 #modal .batch-summary{font-size:12px;color:var(--muted);font-weight:650;margin-bottom:7px}
 #modal .batch-preview{margin:14px 0 4px}
 #modal .batch-preview summary{padding:10px 0;color:var(--accent);font-weight:650}
 #modal .batch-preview #mainphoto{max-height:180px;object-fit:contain}
 #modal [hidden]{display:none!important}
 `;document.head.append(style);
 const oldQty=by('minus').closest('.row');
 oldVariants.hidden=true;oldQty.hidden=true;
 const heading=oldVariants.previousElementSibling;heading.textContent='Medidas y cantidades';
 const hint=make('p','Indica cuántas unidades vendiste de cada medida. Las que queden en 0 no se registran.','batch-hint');
 const rows=make('div');rows.id='sicorp-batch';rows.setAttribute('role','group');rows.setAttribute('aria-label','Cantidades por medida');
 oldVariants.after(hint,rows);
 const preview=make('details','','batch-preview');preview.append(make('summary','Ver fotos y detalles de la medida'));
 const photo=by('mainphoto'), photos=by('photos'), info=by('variantinfo');
 const details=by('details').closest('details');
 rows.after(preview);preview.append(info,photo,photos,details);
 const footer=make('div','','batch-footer'), summary=make('div','','batch-summary');
 summary.setAttribute('aria-live','polite');add.before(footer);footer.append(summary,add);
 let pending=[], controls=[], saving=false, openedDay='';
 const sum=()=>pending.reduce((a,b)=>a+b,0);
 const refresh=()=>{
  controls.forEach((c,i)=>{c.row.classList.toggle('selected',pending[i]>0);if(document.activeElement!==c.input)c.input.value=String(pending[i]);c.minus.disabled=pending[i]===0;c.plus.disabled=pending[i]>=999;c.label.setAttribute('aria-pressed',String(variant===i));});
  const units=sum(), sizes=pending.filter(n=>n>0).length;
  summary.textContent=units+' unidad'+(units===1?'':'es')+' · '+sizes+' medida'+(sizes===1?'':'s')+' · '+fmtDay(openedDay||day);
  add.disabled=saving||units===0;add.textContent=units?'Registrar '+units+' unidad'+(units===1?'':'es'):'Registrar ventas';
 };
 const set=(i,n)=>{pending[i]=Math.max(0,Math.min(999,Math.trunc(Number(n)||0)));refresh();};
 const oldUpdate=updateVariant;
 updateVariant=function(){oldUpdate();refresh();};
 function build(){
  rows.replaceChildren();controls=[];
  product.variants.forEach((v,i)=>{
   const row=make('div','','batch-row'), label=make('button','','batch-label');label.type='button';
   label.append(make('strong',[v.size,product.cat==='Bases'?v.height:''].filter(Boolean).join(' · ')||'Única medida'));
   const sub=[v.dim!==v.size?v.dim:'',v.code?'Código: '+v.code:''].filter(Boolean).join(' · ');
   if(sub)label.append(make('small',sub));
   label.onclick=()=>{variant=i;updateVariant();preview.open=true;};
   const stepper=make('div','','batch-stepper'), minus=make('button','−'), plus=make('button','+'), input=make('input');
   minus.type=plus.type='button';minus.setAttribute('aria-label','Restar '+v.size);plus.setAttribute('aria-label','Sumar '+v.size);
   input.type='number';input.inputMode='numeric';input.min='0';input.max='999';input.step='1';input.value='0';input.setAttribute('aria-label','Cantidad '+v.size+(v.height?' '+v.height:''));
   minus.onclick=()=>{set(i,pending[i]-1);input.value=String(pending[i]);};plus.onclick=()=>{set(i,pending[i]+1);input.value=String(pending[i]);};
   input.oninput=()=>{set(i,input.value);if(input.value!==''&&Number(input.value)!==pending[i])input.value=String(pending[i]);};input.onblur=()=>{input.value=String(pending[i]);};input.onfocus=()=>input.select();
   stepper.append(minus,input,plus);row.append(label,stepper);rows.append(row);controls.push({row,label,minus,plus,input});
  });refresh();
 }
 const oldOpen=open;
 open=function(p){pending=p.variants.map(()=>0);controls=[];openedDay=day;saving=false;preview.open=false;oldOpen(p);build();modal.scrollTop=0;};
 add.onclick=()=>{
  if(saving||!sum()||!product||day!==openedDay)return;
  saving=true;refresh();
  const had=Object.prototype.hasOwnProperty.call(records,day), before=records[day], next=list().map(x=>({...x})), units=sum();
  for(let i=0;i<pending.length;i++){
   const n=pending[i];if(!n)continue;
   const existing=next.find(x=>x.id===product.id&&x.v===i);
   if(existing){if(!Number.isSafeInteger(existing.q+n)){saving=false;refresh();notify('Cantidad fuera de rango.');return;}existing.q+=n;}
   else next.push({id:product.id,v:i,q:n});
  }
  records[day]=next;
  if(!persist()){if(had)records[day]=before;else delete records[day];saving=false;refresh();return;}
  pending=pending.map(()=>0);modal.close();render();notify(units+' unidad'+(units===1?' registrada':'es registradas'));saving=false;
 };
 window.sicorpCaptureDraft=()=>modal.open&&!saving&&product&&sum()>0?{id:String(product.id),day:openedDay,quantities:pending.slice()}:null;
 window.sicorpRestoreDraft=d=>{
  if(!d||!/^\d{4}-\d{2}-\d{2}$/.test(d.day)||!Array.isArray(d.quantities))return;
  const p=catalog.find(x=>String(x.id)===d.id);
  if(!p||p.variants.length!==d.quantities.length||!d.quantities.every(n=>Number.isInteger(n)&&n>=0&&n<=999)||!d.quantities.some(n=>n>0))return;
  day=d.day;render();open(p);pending=d.quantities.slice();refresh();notify('Selección pendiente recuperada. Confirma para registrar.');
 };
 modal.addEventListener('close',()=>{pending=[];controls=[];saving=false;});
})();


/* SICORP 2.1.1 — WhatsApp report formats C and D. Same generator for preview, copy and share. */
(function(){
 'use strict';
 if(typeof report!=='function'||typeof renderReport!=='function')return;
 function text(s){return String(s||'').replace(/\s+/g,' ').trim();}
 function dimensions(v){
  const d=text(v.dim);
  return /^\d+(?:[.,]\d+)?\s*[×xX]\s*\d+(?:[.,]\d+)?(?:\s*cm)?$/i.test(d)
    ?d.replace(/\s*cm$/i,'').replace(/\s*[×xX]\s*/g,'x'):d;
 }
 function displayName(p,v){
  const dim=dimensions(v),size=text(v.size),name=text(p.name);
  let measure=dim||size;
  // Distinguish real variants when size or base height identifies a different reference.
  if(dim&&size&&p.cat!=='Almohadas'&&p.cat!=='Sets de almohadas'&&!/^(únic[ao]|standard)$/i.test(size)&&size!==dim)measure=size+' '+dim;
  if(p.cat==='Bases'&&v.height)measure=[measure,text(v.height)+' de alto'].filter(Boolean).join(' · ');
  const brand=p.brand==='DECONOVA'&&!/deconova/i.test(name)?'Deconova ':'';
  return brand+name+(measure?' '+measure:'');
 }
 const originalReport=report;
 report=function(rows,mode=reportMode){
  const items=rows.map(x=>({x,p:get(x),v:vget(x)}));
  if(items.some(r=>!r.p||!r.v))return originalReport(rows,mode);
  const lines=['*DE PRATI ROTONDA*'];
  if(mode==='detailed'){
   const date=/^\d{4}-\d{2}-\d{2}$/.test(day)?day.split('-').reverse().join('/'):fmtDay(day);
   lines.push('Ventas | '+date);
  }
  lines.push('');
  if(!items.length){lines.push('_Sin ventas registradas._');return lines.join('\n');}
  if(mode==='detailed'){
   const categoryOrder=[...new Set([...cats,...items.map(r=>r.p.cat)])];
   let first=true;
   for(const category of categoryOrder){
    const group=items.filter(r=>r.p.cat===category);
    if(!group.length)continue;
    if(!first)lines.push('');
    first=false;
    lines.push('*'+category+'*',...group.map(({x,p,v})=>'- '+x.q+' '+displayName(p,v)));
   }
  }else lines.push(...items.map(({x,p,v})=>displayName(p,v)+' #'+x.q));
  const units=total(rows);
  lines.push('', '*Total: '+units+' '+(units===1?'unidad':'unidades')+'.*');
  return lines.join('\n');
 };
 reportMode='compact';
 const detailed=document.querySelector('[data-reportmode="detailed"]');
 if(detailed)detailed.textContent='Largo';
 renderReport(list());
})();
