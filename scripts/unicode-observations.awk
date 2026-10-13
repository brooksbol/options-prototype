# Generic TSV observation plot: column 1 timestamp, column 2 number or ?.
# Usage: producer | sort -k1,1 | awk -v title="Observation history" -f unicode-observations.awk
# One glyph per real value. No interpolated dates, connecting lines, or resampling.
BEGIN { if(columns!=2)columns=1; FS="\t"; split("▁ ▂ ▃ ▄ ▅ ▆ ▇ █", glyph, " ") }
{ date[NR]=$1; gsub(/T/," ",date[NR]); sub(/[-+]0[45]:00$/," ET",date[NR]); value[NR]=$2; status[NR]=tolower($3); gsub(/_export_minute/,"",status[NR]); gsub(/_source_evidence/," evidence",status[NR])
  if ($2 ~ /^-?[0-9]+([.][0-9]+)?$/) {
    valid[NR]=1; n++; if(n==1||$2+0<lo)lo=$2+0; if(n==1||$2+0>hi)hi=$2+0
  } else if ($2 != "?") { print "plot: invalid numeric input" > "/dev/stderr"; bad=1 }
}
function money(x, s,parts,whole,out) {
  s=sprintf("%.2f",x); split(s,parts,".");whole=parts[1];out="";
  while(length(whole)>3){out="," substr(whole,length(whole)-2) out;whole=substr(whole,1,length(whole)-3)}
  return "$" whole out "." parts[2]
}
END {
  if(bad)exit 1;
  printf "%s · %d/%d values · export-minute composites\n\n",title,n,NR;
  for(i=1;i<=NR;i++) {
    if(valid[i]) {level=hi==lo?4:1+int(7*(value[i]-lo)/(hi-lo)+0.5);g=glyph[level];
      line[i]=sprintf("%s  %12s  %s",date[i],money(value[i]),g); spark=spark g;
    } else { line[i]=sprintf("%s  %12s  ? %s",date[i],"?",status[i]); spark=spark "·" }
  }
  width=0;for(i=1;i<=NR;i++){displayWidth[i]=length(line[i])-(valid[i]?length(glyph[1])-1:0);if(displayWidth[i]>width)width=displayWidth[i]}
  for(i=1;i<=NR;i+=columns) {
    printf "%s",line[i];
    if(columns==2&&i<NR)printf "%*s%s",width-displayWidth[i]+3,"",line[i+1];
    printf "\n";
  }
  if(NR)printf "\n%s\n",spark;
}
