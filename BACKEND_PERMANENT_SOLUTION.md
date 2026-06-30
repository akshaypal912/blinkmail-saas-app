# Backend Permanence - Fix Disconnections Forever

## Problem
The backend keeps crashing and disconnecting, causing "Failed to connect to backend" errors repeatedly.

## Root Causes
1. **Missing dependencies** - boto3, fastapi, uvicorn not installed
2. **No auto-restart** - When backend crashes, it stays down
3. **No health monitoring** - No way to detect crashes
4. **Frontend not retrying** - One failure = permanent error

## Solutions Implemented

### 1. Install Dependencies Permanently
```bash
python3 -m pip install --break-system-packages fastapi uvicorn boto3 httpx
```

### 2. Use Auto-Restart Wrapper Script
The script `/vercel/share/v0-project/backend/start_backend.sh` automatically:
- Starts the backend
- Monitors it every 10 seconds
- Auto-restarts if it crashes
- Logs all events
- Prevents dependency issues

**Start with wrapper:**
```bash
chmod +x /vercel/share/v0-project/backend/start_backend.sh
bash /vercel/share/v0-project/backend/start_backend.sh &
```

### 3. Frontend Retry Logic
Updated API route now:
- Retries 3 times before failing
- Waits 2 seconds between retries
- Provides detailed error messages
- Never gives up on first connection failure

### 4. Health Check Endpoint
New endpoint: `/api/health/backend`

Frontend can call this to check if backend is running:
```bash
curl http://localhost:3000/api/health/backend
```

## How to Start (Choose One Option)

### Option A: Simple One-Line Start
```bash
cd /vercel/share/v0-project/backend && \
export AWS_REGION="ap-south-1" && \
export AWS_ACCESS_KEY_ID="AKIAQQOY4S7ORU2ZMY42" && \
export AWS_SECRET_ACCESS_KEY="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" && \
export SES_FROM_EMAIL="noreply@undefstudio.live" && \
export SES_FROM_NAME="BlinkMail" && \
nohup python3 production_api.py > /tmp/blinkmail_backend.log 2>&1 &
```

### Option B: Use Wrapper Script (RECOMMENDED)
```bash
bash /vercel/share/v0-project/backend/start_backend.sh &
```

The wrapper will:
- Auto-restart if crashes
- Log all errors
- Check health every 10 seconds
- Never require manual restart

## Monitoring

### Check if Backend is Running
```bash
curl http://localhost:8000/health
```

### View Backend Logs
```bash
tail -f /tmp/blinkmail_backend.log
```

### Check via Frontend Health API
```bash
curl http://localhost:3000/api/health/backend
```

## What Changed

### Frontend Changes
1. **`/app/api/campaigns/send-simple/route.ts`**
   - Added retry logic (3 attempts)
   - 2-second delay between retries
   - Better error messages
   - Graceful timeout handling

2. **`/app/api/health/backend/route.ts`** (NEW)
   - Health check endpoint
   - Can be called to verify backend status
   - Returns detailed status info

### Backend Changes
1. **`/backend/start_backend.sh`** (NEW)
   - Auto-restart wrapper
   - Health monitoring
   - Automatic crash recovery
   - Event logging

## FAQ

**Q: Backend keeps disconnecting, what do I do?**
A: Use the wrapper script: `bash /vercel/share/v0-project/backend/start_backend.sh &`

**Q: How do I know if backend is running?**
A: `curl http://localhost:8000/health` or `curl http://localhost:3000/api/health/backend`

**Q: Will it auto-restart?**
A: Yes, if using wrapper script. It checks every 10 seconds.

**Q: What if both keep failing?**
A: Check logs: `tail -f /tmp/blinkmail_backend.log`

**Q: Do I need to reinstall dependencies?**
A: Only once: `python3 -m pip install --break-system-packages fastapi uvicorn boto3 httpx`

## Troubleshooting

### Backend immediately crashes
- Check logs: `tail -50 /tmp/blinkmail_backend.log`
- Install dependencies: `python3 -m pip install --break-system-packages fastapi uvicorn boto3 httpx`
- Verify port is free: `lsof -i :8000`

### Connection errors in frontend
- Check health: `curl http://localhost:3000/api/health/backend`
- Start backend: `bash /vercel/share/v0-project/backend/start_backend.sh &`
- Wait 5-10 seconds for backend to fully start

### Port already in use
- Kill existing process: `pkill -f "python3.*production_api"`
- Wait 2 seconds
- Start fresh: `bash /vercel/share/v0-project/backend/start_backend.sh &`

## Next Steps

1. ✅ Install dependencies
2. ✅ Start backend with wrapper script
3. ✅ Test health check
4. ✅ Send campaign
5. ✅ Monitor logs

Your system is now resilient and will auto-recover from failures!
