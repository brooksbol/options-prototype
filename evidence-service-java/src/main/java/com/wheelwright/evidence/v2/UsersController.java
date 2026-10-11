package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/** Independent User resources. Administrator status is an explicit backend capability. */
@RestController
public class UsersController {
    public record Inventory(String requestId,List<UserDirectory.User> users) {}
    public record Detail(String requestId,UserDirectory.User user) {}
    private final UserDirectory users;
    private final BearerAuthenticator auth;
    private final ObjectMapper mapper;
    public UsersController(UserDirectory users,BearerAuthenticator auth,ObjectMapper mapper){this.users=users;this.auth=auth;this.mapper=mapper;}
    @GetMapping("/v2/users")
    public ResponseEntity<String> list(@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception{return read(null,false,body,request);}
    @GetMapping("/v2/users/{userId}")
    public ResponseEntity<String> detail(@PathVariable String userId,@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception{return read(userId,false,body,request);}
    @GetMapping("/v2/me")
    public ResponseEntity<String> me(@RequestBody(required=false) byte[] body,HttpServletRequest request)throws Exception{return read(null,true,body,request);}
    private ResponseEntity<String> read(String target,boolean me,byte[] body,HttpServletRequest request)throws Exception {
        var ids=Collections.list(request.getHeaders("X-Request-Id"));String supplied=ids.size()==1?ids.getFirst().trim():"";
        boolean bad=ids.size()>1||!supplied.isEmpty()&&!HeldQuoteDiscoveryItem.validUuid(supplied);
        String id=!bad&&!supplied.isEmpty()?supplied:UUID.randomUUID().toString();
        if(!auth.configured())return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"authentication is not configured");
        var caller=auth.authenticate(request.getHeader("Authorization"));
        if(caller.isEmpty())return problem(ProblemCode.UNAUTHENTICATED,id,"missing or invalid Bearer credential");
        if(!me&&!caller.get().hasGrant(UserDirectory.ADMIN))return problem(ProblemCode.FORBIDDEN,id,"administrator authority required");
        if(bad||body!=null&&body.length>0||request.getQueryString()!=null&&!request.getQueryString().isEmpty()||target!=null&&!UserDirectory.validId(target))
            return problem(ProblemCode.INVALID_REQUEST,id,"canonical User ID required; query/body unsupported");
        try {
            if(!me&&target==null)return response(200,id,MediaType.APPLICATION_JSON,new Inventory(id,users.list()));
            var user=users.get(me?caller.get().userId():target);
            return user.isPresent()?response(200,id,MediaType.APPLICATION_JSON,new Detail(id,user.get())):problem(ProblemCode.NOT_FOUND,id,"User not found");
        }catch(java.sql.SQLException e){return problem(ProblemCode.CAPABILITY_UNAVAILABLE,id,"User storage unavailable");}
    }
    private ResponseEntity<String> problem(ProblemCode code,String id,String detail)throws Exception {
        var r=response(code.status(),id,MediaType.APPLICATION_PROBLEM_JSON,ProblemDetails.of(code,id,detail,
                code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("request",detail)):null));
        return code==ProblemCode.UNAUTHENTICATED?ResponseEntity.status(code.status()).headers(r.getHeaders()).header("WWW-Authenticate","Bearer").body(r.getBody()):r;
    }
    private ResponseEntity<String> response(int status,String id,MediaType type,Object value)throws Exception {
        return ResponseEntity.status(status).header("X-Request-Id",id).header("Cache-Control","private, no-store").contentType(type).body(mapper.writeValueAsString(value));
    }
}
