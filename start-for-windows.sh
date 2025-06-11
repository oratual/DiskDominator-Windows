#!/bin/bash
# Start script that binds to all interfaces for Windows access via Tailscale

echo "🚀 Starting DiskDominator for Windows access..."
echo "================================================"
echo
echo "📡 WSL Tailscale IP: 100.96.251.13"
echo "🌐 Access from Windows at: http://100.96.251.13:3002"
echo
echo "Starting server bound to 0.0.0.0..."
echo

# Change to project directory
cd /home/lauta/glados/DiskDominator

# Start Next.js bound to all interfaces
npm run dev -- --hostname 0.0.0.0 --port 3002