package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/** Public domain collection of relevant market-evidence subjects; GET never acquires. */
@RestController
public class MarketEvidenceSubjectsController {
    private final MarketEvidenceSubjects subjects;
    private final BearerAuthenticator auth;
    private final ObjectMapper json;
    public MarketEvidenceSubjectsController(MarketEvidenceSubjects subjects,BearerAuthenticator auth,ObjectMapper json){this.subjects=subjects;this.auth=auth;this.json=json;}
    @GetMapping("/v2/market-evidence-subjects")
    public ResponseEntity<String> read(@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception {
        var headers=Collections.list(request.getHeaders("X-Request-Id"));String supplied=headers.size()==1?headers.getFirst().trim():"";
        boolean bad=headers.size()>1||!supplied.isEmpty()&&!HeldQuoteDiscoveryItem.validUuid(supplied);
        String id=!bad&&!supplied.isEmpty()?supplied:UUID.randomUUID().toString();
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication is not configured");
        var user=auth.authenticate(request.getHeader("Authorization"));if(user.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        if(!user.get().hasGrant("quote.acquire"))return problem(ProblemCode.FORBIDDEN,id,"quote acquisition scope required for default-subject discovery");
        if(bad||body!=null&&body.length>0||request.getQueryString()!=null&&!request.getQueryString().isEmpty())return problem(ProblemCode.INVALID_REQUEST,id,"query/body unsupported");
        try {
            String result=json.writeValueAsString(subjects.select(user.get(),id));
            if(result.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>BrokerageArtifacts.MAX_BYTES)return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"selection capacity exceeded");
            return ResponseEntity.ok().header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_JSON).body(result);
        }catch(Exception e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"default-subject evidence unavailable; no holdings-only fallback");}
    }
    private ResponseEntity<String> problem(ProblemCode code,String id,String message)throws Exception {
        var response=ResponseEntity.status(code.status()).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(MediaType.APPLICATION_PROBLEM_JSON);
        if(code==ProblemCode.UNAUTHENTICATED)response.header("WWW-Authenticate","Bearer");
        return response.body(json.writeValueAsString(ProblemDetails.of(code,id,message,code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",message)):null)));
    }
}
