#!/bin/bash
set -e
echo "DNS Monitor started at $(date)"
echo "Target A: 76.76.21.21, Target CNAME: cname.vercel-dns.com"

start=$(date +%s)
end=$((start + 1200)) # 20 minutes
interval=60
last_report=$start

while [[ $(date +%s) -lt $end ]]; do
    now=$(date +%s)
    a=$(dig handyandfriend.com A +short 2>/dev/null | head -1)
    cname=$(dig www.handyandfriend.com CNAME +short 2>/dev/null | head -1)
    
    # Report every 5 minutes
    if [[ $((now - last_report)) -ge 300 ]]; then
        echo "[$(date)] Progress: A='$a', CNAME='$cname'"
        last_report=$now
    fi
    
    if [[ "$a" == "76.76.21.21" ]] && [[ "$cname" == "cname.vercel-dns.com." || "$cname" == "cname.vercel-dns.com" ]]; then
        echo "[$(date)] ✅ DNS propagation complete!"
        echo "A: $a, CNAME: $cname"
        exit 0
    fi
    
    sleep $interval
done

echo "[$(date)] ⏱️  Timeout after 20 minutes."
echo "Final state: A='$a', CNAME='$cname'"
exit 1
