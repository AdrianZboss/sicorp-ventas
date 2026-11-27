(function(){
  'use strict';
  if(document.getElementById('sicorp-theme-style'))return;
  const style=document.createElement('style');
  style.id='sicorp-theme-style';
  style.textContent=`
html[data-sicorp-theme="light"]{
  color-scheme:light;
  --canvas:#f5f6f8;--surface:#ffffff;--soft:#edf0f3;
  --text:#202936;--navy:#24374e;--blue:#345d8a;
  --muted:#616e7d;--line:#e1e5ea;--selected:#e8eef5;
  --on-primary:#ffffff;--danger-bg:#fbefef;--danger-text:#9e353a;
  --success-bg:#e8f1eb;--success-text:#285b42;--focus:#527da8;
}
html[data-sicorp-theme="dark"]{
  color-scheme:dark;
  --canvas:#101418;--surface:#191f26;--soft:#242c35;
  --text:#e2e7ed;--navy:#a9c2df;--blue:#adc8e6;
  --muted:#a5b0bf;--line:#36414d;--selected:#2b3c50;
  --on-primary:#18283b;--danger-bg:#40272c;--danger-text:#ffc4c4;
  --success-bg:#253f35;--success-text:#b7e4c9;--focus:#89a9cc;
}
html[data-sicorp-theme]{background:var(--canvas);color:var(--text)}
html[data-sicorp-theme] body{background:var(--canvas);color:var(--text)}
html[data-sicorp-theme] header{background:var(--surface);color:var(--text)}
html[data-sicorp-theme] .card,html[data-sicorp-theme] dialog,html[data-sicorp-theme] .product,html[data-sicorp-theme] .nav{background:var(--surface);color:var(--text);border-color:var(--line)}
html[data-sicorp-theme] input,html[data-sicorp-theme] select,html[data-sicorp-theme] textarea{background:var(--surface);color:var(--text);border-color:var(--line)}
html[data-sicorp-theme] .report{background:var(--canvas);border-color:var(--line);color:var(--text)}
html[data-sicorp-theme] .product img,html[data-sicorp-theme] #mainphoto,html[data-sicorp-theme] .photo-strip img{background:#fff}
html[data-sicorp-theme="dark"] .product img,html[data-sicorp-theme="dark"] #mainphoto,html[data-sicorp-theme="dark"] .photo-strip img{filter:brightness(.86)}
#sicorpThemeToggle{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:8px 10px;margin:5px 0 0;font-size:12px;line-height:1.2;background:var(--soft);color:var(--text);border:1px solid var(--line);border-radius:10px}
html[data-sicorp-theme="dark"] dialog::backdrop{background:#000a}
`;
  document.head.appendChild(style);
  const button=document.createElement('button');
  button.id='sicorpThemeToggle';button.type='button';
  const parent=document.querySelector('header .headcount')||document.querySelector('header')||document.body;
  parent.appendChild(button);
  const nativeTheme=!!(window.Native&&typeof Native.getAppearance==='function');
  let current='dark';
  try{const saved=nativeTheme?Native.getAppearance():localStorage.getItem('sicorp.theme');current=saved==='light'||saved==='dark'?saved:(!nativeTheme&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');}catch(e){}
  function apply(mode,save){
    current=mode;
    document.documentElement.dataset.sicorpTheme=mode;
    button.textContent=mode==='dark'?'☀ Claro':'☾ Oscuro';
    button.setAttribute('aria-label',mode==='dark'?'Activar modo claro':'Activar modo oscuro');
    if(save){try{if(nativeTheme)Native.setAppearance(mode);else localStorage.setItem('sicorp.theme',mode);}catch(e){}}
  }
  button.addEventListener('click',()=>apply(current==='dark'?'light':'dark',true));
  apply(current,false);
})();