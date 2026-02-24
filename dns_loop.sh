#!/bin/bash
set -e

LOG="docs/EXEC_CONTROL_LOG.md"
TARGET_A="76.76.21.21"
TARGET_CNAME="cname.vercel-dns.com"

echo "Starting DNS validation loop..."

for i in {1..20}; do
    echo "--- Iteration $i ---"
    A=$(dig +short handyandfriend.com A)
    CNAME=$(dig +short www.handyandfriend.com CNAME)
    TIMESTAMP=$(date)
    echo "$TIMESTAMP"
    echo "A: $A"
    echo "CNAME: $CNAME"
    
    # Append to log
    echo "### Iteration $i ($(date +%H:%M:%S))" >> "$LOG"
    echo "- A record: ${A:-(empty)}" >> "$LOG"
    echo "- CNAME record: ${CNAME:-(empty)}" >> "$LOG"
    
    if [[ "$A" == "$TARGET_A" && "$CNAME" == "$TARGET_CNAME" ]]; then
        echo "DNS PASS reached!" >> "$LOG"
        echo "DNS PASS reached!"
        exit 0
    else
        echo "- Status: NOT MATCH" >> "$LOG"
        echo ""
    fi
    
    sleep 60
done

echo "First 20 minutes elapsed, extending for 10 more minutes with 120s interval..."
echo "### Extended phase (20 min elapsed)" >> "$LOG"

for i in {1..5}; do
    echo "--- Extended iteration $i ---"
    A=$(dig +short handyandfriend.com A)
    CNAME=$(dig +short www.handyandfriend.com CNAME)
    TIMESTAMP=$(date)
    echo "$TIMESTAMP"
    echo "A: $A"
    echo "CNAME: $CNAME"
    
    echo "### Extended iteration $i ($(date +%H:%M:%S))" >> "$LOG"
    echo "- A record: ${A:-(empty)}" >> "$LOG"
    echo "- CNAME record: ${CNAME:-(empty)}" >> "$LOG"
    
    if [[ "$A" == "$TARGET_A" && "$CNAME" == "$TARGET_CNAME" ]]; then
        echo "DNS PASS reached!" >> "$LOG"
        echo "DNS PASS reached!"
        exit 0
    else
        echo "- Status: NOT MATCH" >> "$LOG"
        echo ""
    fi
    
    sleep 120
done

echo "DNS validation failed after 30 minutes."
echo "### DNS validation FAILED after 30 minutes" >> "$LOG"
exit 1