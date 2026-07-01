#!/bin/bash

# BlinkMail Backend - Permanent Startup Script
# This script ensures the backend never stays down

BACKEND_DIR="/vercel/share/v0-project/backend"
LOG_FILE="/tmp/blinkmail_backend.log"
PID_FILE="/tmp/blinkmail_backend.pid"
MAX_RETRIES=0  # No limit on retries

# Function to log messages
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to start backend
start_backend() {
    cd "$BACKEND_DIR"
    
    # Check if already running
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log_message "Backend already running (PID: $OLD_PID)"
            return 0
        fi
    fi
    
    log_message "Starting backend..."
    
    # Start backend in background
    nohup python3 production_api.py >> "$LOG_FILE" 2>&1 &
    NEW_PID=$!
    
    echo "$NEW_PID" > "$PID_FILE"
    log_message "Backend started (PID: $NEW_PID)"
    
    # Wait for startup
    sleep 3
    
    # Verify it's running
    if ps -p "$NEW_PID" > /dev/null 2>&1; then
        log_message "✓ Backend verified running"
        return 0
    else
        log_message "✗ Backend failed to start"
        return 1
    fi
}

# Function to check and restart if dead
check_and_restart() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ! ps -p "$PID" > /dev/null 2>&1; then
            log_message "Backend died (PID: $PID). Restarting..."
            start_backend
        fi
    else
        start_backend
    fi
}

# Main logic
case "${1:-start}" in
    start)
        start_backend
        ;;
    stop)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            kill "$PID" 2>/dev/null
            rm "$PID_FILE"
            log_message "Backend stopped"
        fi
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    check)
        check_and_restart
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|check}"
        exit 1
        ;;
esac
