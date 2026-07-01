#!/usr/bin/env python3
"""
BlinkMail Backend Watchdog
Monitors the backend and restarts it if it crashes
Run this in the background: python3 watchdog.py &
"""

import subprocess
import time
import os
import signal
import sys
from datetime import datetime

BACKEND_SCRIPT = "production_api.py"
BACKEND_DIR = "/vercel/share/v0-project/backend"
LOG_FILE = "/tmp/blinkmail_watchdog.log"
CHECK_INTERVAL = 10  # Check every 10 seconds
MAX_CONSECUTIVE_FAILURES = 3

backend_process = None
consecutive_failures = 0


def log_message(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    print(log_entry)
    with open(LOG_FILE, "a") as f:
        f.write(log_entry + "\n")


def start_backend():
    """Start the backend process"""
    global backend_process, consecutive_failures
    
    try:
        log_message("Starting backend...")
        os.chdir(BACKEND_DIR)
        
        backend_process = subprocess.Popen(
            ["python3", BACKEND_SCRIPT],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid  # Create new process group
        )
        
        time.sleep(2)
        
        if backend_process.poll() is None:
            log_message(f"✓ Backend started successfully (PID: {backend_process.pid})")
            consecutive_failures = 0
            return True
        else:
            log_message("✗ Backend exited immediately")
            consecutive_failures += 1
            return False
            
    except Exception as e:
        log_message(f"✗ Failed to start backend: {e}")
        consecutive_failures += 1
        return False


def check_backend():
    """Check if backend is still running"""
    global backend_process
    
    if backend_process is None:
        return False
    
    if backend_process.poll() is not None:
        return False
    
    return True


def stop_backend():
    """Stop the backend process"""
    global backend_process
    
    if backend_process is None:
        return
    
    try:
        log_message(f"Stopping backend (PID: {backend_process.pid})...")
        os.killpg(os.getpgid(backend_process.pid), signal.SIGTERM)
        backend_process.wait(timeout=5)
        log_message("Backend stopped")
    except subprocess.TimeoutExpired:
        log_message("Force killing backend...")
        os.killpg(os.getpgid(backend_process.pid), signal.SIGKILL)
    except Exception as e:
        log_message(f"Error stopping backend: {e}")
    
    backend_process = None


def watchdog_loop():
    """Main watchdog loop"""
    global consecutive_failures
    
    log_message("=" * 60)
    log_message("BlinkMail Backend Watchdog Started")
    log_message(f"Check interval: {CHECK_INTERVAL} seconds")
    log_message(f"Backend script: {BACKEND_SCRIPT}")
    log_message(f"Backend directory: {BACKEND_DIR}")
    log_message("=" * 60)
    
    # Start backend initially
    start_backend()
    
    try:
        while True:
            time.sleep(CHECK_INTERVAL)
            
            if not check_backend():
                log_message("⚠ Backend is NOT running!")
                consecutive_failures += 1
                
                if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
                    log_message(f"✗ Backend failed {consecutive_failures} times. Checking...")
                
                # Try to restart
                stop_backend()
                time.sleep(2)
                if not start_backend():
                    log_message("Failed to restart backend, will retry...")
            else:
                # Backend is running
                if consecutive_failures > 0:
                    log_message("✓ Backend recovered and is running")
                    consecutive_failures = 0
                
    except KeyboardInterrupt:
        log_message("\nWatchdog interrupted by user")
        stop_backend()
        sys.exit(0)
    except Exception as e:
        log_message(f"Watchdog error: {e}")
        stop_backend()
        sys.exit(1)


def signal_handler(sig, frame):
    """Handle signals gracefully"""
    log_message("Received signal. Shutting down...")
    stop_backend()
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    watchdog_loop()
