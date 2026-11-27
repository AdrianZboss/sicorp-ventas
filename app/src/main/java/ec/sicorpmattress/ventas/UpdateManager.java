package ec.sicorpmattress.ventas;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.net.Uri;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.*;
import android.provider.Settings;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;

final class UpdateManager {
    private static final String CLIENT="Iv23li72XwoC9bqglj7e";
    private static final String API="https://api.github.com/repos/AdrianZboss/sicorp-ventas";
    private static final String OAUTH="https://github.com/login/oauth/access_token";
    private static final String CERT="f078c96b8c4cac3dbca6e589c9dba3beb04871959b957ded06830e69430e655c";
    private static final String ALIAS="sicorp-updater-token-v1";
    private static final long LIMIT=100L*1024*1024;
    private final Activity a;
    private final SharedPreferences prefs;
    private volatile boolean busy=false, cancelled=false, closed=false;
    private boolean pendingPermission=false;
    private volatile ProgressDialog progress;
    private volatile AlertDialog authorization;

    UpdateManager(Activity activity){
        a=activity;
        prefs=a.getSharedPreferences("private_updater",Context.MODE_PRIVATE);
        try {
            if(prefs.getInt("download_code",0)<=installedCode()) cleanup();
        } catch(Exception ignored){}
    }
    private int dialogTheme(){
        boolean light="light".equals(a.getSharedPreferences("appearance",Context.MODE_PRIVATE).getString("mode","dark"));
        return light?android.R.style.Theme_Material_Light_Dialog_Alert:android.R.style.Theme_Material_Dialog_Alert;
    }
    private File apk(){return new File(a.getCacheDir(),"sicorp-update.apk");}
    private File partial(){return new File(a.getCacheDir(),"sicorp-update.part.apk");}
    private void cleanup(){apk().delete();partial().delete();prefs.edit().remove("download_code").apply();}
    private void ui(Runnable r){a.runOnUiThread(()->{if(!closed&&!a.isFinishing()&&!a.isDestroyed())r.run();});}
    private int installedCode() throws Exception {return a.getPackageManager().getPackageInfo(a.getPackageName(),0).versionCode;}
    private String installedName() throws Exception {return a.getPackageManager().getPackageInfo(a.getPackageName(),0).versionName;}
    private void message(String title,String body){ui(()->new AlertDialog.Builder(a,dialogTheme()).setTitle(title).setMessage(body).setPositiveButton("Aceptar",null).show());}
    private void start(Runnable r){
        if(busy||closed)return;
        busy=true;cancelled=false;
        new Thread(()->{try{r.run();}finally{busy=false;}},"sicorp-updater").start();
    }
    void close(){closed=true;cancelled=true;if(progress!=null)progress.dismiss();if(authorization!=null)authorization.dismiss();}
    void resume(){
        if(!pendingPermission)return;
        pendingPermission=false;
        if(a.getPackageManager().canRequestPackageInstalls())offerInstall();
        else message("Permiso pendiente","Puedes volver a pulsar Actualizar app para intentarlo de nuevo.");
    }
    void open(){
        if(busy)return;
        new AlertDialog.Builder(a,dialogTheme()).setTitle("Actualizaciones")
            .setMessage("Busca una nueva versión. Solo tendrás que autorizar GitHub la primera vez o cuando caduque tu sesión.")
            .setPositiveButton("Buscar", (d,w)->start(this::check))
            .setNeutralButton("Cerrar sesión",(d,w)->{prefs.edit().remove("token").commit();cleanup();message("Sesión cerrada","Podrás autorizar GitHub nuevamente al buscar actualizaciones.");})
            .setNegativeButton("Cancelar",null).show();
    }
    private javax.crypto.SecretKey secretKey() throws Exception {
        KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);
        if(ks.containsAlias(ALIAS))return (javax.crypto.SecretKey)ks.getKey(ALIAS,null);
        KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
        gen.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
          .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());
        return gen.generateKey();
    }
    private JSONObject loadToken(){
        try{
            String value=prefs.getString("token",null);if(value==null)return null;
            String[] parts=value.split(":");Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE,secretKey(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));
            return new JSONObject(new String(cipher.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8));
        }catch(Exception e){prefs.edit().remove("token").commit();return null;}
    }
    private void saveToken(JSONObject obj) throws Exception {
        obj.put("expires_at",System.currentTimeMillis()+1000L*obj.optLong("expires_in",31536000));
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,secretKey());
        String value=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(cipher.doFinal(obj.toString().getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);
        if(!prefs.edit().putString("token",value).commit())throw new IOException("No se pudo guardar la sesión.");
    }
    private static String enc(String s)throws Exception{return URLEncoder.encode(s,"UTF-8");}
    private boolean hasNetwork(){
        ConnectivityManager cm=(ConnectivityManager)a.getSystemService(Context.CONNECTIVITY_SERVICE);
        if(cm==null)return true;
        Network network=cm.getActiveNetwork();
        NetworkCapabilities caps=network==null?null:cm.getNetworkCapabilities(network);
        return caps!=null&&caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }
    private boolean networkFailure(Throwable e){
        for(Throwable t=e;t!=null;t=t.getCause()){
            if(t instanceof UnknownHostException||t instanceof SocketTimeoutException||t instanceof ConnectException||t instanceof NoRouteToHostException)return true;
            if(t.getCause()==t)break;
        }
        return false;
    }
    private void connectionError(Exception e,boolean checking){
        String body=!hasNetwork()?"No hay una conexión a Internet activa. Activa Wi-Fi o datos móviles.": "No se pudo conectar con GitHub. Prueba con datos móviles u otra red Wi-Fi. Si usas DNS privado o VPN, revisa su configuración y vuelve a buscar.";
        ui(()->{
            AlertDialog.Builder d=new AlertDialog.Builder(a,dialogTheme()).setTitle("Conexión no disponible").setMessage(body)
              .setNeutralButton("Ajustes de red",(dialog,w)->{try{a.startActivity(new Intent(Settings.ACTION_WIRELESS_SETTINGS));}catch(Exception ignored){}})
              .setNegativeButton("Cerrar",null);
            if(checking)d.setPositiveButton("Reintentar",(dialog,w)->start(this::check));
            else d.setPositiveButton("Buscar de nuevo",(dialog,w)->start(this::check));
            d.show();
        });
    }
    private void resolveHost(URL url)throws Exception {
        UnknownHostException last=null;
        for(int attempt=0;attempt<3;attempt++){
            if(cancelled||closed)throw new IOException("Operación cancelada.");
            try{InetAddress.getAllByName(url.getHost());return;}
            catch(UnknownHostException e){last=e;if(attempt<2)Thread.sleep(1200L*(attempt+1));}
        }
        throw last;
    }
    private HttpURLConnection connection(String address,String token,String accept)throws Exception {
        URL url=new URL(address);
        if(!"https".equals(url.getProtocol()))throw new IOException("Conexión no segura.");
        resolveHost(url);
        HttpURLConnection c=(HttpURLConnection)url.openConnection();
        c.setConnectTimeout(15000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(false);
        c.setRequestProperty("Accept",accept);c.setRequestProperty("User-Agent","SicorpVentasUpdater");
        if("api.github.com".equals(url.getHost())){
            c.setRequestProperty("X-GitHub-Api-Version","2022-11-28");
            if(token!=null)c.setRequestProperty("Authorization","Bearer "+token);
        }
        return c;
    }
    private static String read(InputStream stream)throws Exception {
        try(InputStream in=stream;ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1){if(out.size()+n>2*1024*1024)throw new IOException("Respuesta demasiado grande.");out.write(buf,0,n);}
            return new String(out.toByteArray(),StandardCharsets.UTF_8);
        }
    }
    private JSONObject post(String url,String body)throws Exception {
        HttpURLConnection c=connection(url,null,"application/json");
        try{
            c.setRequestMethod("POST");c.setDoOutput(true);c.setRequestProperty("Content-Type","application/x-www-form-urlencoded");
            try(OutputStream out=c.getOutputStream()){out.write(body.getBytes(StandardCharsets.UTF_8));}
            int status=c.getResponseCode();InputStream in=status<400?c.getInputStream():c.getErrorStream();
            if(in==null)throw new IOException("GitHub no respondió correctamente.");
            return new JSONObject(read(in));
        }finally{c.disconnect();}
    }
    private JSONObject authorize()throws Exception {
        JSONObject code=post("https://github.com/login/device/code","client_id="+enc(CLIENT));
        if(!code.has("device_code"))throw new IOException("No se pudo iniciar la autorización. Comprueba que Device Flow esté activado.");
        String userCode=code.getString("user_code"), deviceCode=code.getString("device_code");
        int interval=Math.max(5,code.optInt("interval",5));
        long end=SystemClock.elapsedRealtime()+1000L*code.optLong("expires_in",900);
        ui(()->{
            if(progress!=null)progress.dismiss();
            authorization=new AlertDialog.Builder(a,dialogTheme()).setTitle("Autorizar GitHub")
              .setMessage("Código: "+userCode+"\n\nAbre GitHub, pega este código y autoriza Sicorp Ventas Updater. Después vuelve a Sicorp Ventas.")
              .setPositiveButton("Copiar y abrir GitHub",null)
              .setNegativeButton("Cancelar",(d,w)->cancelled=true)
              .setOnCancelListener(d->cancelled=true).create();
            authorization.show();
            authorization.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
                ((android.content.ClipboardManager)a.getSystemService(Context.CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("Código GitHub",userCode));
                try{a.startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://github.com/login/device")));}catch(Exception e){message("GitHub","Abre https://github.com/login/device en tu navegador.");}
            });
        });
        try{
            while(!cancelled&&!closed&&SystemClock.elapsedRealtime()<end){
                Thread.sleep(interval*1000L);if(cancelled||closed)return null;
                JSONObject result;
                try{
                    result=post(OAUTH,"client_id="+enc(CLIENT)+"&device_code="+enc(deviceCode)+"&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code");
                }catch(Exception e){
                    if(!networkFailure(e))throw e;
                    interval=Math.min(60,Math.max(5,interval*2));
                    ui(()->{if(authorization!=null)authorization.setMessage("Código: "+userCode+"\n\nSi ya autorizaste GitHub, no necesitas hacerlo otra vez. Estamos recuperando la conexión automáticamente. Mantén abierta Sicorp Ventas.");});
                    continue;
                }
                if(result.has("access_token")){saveToken(result);return result;}
                String error=result.optString("error");
                if("slow_down".equals(error)){interval+=5;continue;}
                if(!"authorization_pending".equals(error))throw new IOException("Autorización no completada. Vuelve a intentarlo.");
            }
            if(cancelled||closed)return null;
            throw new IOException("El código de autorización caducó.");
        }finally{ui(()->{if(authorization!=null){authorization.dismiss();authorization=null;}});}
    }
    private JSONObject token(boolean forceRefresh)throws Exception {
        JSONObject t=loadToken();
        if(t!=null&&!forceRefresh&&t.optLong("expires_at")>System.currentTimeMillis()+60000)return t;
        if(t!=null&&!t.optString("refresh_token").isEmpty()){
            JSONObject fresh=post(OAUTH,"client_id="+enc(CLIENT)+"&grant_type=refresh_token&refresh_token="+enc(t.getString("refresh_token")));
            if(fresh.has("access_token")){
                if(!fresh.has("refresh_token"))fresh.put("refresh_token",t.getString("refresh_token"));
                saveToken(fresh);return fresh;
            }
        }
        prefs.edit().remove("token").commit();return authorize();
    }
    private JSONObject latest(String token)throws Exception {
        HttpURLConnection c=connection(API+"/releases/latest",token,"application/vnd.github+json");
        try{
            int status=c.getResponseCode();
            if(status==401)return null;
            if(status==404||status==403)throw new IOException("GitHub no permite acceder a las versiones. Instala Sicorp Ventas Updater en el repositorio sicorp-ventas con Contents: Read-only y vuelve a autorizar.");
            if(status!=200)throw new IOException("GitHub respondió con el estado "+status+".");
            return new JSONObject(read(c.getInputStream()));
        }finally{c.disconnect();}
    }
    private static int compare(String x,String y)throws Exception {
        String[] a=x.split("\\."),b=y.split("\\.");
        for(int i=0;i<Math.max(a.length,b.length);i++){
            int v=i<a.length?Integer.parseInt(a[i]):0,w=i<b.length?Integer.parseInt(b[i]):0;
            if(v!=w)return Integer.compare(v,w);
        }return 0;
    }
    private void showProgress(String title,String body,boolean horizontal){
        ui(()->{if(progress!=null)progress.dismiss();progress=new ProgressDialog(a,dialogTheme());progress.setTitle(title);progress.setMessage(body);progress.setProgressStyle(horizontal?ProgressDialog.STYLE_HORIZONTAL:ProgressDialog.STYLE_SPINNER);progress.setMax(100);progress.setCancelable(false);progress.show();});
    }
    private void hideProgress(){ui(()->{if(progress!=null){progress.dismiss();progress=null;}});}
    private void check(){
        try{
            if(apk().isFile()&&prefs.getInt("download_code",0)>installedCode()){validate(apk(),null);ui(this::offerInstall);return;}
            cleanup();showProgress("Actualizaciones","Consultando GitHub…",false);
            if(!hasNetwork())throw new UnknownHostException("No hay red activa.");
            JSONObject t=token(false);if(t==null)return;
            JSONObject release=latest(t.getString("access_token"));
            if(release==null){t=token(true);if(t==null)return;release=latest(t.getString("access_token"));}
            if(release==null)throw new IOException("La autorización no es válida. Cierra sesión y vuelve a autorizar.");
            String tag=release.getString("tag_name");
            if(!tag.matches("v[0-9]+(\\.[0-9]+){1,2}"))throw new IOException("Versión no reconocida.");
            String version=tag.substring(1);
            if(compare(version,installedName())<=0){message("Estás al día","Sicorp Ventas "+installedName()+" es la última versión disponible.");return;}
            JSONArray assets=release.getJSONArray("assets");JSONObject asset=null;
            for(int i=0;i<assets.length();i++){JSONObject x=assets.getJSONObject(i);if("Sicorp_Ventas.apk".equals(x.optString("name")))asset=x;}
            if(asset==null)throw new IOException("La nueva versión todavía no tiene una APK publicada.");
            long id=asset.getLong("id"),size=asset.getLong("size");
            String digest=asset.optString("digest","");
            if(size<=0||size>LIMIT)throw new IOException("Tamaño de actualización no válido.");
            final String access=t.getString("access_token");
            hideProgress();ui(()->new AlertDialog.Builder(a,dialogTheme()).setTitle("Nueva versión "+version).setMessage("Tamaño: "+String.format(java.util.Locale.US,"%.1f",size/1048576.0)+" MB\nLa descarga se guardará de forma temporal dentro de Sicorp Ventas.")
              .setPositiveButton("Descargar e instalar",(d,w)->start(()->download(id,size,digest,access,version))).setNegativeButton("Después",null).show());
        }catch(Exception e){if(networkFailure(e))connectionError(e,true);else message("No se pudo actualizar",safe(e));}finally{hideProgress();}
    }
    private String safe(Exception e){return e instanceof IOException&&e.getMessage()!=null&&!e.getMessage().contains("http")?e.getMessage():"Comprueba tu conexión e inténtalo de nuevo.";}
    private static String hex(byte[] bytes){StringBuilder b=new StringBuilder();for(byte x:bytes)b.append(String.format(java.util.Locale.US,"%02x",x&255));return b.toString();}
    private void download(long id,long size,String digest,String token,String version){
        HttpURLConnection c=null;
        try{
            showProgress("Descargando "+version,"Preparando actualización…",true);
            String url=API+"/releases/assets/"+id;
            c=connection(url,token,"application/octet-stream");
            for(int i=0;i<5;i++){
                int status=c.getResponseCode();
                if(status==200)break;
                if(status!=301&&status!=302&&status!=303&&status!=307&&status!=308)throw new IOException("No se pudo descargar la actualización (HTTP "+status+").");
                String next=c.getHeaderField("Location");if(next==null)throw new IOException("Redirección no válida.");
                URL target=new URL(new URL(url),next);String host=target.getHost();
                if(!"https".equals(target.getProtocol())||!(host.equals("api.github.com")||host.equals("github.com")||host.endsWith(".githubusercontent.com")))throw new IOException("Servidor de descarga no autorizado.");
                c.disconnect();url=target.toString();c=connection(url,null,"application/octet-stream");
            }
            if(c.getResponseCode()!=200)throw new IOException("No se pudo descargar la actualización.");
            MessageDigest hash=MessageDigest.getInstance("SHA-256");long total=0;int last=-1;
            try(InputStream in=c.getInputStream();FileOutputStream out=new FileOutputStream(partial())){
                byte[] buf=new byte[32768];int n;
                while((n=in.read(buf))!=-1){
                    if(closed)throw new IOException("Descarga interrumpida.");
                    total+=n;if(total>size||total>LIMIT)throw new IOException("Tamaño incorrecto.");
                    out.write(buf,0,n);hash.update(buf,0,n);
                    int p=(int)(total*100/size);if(p!=last){last=p;ui(()->{if(progress!=null)progress.setProgress(p);});}
                }out.getFD().sync();
            }
            if(total!=size)throw new IOException("Descarga incompleta.");
            if(digest.startsWith("sha256:")&&!digest.equalsIgnoreCase("sha256:"+hex(hash.digest())))throw new IOException("La verificación SHA-256 falló.");
            int code=validate(partial(),version);
            if(apk().exists()&&!apk().delete())throw new IOException("No se pudo limpiar la descarga anterior.");
            if(!partial().renameTo(apk()))throw new IOException("No se pudo guardar la actualización.");
            prefs.edit().putInt("download_code",code).commit();
            hideProgress();ui(this::offerInstall);
        }catch(Exception e){cleanup();if(networkFailure(e))connectionError(e,false);else message("Descarga no completada",safe(e));}
        finally{if(c!=null)c.disconnect();hideProgress();}
    }
    private int validate(File file,String version)throws Exception {
        int flag=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
        PackageInfo p=a.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(),flag);
        if(p==null||!a.getPackageName().equals(p.packageName)||p.versionCode<=installedCode()||(version!=null&&!version.equals(p.versionName)))throw new IOException("La APK no corresponde a una versión más reciente de Sicorp Ventas.");
        android.content.pm.Signature[] sig=Build.VERSION.SDK_INT>=28?p.signingInfo.getApkContentsSigners():p.signatures;
        if(sig==null||sig.length!=1||!CERT.equals(hex(MessageDigest.getInstance("SHA-256").digest(sig[0].toByteArray()))))throw new IOException("Firma digital incorrecta. Instalación bloqueada.");
        return p.versionCode;
    }
    private void offerInstall(){
        if(closed)return;
        try{
            validate(apk(),null);
            if(!a.getPackageManager().canRequestPackageInstalls()){
                new AlertDialog.Builder(a,dialogTheme()).setTitle("Permitir actualizaciones").setMessage("Android requiere que autorices a Sicorp Ventas a instalar sus propias actualizaciones. Activa el permiso y vuelve a la aplicación.")
                  .setPositiveButton("Abrir ajustes",(d,w)->{try{pendingPermission=true;a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+a.getPackageName())));}catch(Exception e){pendingPermission=false;message("Permiso","No se pudo abrir la configuración.");}}).setNegativeButton("Después",null).show();return;
            }
            Uri uri=Uri.parse("content://"+a.getPackageName()+".updates/sicorp-update.apk");
            Intent intent=new Intent(Intent.ACTION_INSTALL_PACKAGE);intent.setData(uri);intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);intent.setClipData(ClipData.newRawUri("Actualización",uri));
            a.startActivity(intent);
        }catch(Exception e){message("Instalación pendiente",safe(e));}
    }
}
