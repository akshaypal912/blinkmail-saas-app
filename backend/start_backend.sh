#!/bin/bash

# BlinkMail Backend Auto-Start Wrapper
# This script ensures the backend always runs and auto-restarts on crash

set -e

BACKEND_DIR="/vercel/share/v0-project/backend"
LOG_FILE="/tmp/blinkmail_backend.log"
PID_FILE="/tmp/blinkmail_backend.pid"

# Set environment variables
export AWS_REGION="ap-south-1"
export AWS_ACCESS_KEY_ID="AKIAQQOY4S7ORU2ZMY42"
export AWS_SECRET_ACCESS_KEY="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"
export SES_FROM_EMAIL="noreply@undefstudio.live"
export SES_FROM_NAME="BlinkMail"

# Function to start backend
start_backend() {
    echo "[$(date)] Starting BlinkMail Backend..." | tee -a "$LOG_FILE"
    
    cd "$BACKEND_DIR"
    python3 production_api.py >> "$LOG_FILE" 2>&1 &
    
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_FILE"
    
    echo "[$(date)] Backend started with PID: $BACKEND_PID" | tee -a "$LOG_FILE"
}

# Function to check if backend is running
is_backend_running() {
    if [ -f "$PID_FILE" ]; then
        BACKEND_PID=$(cat "$PID_FILE")
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Function to health check backend
health_check() {
    curl -s -m 5 http://localhost:8000/health > /dev/null 2>&1
}

# Kill any existing backend processes
echo "Cleaning up any existing backend processes..."
pkill -f "python3.*production_api" || true
sleep 2

# Start backend
start_backend

# Keep backend running (auto-restart on crash)
RESTART_COUNT=0
MAX_RESTARTS=10

while true; do
    sleep 10
    
    if ! health_check; then
        echo "[$(date)] Backend health check failed!" | tee -a "$LOG_FILE"
        
        if ! is_backend_running; then
            echo "[$(date)] Backend process crashed, restarting..." | tee -a "$LOG_FILE"
            RESTART_COUNT=$((RESTART_COUNT + 1))
            
            if [ $RESTART_COUNT -gt $MAX_RESTARTS ]; then
                echo "[$(date)] ERROR: Backend restarted $MAX_RESTARTS times. Giving up." | tee -a "$LOG_FILE"
                exit 1
            fi
            
            start_backend
        fi
    else
        RESTART_COUNT=0
    fi
done
