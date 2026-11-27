package ec.sicorpmattress.ventas;
import android.app.Activity;import android.os.Bundle;import android.content.*;import android.webkit.*;import android.net.Uri;import java.io.*;import java.util.*;
public class MainActivity extends Activity {
 private WebView web; private UpdateManager updater; private static final String PAGE="file:///android_asset/index.html";
 @Override public void onCreate(Bundle state){super.onCreate(state);applyAppearance();updater=new UpdateManager(this);web=new WebView(this);web.setAlpha(0f);web.setBackgroundColor(appearance().equals("light")?0xfff5f6f8:0xff101418);setContentView(web);WebSettings s=web.getSettings();s.setUseWideViewPort(true);s.setLoadWithOverviewMode(false);s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setBlockNetworkLoads(true);web.addJavascriptInterface(new Bridge(),"Native");web.setWebChromeClient(new WebChromeClient());web.setWebViewClient(new WebViewClient(){@Override public void onPageFinished(WebView v,String url){if(!PAGE.equals(url))return;loadTheme(v);try(BufferedReader reader=new BufferedReader(new InputStreamReader(getAssets().open("simple-ui.js"),java.nio.charset.StandardCharsets.UTF_8))){StringBuilder script=new StringBuilder();String line;while((line=reader.readLine())!=null)script.append(line).append('\n');v.evaluateJavascript(script.toString(),null);}catch(IOException e){android.util.Log.e("SicorpVentas","No se pudo cargar interfaz simplificada",e);}loadCloud(v);v.evaluateJavascript("(function(){if(document.getElementById('sicorpUpdates'))return;var h=document.getElementById('history');var c=document.createElement('div');c.id='sicorpUpdates';c.className='card';var b=document.createElement('button');b.type='button';b.className='full primary';b.textContent='Actualizar app · '+Native.installedVersion();b.onclick=function(){Native.openUpdates();};c.appendChild(b);if(h)h.appendChild(c);else {c.style.cssText='position:fixed;right:12px;bottom:90px;z-index:99;padding:4px';document.body.appendChild(c);}})()",null);}@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !PAGE.equals(r.getUrl().toString());}@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){if(PAGE.equals(r.getUrl().toString()))try{return new WebResourceResponse("text/html","UTF-8",getAssets().open("index.html"));}catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}if("data".equals(r.getUrl().getScheme()))return null;return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}});web.loadUrl(PAGE);}

 @Override protected void onResume(){super.onResume();if(web!=null)web.evaluateJavascript("window.sicorpCheckIdle&&window.sicorpCheckIdle()",null);}
 @Override public void onWindowFocusChanged(boolean focus){super.onWindowFocusChanged(focus);if(focus&&web!=null)web.evaluateJavascript("window.sicorpCheckIdle&&window.sicorpCheckIdle()",null);}
 private String appearance(){return "light".equals(getSharedPreferences("appearance",MODE_PRIVATE).getString("mode","dark"))?"light":"dark";}
 private void applyAppearance(){
   boolean light="light".equals(appearance());
   int color=light?0xffffffff:0xff191f26;
   getWindow().setStatusBarColor(color);getWindow().setNavigationBarColor(color);
   android.view.View decor=getWindow().getDecorView();
   int flags=decor.getSystemUiVisibility();
   int mask=android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
   decor.setSystemUiVisibility(light?flags|mask:flags&~mask);
   if(web!=null)web.setBackgroundColor(light?0xfff5f6f8:0xff101418);
 }
 private void loadTheme(WebView v){
   try(BufferedReader reader=new BufferedReader(new InputStreamReader(getAssets().open("theme.js"),java.nio.charset.StandardCharsets.UTF_8))){
     StringBuilder script=new StringBuilder();String line;
     while((line=reader.readLine())!=null)script.append(line).append('\n');
     v.evaluateJavascript(script.toString(),null);
   }catch(IOException e){android.util.Log.e("SicorpVentas","No se pudo cargar el tema",e);}
 }
 private void loadCloud(WebView v){
   try(InputStream input=getAssets().open("cloud.js"); ByteArrayOutputStream out=new ByteArrayOutputStream()){
     byte[] buf=new byte[8192]; int n; while((n=input.read(buf))!=-1)out.write(buf,0,n);
     v.evaluateJavascript(new String(out.toByteArray(),java.nio.charset.StandardCharsets.UTF_8),ignored->v.evaluateJavascript("(function(){var l=document.getElementById('sicorp-cloud-login');return !!(l&&l.open);})()",result->{if("true".equals(result))v.setAlpha(1f);else cloudLoadError();}));
   }catch(IOException e){android.util.Log.e("SicorpVentas","No se pudo cargar la nube",e);cloudLoadError();}
 }
 private void cloudLoadError(){runOnUiThread(()->{if(!isFinishing()&&!isDestroyed())new android.app.AlertDialog.Builder(this).setTitle("SICORP Ventas").setMessage("No se pudo iniciar el acceso privado. Tus datos locales se conservan.").setCancelable(false).setPositiveButton("Reintentar",(d,w)->web.reload()).setNegativeButton("Salir",(d,w)->finish()).show();});}
 private final java.util.concurrent.ExecutorService cloudExecutor=java.util.concurrent.Executors.newSingleThreadExecutor();
 private static final String CLOUD_URL="https://jooxurfzxumbyjdcmzjs.supabase.co";
 private static final String CLOUD_KEY="sb_publishable_ZYRZ5ji-puffBS1P46VlWA_Z8pEstps";
 private boolean allowedCloud(String path,String method){
  return ("POST".equals(method)&&("/auth/v1/token?grant_type=password".equals(path)||"/auth/v1/token?grant_type=refresh_token".equals(path)||"/auth/v1/logout?scope=local".equals(path)||"/rest/v1/rpc/sicorp_sync_commit".equals(path)||"/storage/v1/object/list/sicorp-evidence".equals(path)))||("GET".equals(method)&&"/rest/v1/sicorp_history?select=revision,records".equals(path));
 }
 private void respondCloud(String id,int code,String body){runOnUiThread(()->{if(web!=null&&!isDestroyed()&&!isFinishing())web.evaluateJavascript("window.sicorpCloudReceive&&window.sicorpCloudReceive("+org.json.JSONObject.quote(id)+","+code+","+org.json.JSONObject.quote(body)+")",null);});}
 private void performCloud(String id,String path,String method,String token,String body){
  java.net.HttpURLConnection connection=null;
  try{
   if(!allowedCloud(path,method)||body.length()>2200000||token.length()>16000){respondCloud(id,400,"");return;}
   connection=(java.net.HttpURLConnection)new java.net.URL(CLOUD_URL+path).openConnection();
   connection.setRequestMethod(method);connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(12000);connection.setReadTimeout(18000);connection.setRequestProperty("apikey",CLOUD_KEY);connection.setRequestProperty("Accept","application/json");
   if(!token.isEmpty())connection.setRequestProperty("Authorization","Bearer "+token);
   if("POST".equals(method)&&!body.isEmpty()){byte[] bytes=body.getBytes(java.nio.charset.StandardCharsets.UTF_8);connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/json");connection.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=connection.getOutputStream()){out.write(bytes);}}
   int status=connection.getResponseCode();InputStream stream=status>=400?connection.getErrorStream():connection.getInputStream();String response="";
   if(stream!=null)try(InputStream in=stream;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>2300000)throw new IOException("Response too large");out.write(buffer,0,n);}response=new String(out.toByteArray(),java.nio.charset.StandardCharsets.UTF_8);}
   respondCloud(id,status,response);
  }catch(Exception e){respondCloud(id,503,"");}finally{if(connection!=null)connection.disconnect();}
 }
 private static final int PICK_EVIDENCE=3701,SAVE_EVIDENCE=3702;
 private String evidenceOwner,evidenceToken,evidenceName,evidenceMime;
 private boolean evidenceBusy=false;
 private boolean validEvidenceAuth(String owner,String token){return owner!=null&&owner.matches("[a-fA-F0-9-]{36}")&&token!=null&&!token.isEmpty()&&token.length()<16000;}
 private boolean validEvidenceName(String name){return name!=null&&name.matches("[a-f0-9-]{36}-[a-zA-Z0-9_.-]{1,100}");}
 private boolean validEvidenceMime(String mime){return "image/jpeg".equals(mime)||"image/png".equals(mime)||"image/webp".equals(mime)||"application/pdf".equals(mime);}
 private void evidenceResult(boolean ok,String message){runOnUiThread(()->{evidenceBusy=false;if(web!=null&&!isDestroyed()&&!isFinishing())web.evaluateJavascript("window.sicorpEvidenceResult&&window.sicorpEvidenceResult("+ok+","+org.json.JSONObject.quote(message)+")",null);});}
 private void chooseEvidence(String owner,String token,String name,String mime){
  runOnUiThread(()->{if(evidenceBusy||!validEvidenceAuth(owner,token))return;try{
   evidenceOwner=owner;evidenceToken=token;evidenceName=name;evidenceMime=mime;evidenceBusy=true;
   Intent intent;
   if(name==null){intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"image/jpeg","image/png","image/webp","application/pdf"});}
   else{if(!validEvidenceName(name))throw new IllegalArgumentException();intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType(validEvidenceMime(mime)?mime:"application/octet-stream").putExtra(Intent.EXTRA_TITLE,name.substring(37));}
   intent.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(intent,name==null?PICK_EVIDENCE:SAVE_EVIDENCE);
  }catch(Exception e){evidenceToken=null;evidenceOwner=null;evidenceName=null;evidenceMime=null;evidenceResult(false,"No se pudo abrir el selector de archivos.");}});
 }
 @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
  super.onActivityResult(requestCode,resultCode,data);
  if(requestCode!=PICK_EVIDENCE&&requestCode!=SAVE_EVIDENCE)return;
  final String owner=evidenceOwner,token=evidenceToken,name=evidenceName,mime=evidenceMime;
  evidenceOwner=null;evidenceToken=null;evidenceName=null;evidenceMime=null;
  if(resultCode!=RESULT_OK||data==null||data.getData()==null){evidenceBusy=false;return;}
  Uri uri=data.getData();
  if(!validEvidenceAuth(owner,token)){evidenceResult(false,"Sesión no disponible.");return;}
  try{cloudExecutor.execute(()->transferEvidence(requestCode,uri,owner,token,name,mime));}catch(java.util.concurrent.RejectedExecutionException e){evidenceResult(false,"Operación cancelada.");}
 }
 private void transferEvidence(int request,Uri uri,String owner,String token,String name,String mime){
  java.net.HttpURLConnection c=null;
  try{
   byte[] bytes=null;
   if(request==PICK_EVIDENCE){
    mime=getContentResolver().getType(uri);if(!validEvidenceMime(mime))throw new IOException("Formato no permitido");
    String filename="evidencia";try(android.database.Cursor cursor=getContentResolver().query(uri,new String[]{android.provider.OpenableColumns.DISPLAY_NAME},null,null,null)){if(cursor!=null&&cursor.moveToFirst())filename=cursor.getString(0);}
    if(filename==null)filename="evidencia";
    filename=filename.replaceAll("[^a-zA-Z0-9_.-]","_");if(filename.length()>100)filename=filename.substring(filename.length()-100);if(filename.isEmpty())filename="evidencia";
    name=java.util.UUID.randomUUID().toString()+"-"+filename;
    try(InputStream in=getContentResolver().openInputStream(uri);ByteArrayOutputStream out=new ByteArrayOutputStream()){if(in==null)throw new IOException();byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1){if(out.size()+n>10485760)throw new IOException("Archivo mayor a 10 MB");out.write(buf,0,n);}bytes=out.toByteArray();}
   }
   if(!validEvidenceName(name))throw new IOException("Nombre inválido");
   String path="/storage/v1/object/"+(request==SAVE_EVIDENCE?"authenticated/":"")+"sicorp-evidence/"+owner+"/"+name;
   c=(java.net.HttpURLConnection)new java.net.URL(CLOUD_URL+path).openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(15000);c.setReadTimeout(45000);c.setRequestProperty("apikey",CLOUD_KEY);c.setRequestProperty("Authorization","Bearer "+token);
   if(request==PICK_EVIDENCE){c.setRequestMethod("POST");c.setDoOutput(true);c.setRequestProperty("Content-Type",mime);c.setRequestProperty("x-upsert","false");c.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=c.getOutputStream()){out.write(bytes);}}
   int code=c.getResponseCode();if(code<200||code>=300)throw new IOException("HTTP "+code);
   if(request==SAVE_EVIDENCE){try(InputStream in=c.getInputStream();OutputStream out=getContentResolver().openOutputStream(uri,"w")){if(out==null)throw new IOException();byte[] buf=new byte[8192];int n,total=0;while((n=in.read(buf))!=-1){total+=n;if(total>10485760)throw new IOException("Archivo demasiado grande");out.write(buf,0,n);}}}
   evidenceResult(true,request==PICK_EVIDENCE?"Evidencia guardada":"Evidencia descargada");
  }catch(Exception e){evidenceResult(false,"No se pudo completar la evidencia. Revisa formato, tamaño y conexión.");}finally{if(c!=null)c.disconnect();}
 }
 public class Bridge {
 @JavascriptInterface public void cloudEvidenceUpload(String owner,String token){chooseEvidence(owner,token,null,null);}
 @JavascriptInterface public void cloudEvidenceDownload(String owner,String token,String name,String mime){chooseEvidence(owner,token,name,mime);}

 @JavascriptInterface public String cloudVaultRead(){return getSharedPreferences("sales",MODE_PRIVATE).getString("account_vault_v3","");}
 @JavascriptInterface public boolean cloudVaultWrite(String value){
  if(value==null||value.length()>100000)return false;
  SharedPreferences.Editor ed=getSharedPreferences("sales",MODE_PRIVATE).edit();
  if(value.isEmpty())ed.remove("account_vault_v3");else ed.putString("account_vault_v3",value);
  return ed.commit();
 }
 @JavascriptInterface public String cloudVaultKey(String secret,String salt){
  if(secret==null||secret.length()>1024||salt==null||salt.length()>100)return "";
  javax.crypto.spec.PBEKeySpec spec=null;
  try{byte[] bytes=android.util.Base64.decode(salt,android.util.Base64.NO_WRAP);if(bytes.length!=16)return "";
   spec=new javax.crypto.spec.PBEKeySpec(secret.toCharArray(),bytes,600000,256);
   byte[] key=javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
   String result=android.util.Base64.encodeToString(key,android.util.Base64.NO_WRAP);java.util.Arrays.fill(key,(byte)0);return result;
  }catch(Exception e){return "";}finally{if(spec!=null)spec.clearPassword();}
 }
 @JavascriptInterface public String cloudVaultCipher(boolean encrypt,String key,String iv,String input){
  if(key==null||iv==null||input==null||key.length()>100||iv.length()>100||input.length()>100000)return "";
  try{byte[] k=android.util.Base64.decode(key,android.util.Base64.NO_WRAP),nonce=android.util.Base64.decode(iv,android.util.Base64.NO_WRAP);
   if(k.length!=32||nonce.length!=12)return "";
   javax.crypto.Cipher cipher=javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
   cipher.init(encrypt?javax.crypto.Cipher.ENCRYPT_MODE:javax.crypto.Cipher.DECRYPT_MODE,new javax.crypto.spec.SecretKeySpec(k,"AES"),new javax.crypto.spec.GCMParameterSpec(128,nonce));java.util.Arrays.fill(k,(byte)0);
   byte[] bytes=encrypt?input.getBytes(java.nio.charset.StandardCharsets.UTF_8):android.util.Base64.decode(input,android.util.Base64.NO_WRAP);
   byte[] result=cipher.doFinal(bytes);
   return encrypt?android.util.Base64.encodeToString(result,android.util.Base64.NO_WRAP):new String(result,java.nio.charset.StandardCharsets.UTF_8);
  }catch(Exception e){return "";}
 }
 @JavascriptInterface public String cloudMeta(){return getSharedPreferences("sales",MODE_PRIVATE).getString("cloud_meta","{}");}
 @JavascriptInterface public boolean cloudSave(String value,String meta){
  if(value==null||meta==null||value.length()>2200000||meta.length()>4600000)return false;
  SharedPreferences sp=getSharedPreferences("sales",MODE_PRIVATE);SharedPreferences.Editor ed=sp.edit();
  if(!sp.contains("legacy_cloud_backup"))ed.putString("legacy_cloud_backup",sp.getString("records","{}"));
  return ed.putString("records",value).putString("cloud_meta",meta).commit();
 }
 @JavascriptInterface public void cloudRequest(String id,String path,String method,String token,String body){
  if(id==null||!id.matches("[0-9]{1,12}")||path==null||method==null||token==null||body==null)return;
  try{cloudExecutor.execute(()->performCloud(id,path,method,token,body));}catch(java.util.concurrent.RejectedExecutionException ignored){}
 }

 @JavascriptInterface public String getAppearance(){return appearance();}
 @JavascriptInterface public void setAppearance(String mode){if(!"light".equals(mode)&&!"dark".equals(mode))return;getSharedPreferences("appearance",MODE_PRIVATE).edit().putString("mode",mode).apply();runOnUiThread(()->applyAppearance());}

 @JavascriptInterface public String installedVersion(){try{return getPackageManager().getPackageInfo(getPackageName(),0).versionName;}catch(android.content.pm.PackageManager.NameNotFoundException e){return "Desconocida";}}
 @JavascriptInterface public void openUpdates(){runOnUiThread(()->updater.open());}

 @JavascriptInterface public String read(){return getSharedPreferences("sales",MODE_PRIVATE).getString("records","{}");}
 @JavascriptInterface public boolean write(String value){return getSharedPreferences("sales",MODE_PRIVATE).edit().putString("records",value).commit();}
 @JavascriptInterface public void copy(String value){runOnUiThread(()->{ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);clipboard.setPrimaryClip(ClipData.newPlainText("Sicorp Ventas",value));});}
 @JavascriptInterface public void share(String value){runOnUiThread(()->{Intent intent=new Intent(Intent.ACTION_SEND);intent.setType("text/plain");intent.putExtra(Intent.EXTRA_TEXT,value);startActivity(Intent.createChooser(intent,"Compartir reporte"));});}
 }
 @Override public void onBackPressed(){web.evaluateJavascript("(function(){var l=document.getElementById('sicorp-cloud-login');if(l&&l.open)return true;var m=document.getElementById('modal');if(m.open){m.close();return true;}if(activePage!=='catalog'){page('catalog');return true;}return false;})()",v->{if(!"true".equals(v))super.onBackPressed();});}
 @Override protected void onResume(){super.onResume();if(updater!=null)updater.resume();}
 @Override protected void onPause(){if(updater!=null)updater.pause();super.onPause();}
 @Override protected void onDestroy(){if(updater!=null)updater.close();cloudExecutor.shutdownNow();web.removeJavascriptInterface("Native");web.destroy();super.onDestroy();}
}
