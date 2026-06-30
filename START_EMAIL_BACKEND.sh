#!/bin/bash

# BlinkMail Pro - Production Email Backend Startup Script

set -e

PROJECT_DIR="/vercel/share/v0-project"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         BlinkMail Pro - Email Backend Startup                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill any existing processes
echo -e "${YELLOW}[1/4]${NC} Cleaning up old processes..."
pkill -f "python3.*production_api" || true
sleep 1

# Install dependencies (Brevo instead of AWS SES)
echo -e "${YELLOW}[2/4]${NC} Installing dependencies..."
cd "$BACKEND_DIR"
python3 -m pip install --break-system-packages fastapi uvicorn httpx 2>&1 | grep -E "Successfully|Collecting" | tail -3

# Set environment variables (Brevo)
echo -e "${YELLOW}[3/4]${NC} Setting environment variables..."
export EMAIL_PROVIDER="brevo"
export BREVO_API_KEY="your_brevo_api_key_here"
export BREVO_FROM_EMAIL="noreply@undefstudio.live"
export BREVO_FROM_NAME="BlinkMail"

echo "  ✓ EMAIL_PROVIDER=$EMAIL_PROVIDER"
echo "  ✓ BREVO_API_KEY=***"
echo "  ✓ BREVO_FROM_EMAIL=$BREVO_FROM_EMAIL"
echo "  ✓ BREVO_FROM_NAME=$BREVO_FROM_NAME"
echo ""
echo "  ⚠️  NOTE: Set your actual BREVO_API_KEY before running!"
echo "  Get it from: https://app.brevo.com/settings/account/api"

# Start backend
echo -e "${YELLOW}[4/4]${NC} Starting FastAPI backend..."
cd "$BACKEND_DIR"
python3 production_api.py > /tmp/blinkmail_backend.log 2>&1 &
BACKEND_PID=$!

echo "  Backend PID: $BACKEND_PID"
echo "  Logs: tail -f /tmp/blinkmail_backend.log"

# Wait for server to start
sleep 3

# Health check
echo ""
echo -e "${YELLOW}Verifying backend health...${NC}"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running and healthy!${NC}"
    echo -e "${GREEN}✓ Email API ready at http://localhost:8000${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "  Check logs: tail -f /tmp/blinkmail_backend.log"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Backend Ready! You can now send campaigns from the frontend.  ║"
echo "║                                                                ║"
echo "║  Frontend: http://localhost:3000                              ║"
echo "║  Backend:  http://localhost:8000                              ║"
echo "║  Logs:     tail -f /tmp/blinkmail_backend.log                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
