#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Publish only the same static client used by the Android app and GitHub Pages.
rm -rf dist
mkdir -p dist/web dist/app/src/main/assets
cp web/index.html web/boot.js dist/web/
for file in index.html theme.js simple-ui.js cloud.js; do
  cp "app/src/main/assets/$file" "dist/app/src/main/assets/$file"
done
cp sw.js dist/sw.js
# Include the root and the clean URL used by Cloudflare for index.html.
python3 - <<'PY'
from pathlib import Path
p=Path('dist/sw.js')
s=p.read_text()
anchor="const files=["
assert anchor in s
p.write_text(s.replace(anchor,anchor+"'./','index.html','app/src/main/assets/',",1))
PY
cat > dist/index.html <<'HTML'
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="referrer" content="no-referrer">
<meta name="description" content="SICORP Ventas: herramienta privada de gestión comercial, registro de ventas y reportes. Acceso reservado a usuarios autorizados.">
<title>SICORP Ventas | Gestión comercial privada</title>
<style>html,body{margin:0;width:100%;height:100%;background:#0d1420;color:#edf4ff;font:15px system-ui}iframe{border:0;width:100%;height:100%;display:block;visibility:hidden}#loading{position:fixed;inset:0;display:grid;place-content:center;text-align:center;padding:20px}#loading h1{font-size:24px;margin:0 0 8px}#loading p{margin:0;color:#a6b8cf}#loading a{color:#a5cbff}</style>
</head>
<body>
<div id="loading"><h1>SICORP Ventas</h1><p>Herramienta privada de gestión comercial.</p><p>Cargando catálogo…</p><noscript><a href="./web/">Abrir aplicación (requiere JavaScript)</a></noscript></div>
<iframe id="app" title="SICORP Ventas"></iframe>
<script>if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});</script>
<script>(function(){var s=document.createElement('script');s.src='./web/boot.js?v='+Date.now();s.onerror=function(){document.getElementById('loading').textContent='No se pudo cargar SICORP. Recarga la página.'};document.head.append(s)})();</script>
</body>
</html>
HTML
cat > dist/_headers <<'HEADERS'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: SAMEORIGIN
/app/*
  X-Robots-Tag: noindex
/web/*
  X-Robots-Tag: noindex
HEADERS
cat > dist/robots.txt <<'ROBOTS'
User-agent: *
Allow: /
ROBOTS
test -s dist/index.html
test -s dist/app/src/main/assets/cloud.js
echo "SICORP Pages: static client ready in dist/"
