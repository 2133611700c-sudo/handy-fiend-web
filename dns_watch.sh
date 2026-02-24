#!/bin/bash
set -e
echo "DNS Watch started at $(date)"
start=$(date +%s)
end=$((start + 1200))
interval=60
count=0

while [[ $(date +%s) -lt $end ]]; do
    count=$((count + 1))
    a=$(dig handyandfriend.com A +short 2>/dev/null | head -1)
    cname=$(dig www.handyandfriend.com CNAME +short 2>/dev/null | head -1)
    echo "[$(date)] Check $count: A='$a', CNAME='$cname'"
    
    if [[ "$a" == "76.76.21.21" ]] && [[ "$cname" == "cname.vercel-dns.com." || "$cname" == "cname.vercel-dns.com" ]]; then
        echo "✅ DNS propagation complete!"
        exit 0
    fi
    
    if [[ $(date +%s) -ge $end ]]; then
        echo "⏱️  Timeout after 20 minutes."
        exit 1
    fi
    
    sleep $interval
done
