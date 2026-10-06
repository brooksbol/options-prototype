package com.wheelwright.evidence.v2;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
class PathSymbolCodecTest {
    @Test void alphabetPropertiesAndCollisionFreedom() {
        String first="ABCDEFGHIJKLMNOPQRSTUVWXYZ^",tail=first+"0123456789./_-";
        Map<String,String> seen=new HashMap<>();
        for(char a:first.toCharArray()) {check(""+a,seen);for(char b:tail.toCharArray()){check(""+a+b,seen);for(char c:tail.toCharArray())check(""+a+b+c,seen);}}
        Random random=new Random(0x57575348);
        for(int k=0;k<10000;k++){StringBuilder s=new StringBuilder().append(first.charAt(random.nextInt(first.length())));int n=1+random.nextInt(32);while(s.length()<n)s.append(tail.charAt(random.nextInt(tail.length())));check(s.toString(),seen);}
        assertThat(PathSymbolCodec.encode("^".repeat(32))).hasSize(96);
        assertThat(PathSymbolCodec.encode("BRK/B")).isEqualTo("BRK_2FB");
        assertThat(PathSymbolCodec.decode("BRK_5F2FB")).isEqualTo("BRK_2FB");
    }
    private void check(String s,Map<String,String> seen){String p=PathSymbolCodec.encode(s);assertThat(PathSymbolCodec.decode(p)).isEqualTo(s);assertThat(PathSymbolCodec.encode(PathSymbolCodec.decode(p))).isEqualTo(p);String old=seen.put(p,s);if(old!=null)assertThat(old).isEqualTo(s);}
    @Test void malformedAndNoncanonicalTokensFail() {
        for(String s:new String[]{"","spy","BRK_","BRK_2","BRK_2fB","BRK_5f2FB","BRK_41","BRK_2E","BRK_00","BRK_25","BRK/B","^SPX","BRK%2FB","_2FSPY","SPY\n","SPY\r","SPY\t","_5E".repeat(33)})
            assertThatThrownBy(()->PathSymbolCodec.decode(s)).isInstanceOf(IllegalArgumentException.class);
    }
}
