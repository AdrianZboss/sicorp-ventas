package ec.sicorpmattress.ventas;
import android.content.*;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.*;

public final class UpdateProvider extends ContentProvider {
    @Override public boolean onCreate(){return true;}
    private File file(Uri uri){
        if(!("/sicorp-update.apk".equals(uri.getPath())))throw new IllegalArgumentException("URI incorrecta");
        return new File(getContext().getCacheDir(),"sicorp-update.apk");
    }
    @Override public String getType(Uri uri){file(uri);return "application/vnd.android.package-archive";}
    @Override public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{
        if(!"r".equals(mode))throw new FileNotFoundException("Solo lectura");
        return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.MODE_READ_ONLY);
    }
    @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){
        File f=file(uri);
        String[] cols=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;
        MatrixCursor c=new MatrixCursor(cols);Object[] values=new Object[cols.length];
        for(int i=0;i<cols.length;i++){
            if(OpenableColumns.DISPLAY_NAME.equals(cols[i]))values[i]="Sicorp_Ventas.apk";
            else if(OpenableColumns.SIZE.equals(cols[i]))values[i]=f.length();
        }
        c.addRow(values);return c;
    }
    @Override public Uri insert(Uri uri,ContentValues v){throw new UnsupportedOperationException();}
    @Override public int delete(Uri uri,String s,String[] args){throw new UnsupportedOperationException();}
    @Override public int update(Uri uri,ContentValues v,String s,String[] args){throw new UnsupportedOperationException();}
}
