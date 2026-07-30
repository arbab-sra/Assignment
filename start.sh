#!/bin/bash
echo "🚀 Launching syncbits Watch Party System (Backend & Frontend)..."

trap 'kill 0' EXIT

(cd server && npm run dev) &
(cd client && npm run dev) &

wait
