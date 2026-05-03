#!/bin/bash
CONFIG="$HOME/.vps-widget-config"
if [ ! -f "$CONFIG" ]; then echo "error"; exit 1; fi

HOST=$(python3 -c "import json,sys; c=json.load(open('$CONFIG')); print(c['host'])" 2>/dev/null)
USER=$(python3 -c "import json,sys; c=json.load(open('$CONFIG')); print(c['user'])" 2>/dev/null)
PASS=$(python3 -c "import json,sys; c=json.load(open('$CONFIG')); print(c['pass'])" 2>/dev/null)

if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$PASS" ]; then echo "error"; exit 1; fi

/opt/homebrew/bin/sshpass -p "$PASS" ssh \
  -o StrictHostKeyChecking=no \
  -o ConnectTimeout=5 \
  "$USER@$HOST" \
  "powershell -NonInteractive -ExecutionPolicy Bypass -File C:\\Users\\$USER\\getstats.ps1" 2>/dev/null || echo "error"
