package com.wheelwright.evidence.v2;

import com.wheelwright.evidence.db.DatabaseManager;
import java.nio.file.Files;
import java.util.regex.Pattern;

/** Real backend authorization fixture, independent of mocked evidence storage. */
final class TestAuthentication {
    private TestAuthentication(){}
    static BearerAuthenticator auth(String config) {
        try {
            var path=Files.createTempFile("ww-auth-",".sqlite3");path.toFile().deleteOnExit();
            String url;
            try(var c=DatabaseManager.open(path.toString())) {
                url=c.getMetaData().getURL();
                var ids=Pattern.compile("account(?:\\.[a-z]+)*:(acct_[a-f0-9]{32})").matcher(config);int i=0;
                while(ids.find())try(var q=c.prepareStatement("INSERT OR IGNORE INTO brokerage_account VALUES (?,?,?,?,?)")) {
                    String id=ids.group(1);q.setString(1,id);q.setString(2,"fixture-"+(i++));q.setString(3,"Test account");q.setString(4,"TEST"+i);q.setString(5,id);q.executeUpdate();
                }
            }
            return new BearerAuthenticator(new UserDirectory(url),config);
        }catch(Exception e){throw new IllegalStateException("authorization fixture failed",e);}
    }
}
