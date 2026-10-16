package com.wheelwright.evidence.v2;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.regex.Pattern;

/** Encoded identity only; neither membership nor deliverable qualification. */
record OptionIdentity(String root,String expiration,String right,BigDecimal strike) {
    private static final Pattern OCC=Pattern.compile("([A-Z][A-Z0-9.]{0,9}) +(\\d{6})([CP])(\\d{8})");
    private static final Pattern FID=Pattern.compile("-?([A-Z][A-Z0-9.]*?)(\\d{6})([CP])(\\d+(?:\\.\\d+)?)");
    static OptionIdentity of(PositionSnapshot.Constituent h){return of(h.contract(),h.expiration());}
    static OptionIdentity of(String symbol,String expiration) {
        if(symbol==null||expiration==null)return null;
        var occ=OCC.matcher(symbol);var fid=FID.matcher(symbol);boolean encoded=occ.matches();var m=encoded?occ:fid;
        if(!encoded&&!fid.matches())return null;
        try {
            String day=m.group(2),date=LocalDate.of(2000+Integer.parseInt(day.substring(0,2)),Integer.parseInt(day.substring(2,4)),Integer.parseInt(day.substring(4,6))).toString();
            var strike=new BigDecimal(m.group(4));if(encoded)strike=strike.movePointLeft(3);
            if(!date.equals(expiration)||strike.signum()<=0)return null;
            return new OptionIdentity(m.group(1),date,m.group(3),strike.stripTrailingZeros());
        }catch(RuntimeException e){return null;}
    }
    String nativeSymbol() {
        String digits=String.format(java.util.Locale.ROOT,"%08d",strike.movePointRight(3).toBigIntegerExact());
        return String.format(java.util.Locale.ROOT,"%-6s",root)+expiration.substring(2).replace("-","")+right+digits;
    }
}
