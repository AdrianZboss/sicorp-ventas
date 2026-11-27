package ec.sicorpmattress.ventas;
import android.app.Activity;import android.os.Bundle;import android.content.*;import android.webkit.*;import android.net.Uri;import java.io.*;import java.util.*;
public class MainActivity extends Activity {
 private WebView web; private UpdateManager updater; private static final String PAGE="file:///android_asset/index.html";
 @Override public void onCreate(Bundle state){super.onCreate(state);applyAppearance();updater=new UpdateManager(this);web=new WebView(this);web.setBackgroundColor(appearance().equals("light")?0xfff5f6f8:0xff101418);setContentView(web);WebSettings s=web.getSettings();s.setUseWideViewPort(true);s.setLoadWithOverviewMode(false);s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setBlockNetworkLoads(true);web.addJavascriptInterface(new Bridge(),"Native");web.setWebChromeClient(new WebChromeClient());web.setWebViewClient(new WebViewClient(){@Override public void onPageFinished(WebView v,String url){if(!PAGE.equals(url))return;loadTheme(v);try(BufferedReader reader=new BufferedReader(new InputStreamReader(getAssets().open("simple-ui.js"),java.nio.charset.StandardCharsets.UTF_8))){StringBuilder script=new StringBuilder();String line;while((line=reader.readLine())!=null)script.append(line).append('\n');v.evaluateJavascript(script.toString(),null);}catch(IOException e){android.util.Log.e("SicorpVentas","No se pudo cargar interfaz simplificada",e);}v.evaluateJavascript("(function(){if(document.getElementById('sicorpUpdates'))return;var h=document.getElementById('history');var c=document.createElement('div');c.id='sicorpUpdates';c.className='card';var b=document.createElement('button');b.type='button';b.className='full primary';b.textContent='Actualizar app · '+Native.installedVersion();b.onclick=function(){Native.openUpdates();};c.appendChild(b);if(h)h.appendChild(c);else {c.style.cssText='position:fixed;right:12px;bottom:90px;z-index:99;padding:4px';document.body.appendChild(c);}})()",null);}@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !PAGE.equals(r.getUrl().toString());}@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){if(PAGE.equals(r.getUrl().toString()))try{return new WebResourceResponse("text/html","UTF-8",getAssets().open("index.html"));}catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}if("data".equals(r.getUrl().getScheme()))return null;return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}});web.loadUrl(PAGE);}

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
 public class Bridge {
 @JavascriptInterface public String getAppearance(){return appearance();}
 @JavascriptInterface public void setAppearance(String mode){if(!"light".equals(mode)&&!"dark".equals(mode))return;getSharedPreferences("appearance",MODE_PRIVATE).edit().putString("mode",mode).apply();runOnUiThread(()->applyAppearance());}

 @JavascriptInterface public String installedVersion(){try{return getPackageManager().getPackageInfo(getPackageName(),0).versionName;}catch(android.content.pm.PackageManager.NameNotFoundException e){return "Desconocida";}}
 @JavascriptInterface public void openUpdates(){runOnUiThread(()->updater.open());}

 @JavascriptInterface public String read(){return getSharedPreferences("sales",MODE_PRIVATE).getString("records","{}");}
 @JavascriptInterface public boolean write(String value){return getSharedPreferences("sales",MODE_PRIVATE).edit().putString("records",value).commit();}
 @JavascriptInterface public void copy(String value){runOnUiThread(()->{ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);clipboard.setPrimaryClip(ClipData.newPlainText("Sicorp Ventas",value));});}
 @JavascriptInterface public void share(String value){runOnUiThread(()->{Intent intent=new Intent(Intent.ACTION_SEND);intent.setType("text/plain");intent.putExtra(Intent.EXTRA_TEXT,value);startActivity(Intent.createChooser(intent,"Compartir reporte"));});}
 }
 @Override public void onBackPressed(){web.evaluateJavascript("(function(){var m=document.getElementById('modal');if(m.open){m.close();return true;}if(activePage!=='catalog'){page('catalog');return true;}return false;})()",v->{if(!"true".equals(v))super.onBackPressed();});}
 @Override protected void onResume(){super.onResume();if(updater!=null)updater.resume();}
 @Override protected void onPause(){if(updater!=null)updater.pause();super.onPause();}
 @Override protected void onDestroy(){if(updater!=null)updater.close();web.removeJavascriptInterface("Native");web.destroy();super.onDestroy();}
}
