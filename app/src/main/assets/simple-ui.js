(function(){
  'use strict';
  if(document.getElementById('simpleFlow') || typeof renderCatalog!=='function') return;
  const by=id=>document.getElementById(id);
  const catalogSection=by('catalog'), brandRow=by('brands'), catRow=by('cats'), grid=by('grid'), search=by('search');
  if(!catalogSection||!brandRow||!catRow||!grid||!search) return;
  const originalRender=renderCatalog;
  let stage=0;
  const style=document.createElement('style');
  style.textContent=`
    header{padding:12px 16px 10px;position:relative}
    header h1{font-size:18px;letter-spacing:0}
    header small{font-size:10px;letter-spacing:.6px}
    .headcount{font-size:23px}
    main{max-width:760px;padding-top:16px}
    h2{font-size:18px;font-weight:650}
    .card{padding:16px;margin-bottom:16px;border-radius:14px}
    .flow-label{font-size:13px;font-weight:650;color:var(--text);margin:14px 0 6px}
    .flow-hint{font-size:13px;color:var(--muted);margin:8px 0;line-height:1.5}
    .flow-choice{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:8px 0}
    .flow-choice span{font-size:14px;font-weight:650;overflow-wrap:anywhere}
    .flow-choice button{font-size:12px;min-height:44px;padding:8px 12px}
    #brands{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    #brands [data-brand="TODAS"]{grid-column:1/-1;background:transparent!important;color:var(--muted)!important}
    #brands button{min-height:54px}
    #cats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    #cats .chip{min-height:46px;font-size:14px}
    #catalogcount{font-size:12px}
    .groupcategory{margin:20px 2px 8px;color:var(--muted);font-size:13px}
    .family-toggle{min-height:54px;padding:12px 14px}
    .family-copy strong{font-weight:600}
    .family-grid{grid-template-columns:1fr;gap:8px}
    .product{display:grid;grid-template-columns:92px minmax(0,1fr);align-items:center;min-height:96px}
    .product img{height:92px;width:92px}
    .product .body{padding:12px;gap:4px}
    .product .smalladd{font-weight:600}
    .nav button{font-size:12px}
    .simple-details{margin:12px 0}
    .simple-details summary{padding:12px 0;min-height:44px;color:var(--muted)}
    #sicorpUpdates .full{margin-top:4px}
    #simpleFlow{margin-bottom:4px}
    @media(min-width:560px){.family-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);
  const make=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;if(cls)n.className=cls;return n;};
  const flow=make('div');flow.id='simpleFlow';
  const brandLabel=make('div','1. Elige una marca','flow-label');
  const catLabelNode=make('div','2. Elige una categoría','flow-label');
  const brandChoice=make('div','','flow-choice');
  const catChoice=make('div','','flow-choice');
  const brandName=make('span'),catName=make('span');
  const changeBrand=make('button','Cambiar marca','ghost'),changeCat=make('button','Cambiar categoría','ghost');
  changeBrand.type=changeCat.type='button';
  brandChoice.append(brandName,changeBrand);catChoice.append(catName,changeCat);
  const hint=make('p','','flow-hint');
  const card=brandRow.parentElement;
  card.insertBefore(flow,brandRow);flow.append(brandLabel,brandChoice,brandRow);
  flow.append(catLabelNode,catChoice,catRow);
  card.insertBefore(search,flow);
  search.placeholder='Buscar producto o código';
  card.appendChild(hint);
  const setHidden=(node,yes)=>node.classList.toggle('hidden',yes);
  function sync(){
    const q=search.value.trim();
    setHidden(brandLabel,stage!==0);setHidden(brandRow,stage!==0);
    setHidden(brandChoice,stage===0);
    setHidden(catLabelNode,stage!==1);setHidden(catRow,stage!==1);
    setHidden(catChoice,stage!==2);
    brandName.textContent=brand==='TODAS'?'Todas las marcas':brand==='SIMMONS'?'Simmons':'Deconova';
    catName.textContent=cat==='Todas'?'Todas las categorías':cat;
    setHidden(grid,stage!==2&&!q);
    setHidden(by('catalogcount'),stage!==2&&!q);
    hint.textContent=q?'Resultados de búsqueda':stage===0?'Elige una marca o busca directamente.':stage===1?'Selecciona el tipo de producto.':'Abre una familia para registrar una venta.';
    if(q) {
      grid.querySelectorAll('.family-toggle[aria-expanded="false"]').forEach(b=>toggleFamily(b));
    }
  }
  renderCatalog=function(){
    const q=norm(search.value.trim());
    const key=JSON.stringify([brand,cat,q]);
    if(!q&&!expandedViews.has(key))expandedViews.set(key,new Set());
    originalRender();sync();
  };
  expandedViews.clear();
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(!b)return;
    if(b.dataset.brand){stage=1;search.value='';}
    if(b.dataset.cat){stage=2;search.value='';}
  },true);
  changeBrand.onclick=()=>{stage=0;brand='TODAS';cat='Todas';search.value='';renderCatalog();};
  changeCat.onclick=()=>{stage=1;cat='Todas';search.value='';renderCatalog();};
  function fold(nodes,label){
    const selected=nodes.filter(Boolean);
    if(!selected.length)return;
    const detail=make('details','','simple-details'),sum=make('summary',label);
    selected[0].parentNode.insertBefore(detail,selected[0]);detail.appendChild(sum);
    selected.forEach(n=>detail.appendChild(n));return detail;
  }
  const reportNode=by('report');
  if(reportNode){
    fold([reportNode.parentElement.querySelector('.reportmodes'),reportNode],'Vista previa y formato del reporte');
    by('copy').textContent='Copiar reporte';
    by('share').textContent='Compartir';
    fold([by('clear')],'Más opciones');
  }
  const backup=by('backup');
  if(backup){
    const backupCard=backup.closest('.card');
    if(backupCard){
      const nodes=Array.from(backupCard.children).filter(n=>n.tagName!=='H2');
      fold(nodes,'Copiar o restaurar respaldo');
    }
  }
  const history=by('history');
  if(history&&!by('sicorpUpdates')&&window.Native){
    const update=make('div','','card');update.id='sicorpUpdates';
    const row=make('div','','row');
    row.append(make('span','Versión '+Native.installedVersion(),'muted'));
    const button=make('button','Actualizar app','ghost');button.type='button';button.onclick=()=>Native.openUpdates();
    row.append(button);update.append(row);history.append(update);
  }
  const nav= document.querySelector('[data-page="catalog"]');
  if(nav&&nav.lastChild&&nav.lastChild.nodeType===3)nav.lastChild.nodeValue='Registrar';
  const title=catalogSection.querySelector('h2');if(title)title.textContent='Registrar venta';
  renderCatalog();
})();