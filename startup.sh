#!/bin/sh
# Restart contract: bring the preview server back if it is down.
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
cd /workspace
npm run dev > /tmp/dev-server.log 2>&1 &
exit 0
