package ec.sicorpmattress.ventas;
import android.app.Activity;import android.os.Bundle;import android.content.*;import android.webkit.*;import android.net.Uri;import java.io.*;import java.util.*;
public class MainActivity extends Activity {
 private WebView web; private static final String PAGE="file:///android_asset/index.html";
 @Override public void onCreate(Bundle state){super.onCreate(state);web=new WebView(this);setContentView(web);WebSettings s=web.getSettings();s.setUseWideViewPort(true);s.setLoadWithOverviewMode(false);s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setBlockNetworkLoads(true);web.addJavascriptInterface(new Bridge(),"Native");web.setWebChromeClient(new WebChromeClient());web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !PAGE.equals(r.getUrl().toString());}@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){if(PAGE.equals(r.getUrl().toString()))try{return new WebResourceResponse("text/html","UTF-8",getAssets().open("index.html"));}catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}if("data".equals(r.getUrl().getScheme()))return null;return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}});web.loadUrl(PAGE);}
 public class Bridge {
 @JavascriptInterface public String read(){return getSharedPreferences("sales",MODE_PRIVATE).getString("records","{}");}
 @JavascriptInterface public boolean write(String value){return getSharedPreferences("sales",MODE_PRIVATE).edit().putString("records",value).commit();}
 @JavascriptInterface public void copy(String value){runOnUiThread(()->{ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);clipboard.setPrimaryClip(ClipData.newPlainText("Sicorp Ventas",value));});}
 @JavascriptInterface public void share(String value){runOnUiThread(()->{Intent intent=new Intent(Intent.ACTION_SEND);intent.setType("text/plain");intent.putExtra(Intent.EXTRA_TEXT,value);startActivity(Intent.createChooser(intent,"Compartir reporte"));});}
 }
 @Override public void onBackPressed(){web.evaluateJavascript("(function(){var m=document.getElementById('modal');if(m.open){m.close();return true;}if(activePage!=='catalog'){page('catalog');return true;}return false;})()",v->{if(!"true".equals(v))super.onBackPressed();});}
 @Override protected void onDestroy(){web.removeJavascriptInterface("Native");web.destroy();super.onDestroy();}
}
