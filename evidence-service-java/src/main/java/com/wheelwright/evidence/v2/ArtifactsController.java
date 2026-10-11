package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/v2/artifacts")
public class ArtifactsController {
    private final BrokerageArtifacts artifacts;
    private final BearerAuthenticator auth;
    private final ObjectMapper mapper;
    public ArtifactsController(BrokerageArtifacts artifacts, BearerAuthenticator auth, ObjectMapper mapper) {
        this.artifacts = artifacts; this.auth = auth; this.mapper = mapper;
    }
    @FunctionalInterface private interface Work { Object run(String id, String account) throws Exception; }
    private static final class SourceForbidden extends RuntimeException {}
    private ResponseEntity<?> handle(String account, String artifact, String grant, HttpServletRequest request, Work work) throws Exception {
        var ids = Collections.list(request.getHeaders("X-Request-Id"));
        String supplied = ids.size() == 1 ? ids.getFirst().trim() : "";
        boolean bad = ids.size() > 1 || !supplied.isEmpty() && !HeldQuoteDiscoveryItem.validUuid(supplied);
        String id = !bad && !supplied.isEmpty() ? supplied : UUID.randomUUID().toString();
        if (!auth.configured()) return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "authentication is not configured");
        var principal = auth.authenticate(request.getHeader("Authorization"));
        if (principal.isEmpty()) return problem(ProblemCode.UNAUTHENTICATED, id, "missing or invalid Bearer credential");
        if (bad || account != null && !AccountDirectory.validId(account) || !Collections.list(request.getParameterNames()).stream().allMatch("accountId"::equals) || request.getParameterValues("accountId") != null && request.getParameterValues("accountId").length != 1)
            return problem(ProblemCode.INVALID_REQUEST, id, "invalid account, query or correlation");
        try {
            if (artifact != null) {
                if (account != null) throw new IllegalArgumentException("item query unsupported");
                account = artifacts.owner(artifact).orElse(null);
                if (account == null) return problem(ProblemCode.NOT_FOUND,id,"artifact not found");
            }
            if (account != null && !principal.get().hasGrant("account.artifacts."+grant+":"+account))
                return problem(ProblemCode.FORBIDDEN,id,"caller lacks account-scoped artifact authority");
            if (account != null && artifacts.brokerAccount(account) == null) return problem(ProblemCode.NOT_FOUND, id, "backend account binding not configured");
            Object value = work.run(id,account);
            if (value == null) return problem(ProblemCode.NOT_FOUND, id, "artifact not found in this account");
            if (value instanceof byte[] bytes) return ResponseEntity.ok().header("X-Request-Id", id)
                    .header("Cache-Control", "private, no-store").header("Content-Disposition", "attachment")
                    .contentType(MediaType.parseMediaType("text/csv")).body(bytes);
            return ResponseEntity.ok().header("X-Request-Id", id).header("Cache-Control", "private, no-store")
                    .contentType(MediaType.APPLICATION_JSON).body(mapper.writeValueAsString(value));
        } catch (SourceForbidden e) { return problem(ProblemCode.FORBIDDEN, id, "caller lacks authority for every account in original source"); }
        catch (IllegalArgumentException e) { return problem(ProblemCode.INVALID_REQUEST, id, "invalid artifact input"); }
        catch (java.sql.SQLException e) { return problem(ProblemCode.CAPABILITY_UNAVAILABLE, id, "artifact storage unavailable"); }
        catch (NoSuchElementException e) { return problem(ProblemCode.NOT_FOUND, id, "artifact not found in this account"); }
        catch (Exception e) { return problem(ProblemCode.INTERNAL_ERROR, id, "artifact operation failed; inspect retained import status before retrying"); }
    }
    private ResponseEntity<String> problem(ProblemCode code, String id, String detail) throws Exception {
        var body = mapper.writeValueAsString(ProblemDetails.of(code, id, detail,
                code == ProblemCode.INVALID_REQUEST ? List.of(new ProblemDetails.InvalidParam("request", detail)) : null));
        var builder = ResponseEntity.status(code.status()).header("X-Request-Id", id)
                .header("Cache-Control", "private, no-store").contentType(MediaType.APPLICATION_PROBLEM_JSON);
        if (code == ProblemCode.UNAUTHENTICATED) builder.header("WWW-Authenticate", "Bearer");
        return builder.body(body);
    }
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required=false) String accountId, @RequestBody(required=false) byte[] body, HttpServletRequest request) throws Exception {
        return handle(accountId,null,"read",request,(id,account)-> {
            noBody(body);
            if(account!=null)return artifacts.inventory(account,id);
            var caller=auth.authenticate(request.getHeader("Authorization")).orElseThrow();
            var visible=new ArrayList<BrokerageArtifacts.Metadata>();
            for(var a:artifacts.accounts().list())if(caller.hasGrant("account.artifacts.read:"+a.id()))visible.addAll(artifacts.inventory(a.id(),id).artifacts());
            return new BrokerageArtifacts.Inventory(id,null,null,"UNKNOWN",List.copyOf(visible));
        });
    }
    @GetMapping("/{artifact}")
    public ResponseEntity<?> detail(@PathVariable String artifact, @RequestBody(required=false) byte[] body, HttpServletRequest request) throws Exception {
        return handle(null,artifact,"read",request,(id,account)-> { noQuery(request);noBody(body);return artifacts.metadata(account,artifact).orElse(null); });
    }
    @GetMapping("/{artifact}/content")
    public ResponseEntity<?> content(@PathVariable String artifact, @RequestBody(required=false) byte[] body, HttpServletRequest request) throws Exception {
        return handle(null,artifact,"read",request,(id,account)-> {
            noQuery(request);noBody(body);
            var metadata=artifacts.metadata(account,artifact).orElseThrow();
            var bytes=artifacts.content(account,artifact).orElseThrow();
            sourceAuthority(account,metadata.imports().getFirst().originalFilename(),bytes,"read",request);
            return bytes;
        });
    }
    @PostMapping
    public ResponseEntity<?> upload(@RequestParam(required=false) String accountId,
            @RequestHeader(value="Content-Disposition", required=false) String disposition,
            @RequestHeader(value="X-Brokerage-File-Type", required=false) String type,
            @RequestBody(required=false) byte[] body, HttpServletRequest request) throws Exception {
        return handle(accountId,null,"write",request,(id,account)-> {
            if(account==null||body==null||type==null||disposition==null||request.getContentType()==null||
                    !MediaType.parseMediaType(request.getContentType()).isCompatibleWith(MediaType.parseMediaType("text/csv")))
                throw new IllegalArgumentException("canonical accountId, CSV body, disposition and type required");
            String filename=ContentDisposition.parse(disposition).getFilename();
            if(filename==null)throw new IllegalArgumentException("filename required");
            // Target-account write authority permits retention and scoped processing.
            // Retrieving the complete original still requires every source-account read grant.
            return artifacts.ingest(account,filename,type,body,id);
        });
    }
    @PostMapping("/{artifact}/imports")
    public ResponseEntity<?> retry(@PathVariable String artifact, @RequestBody(required=false) byte[] body, HttpServletRequest request) throws Exception {
        return handle(null,artifact,"write",request,(id,account)-> {
            noQuery(request);noBody(body);
            return artifacts.retry(account,artifact,null,null,id);
        });
    }
    private static void noQuery(HttpServletRequest request) { if(request.getQueryString()!=null&&!request.getQueryString().isEmpty())throw new IllegalArgumentException("item query unsupported"); }
    private static void noBody(byte[] body) { if (body != null && body.length > 0) throw new IllegalArgumentException("body unsupported"); }
    private void sourceAuthority(String owner, String filename, byte[] bytes, String grant, HttpServletRequest request) throws Exception {
        var principal = auth.authenticate(request.getHeader("Authorization")).orElseThrow();
        var source = artifacts.sourceScopes(owner, filename, bytes);
        if (!source.established()) throw new SourceForbidden();
        for (String scope : source.accountIds())
            if (!principal.hasGrant("account.artifacts." + grant + ":" + scope)) throw new SourceForbidden();
    }
}
