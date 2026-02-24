#!/bin/bash
set -e
echo "Starting DNS propagation check for handyandfriend.com"
echo "Target A record: 76.76.21.21"
echo "Target CNAME: cname.vercel-dns.com"
echo "Will check every 60 seconds for up to 20 minutes."

start_time=$(date +%s)
max_time=$((start_time + 1200)) # 20 minutes
check_interval=60
iterations=0

while [[ $(date +%s) -lt $max_time ]]; do
    iterations=$((iterations + 1))
    echo "=== Check $iterations at $(date) ==="
    
    # Check A record
    a_record=$(dig handyandfriend.com A +short 2>/dev/null | head -1)
    echo "A record: $a_record"
    
    # Check CNAME
    cname_record=$(dig www.handyandfriend.com CNAME +short 2>/dev/null | head -1)
    echo "CNAME record: $cname_record"
    
    if [[ "$a_record" == "76.76.21.21" ]] && [[ "$cname_record" == "cname.vercel-dns.com." ]] || [[ "$cname_record" == "cname.vercel-dns.com" ]]; then
        echo "✅ DNS propagation complete!"
        echo "A record: $a_record"
        echo "CNAME record: $cname_record"
        exit 0
    fi
    
    if [[ $(date +%s) -ge $max_time ]]; then
        echo "⏱️  Timeout after 20 minutes."
        echo "Current A: $a_record"
        echo "Current CNAME: $cname_record"
        exit 1
    fi
    
    echo "Waiting $check_interval seconds..."
    sleep $check_interval
done
