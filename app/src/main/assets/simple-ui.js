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
    .family-grid{grid-template-columns:1fr;gap:8px;padding-top:8px}
    html[data-sicorp-theme] .product{display:grid;grid-template-columns:84px minmax(0,1fr);align-items:center;min-height:96px;border-radius:16px;padding:7px;gap:2px}
    .product img{width:84px;height:84px;border-radius:11px;object-fit:contain}
    .product .body{padding:7px 8px;gap:4px;min-width:0}
    .product strong{font-size:15px;font-weight:720}
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
    @media(min-width:560px){.family-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:339px){main{padding-inline:10px}#brands button{font-size:11px}.product img{width:68px;height:68px}html[data-sicorp-theme] .product{grid-template-columns:68px minmax(0,1fr)}}
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