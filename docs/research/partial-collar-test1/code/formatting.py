"""Readable prose formatting without changing links or code."""
import re

def prose_spacing(text):
    parts=re.split(r'(```[\s\S]*?```|`[^`\n]*`|!?\[[^\]]*\]\([^)]*\)|https?://[^\s]+)',text)
    for i in range(0,len(parts),2):
        s=parts[i]
        s=re.sub(r'(?<=[A-Za-z])(?=\d)', ' ',s)
        s=re.sub(r'(?<=\d)(?=[A-Za-z])', ' ',s)
        s=re.sub(r'(?<=[,;:])(?=\d)', ' ',s)
        s=re.sub(r'(?<=[.!?])(?=(?:19|20)\d{2}\b)', ' ',s)
        s=re.sub(r'(?<=[A-Za-z])(?=\$)', ' ',s)
        for a,b in [('benchmarkA','benchmark A'),('benchmarkB','benchmark B'),('fastA','fast A'),('aboveSMA','above SMA'),('belowSMA','below SMA'),('restoreB','restore B'),('beforeJune','before June')]:s=s.replace(a,b)
        parts[i]=s
    return ''.join(parts).replace('see[','see [').replace('See[','See [').replace('Examine[','Examine [')
