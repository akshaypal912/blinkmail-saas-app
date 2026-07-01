#!/usr/bin/env python3
"""
Backend Supervisor - Keeps the backend running forever
Automatically restarts if it crashes
"""
import subprocess
import time
import sys
import signal
import os

class BackendSupervisor:
    def __init__(self):
        self.process = None
        self.running = True
        self.restart_count = 0
        
    def start_backend(self):
        """Start the backend process"""
        try:
            print("[SUPERVISOR] Starting backend...")
            self.process = subprocess.Popen(
                [sys.executable, 'production_api.py'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd='/vercel/share/v0-project/backend'
            )
            print(f"[SUPERVISOR] Backend started with PID: {self.process.pid}")
            self.restart_count += 1
            return True
        except Exception as e:
            print(f"[SUPERVISOR] Error starting backend: {e}")
            return False
    
    def check_backend(self):
        """Check if backend is running"""
        if self.process is None:
            return False
        
        # Check if process is still alive
        poll = self.process.poll()
        if poll is not None:
            print(f"[SUPERVISOR] Backend crashed with code: {poll}")
            return False
        
        return True
    
    def restart_backend(self):
        """Restart the backend"""
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=3)
            except:
                try:
                    self.process.kill()
                except:
                    pass
        
        time.sleep(2)
        self.start_backend()
    
    def signal_handler(self, sig, frame):
        """Handle shutdown signal"""
        print("[SUPERVISOR] Shutting down...")
        self.running = False
        if self.process:
            self.process.terminate()
    
    def run(self):
        """Run the supervisor loop"""
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        self.start_backend()
        
        while self.running:
            time.sleep(5)
            
            if not self.check_backend():
                print(f"[SUPERVISOR] Backend not responding, restarting (attempt {self.restart_count})...")
                self.restart_backend()
        
        print("[SUPERVISOR] Supervisor stopped")
        sys.exit(0)

if __name__ == '__main__':
    supervisor = BackendSupervisor()
    supervisor.run()
