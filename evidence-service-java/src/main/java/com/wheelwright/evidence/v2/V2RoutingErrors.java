package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.handler.AbstractHandlerExceptionResolver;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.util.*;

/** Normalize framework routing failures only inside v2; legacy /api and frontend errors are untouched. */
@Component
public final class V2RoutingErrors extends AbstractHandlerExceptionResolver {
 private final BearerAuthenticator auth;private final ObjectMapper mapper;
 public V2RoutingErrors(BearerAuthenticator auth,ObjectMapper mapper){this.auth=auth;this.mapper=mapper;setOrder(Ordered.HIGHEST_PRECEDENCE);}
 @Override protected ModelAndView doResolveException(HttpServletRequest request,HttpServletResponse response,Object handler,Exception error){
  String path=request.getRequestURI().substring(request.getContextPath().length());
  boolean missing=error instanceof NoResourceFoundException||error instanceof NoHandlerFoundException;
  boolean unsupported=error instanceof HttpRequestMethodNotSupportedException;
  if(!(path.equals("/v2")||path.startsWith("/v2/"))||!missing&&!unsupported||response.isCommitted())return null;
  var supplied=Collections.list(request.getHeaders("X-Request-Id"));String value=supplied.size()==1?supplied.getFirst().strip():"";
  boolean invalid=supplied.size()>1||!value.isEmpty()&&!value.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
  String id=!invalid&&!value.isEmpty()?value:UUID.randomUUID().toString();
  ProblemCode code;String detail;
  if(!auth.configured()){code=ProblemCode.CAPABILITY_UNAVAILABLE;detail="Authentication unavailable";}
  else if(auth.authenticate(request.getHeader("Authorization")).isEmpty()){code=ProblemCode.UNAUTHENTICATED;detail="Missing or invalid Bearer credential";}
  else if(invalid){code=ProblemCode.INVALID_REQUEST;detail="Invalid correlation header";}
  else{code=unsupported?ProblemCode.METHOD_NOT_ALLOWED:ProblemCode.NOT_FOUND;detail=unsupported?"Method is not supported for this v2 route":"V2 resource route not found";}
  try{
   response.setStatus(code.status());response.setContentType("application/problem+json");response.setCharacterEncoding("UTF-8");response.setHeader("X-Request-Id",id);response.setHeader("Cache-Control","private, no-store");
   if(code==ProblemCode.UNAUTHENTICATED)response.setHeader("WWW-Authenticate","Bearer");
   if(code==ProblemCode.METHOD_NOT_ALLOWED){var allowed=new TreeSet<String>();var methods=((HttpRequestMethodNotSupportedException)error).getSupportedMethods();if(methods!=null)allowed.addAll(Arrays.asList(methods));if(allowed.contains("GET"))allowed.add("HEAD");allowed.add("OPTIONS");response.setHeader("Allow",String.join(", ",allowed));}
   mapper.writeValue(response.getWriter(),ProblemDetails.of(code,id,detail,code==ProblemCode.INVALID_REQUEST?List.of(new ProblemDetails.InvalidParam("X-Request-Id",detail)):null));
   return new ModelAndView();
  }catch(java.io.IOException failure){return null;}
 }
}
