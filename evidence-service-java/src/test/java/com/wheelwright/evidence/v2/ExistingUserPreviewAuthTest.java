package com.wheelwright.evidence.v2;
import com.wheelwright.evidence.db.SqliteEvidenceStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import java.util.Set;
import static org.assertj.core.api.Assertions.*;
class ExistingUserPreviewAuthTest {
 @TempDir Path temp;
 @Test void existingIdentityBindingIsReadOnlyAndRevocationStaysLive()throws Exception {
  Path path=temp.resolve("source.db");
  try(var store=new SqliteEvidenceStore(path.toString())) {
   var accounts=new AccountDirectory(store,"");var users=new UserDirectory(store,accounts);
   String id=users.bootstrap("existing-user",Set.of("quote.read"));
   var liveReadOnly=new UserDirectory("jdbc:sqlite:file:"+path+"?mode=ro");
   var auth=BearerAuthenticator.existingUser(liveReadOnly,"local-preview-token",id);
   assertThat(auth.authenticate("Bearer local-preview-token").orElseThrow().hasGrant("quote.read")).isTrue();
   assertThat(auth.authenticate("Bearer wrong")).isEmpty();
   assertThatThrownBy(()->BearerAuthenticator.existingUser(liveReadOnly,"token","usr_"+"a".repeat(32))).isInstanceOf(IllegalArgumentException.class);
   users.bootstrap(id,Set.of());
   assertThat(auth.authenticate("Bearer local-preview-token").orElseThrow().hasGrant("quote.read")).isFalse();
  }
 }
}
