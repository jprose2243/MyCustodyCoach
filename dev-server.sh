#!/bin/bash

# Kill any existing Next.js dev servers
echo "🧹 Cleaning up existing dev servers..."
pkill -f "next dev" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

# Start the dev server on port 3000
echo "🚀 Starting dev server on port 3000..."
npm run dev 