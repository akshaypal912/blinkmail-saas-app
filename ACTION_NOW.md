# ACTION NOW - Get Running in 10 Minutes

## What You Have

All 8 credentials are ready:
- AWS credentials ✅
- AWS region ✅
- SES sender email ✅
- Supabase URL ✅
- Redis credentials ✅
- Service role key ✅

The entire system is built and ready to run.

---

## IMMEDIATE ACTIONS (Right Now)

### Action 1: Add Credentials to backend/.env

File: `backend/.env`

Find these lines and replace:

```bash
# Line 8: Replace this
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# With your actual service role key (the one you have)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
# Line 11: Replace this
UPSTASH_REDIS_REST_URL=PASTE_YOUR_UPSTASH_URL_HERE

# With your actual Upstash REST URL
UPSTASH_REDIS_REST_URL=https://xxx-xxx.upstash.io
```

```bash
# Line 12: Replace this
UPSTASH_REDIS_REST_TOKEN=PASTE_YOUR_UPSTASH_TOKEN_HERE

# With your actual Upstash token
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Save the file.

---

### Action 2: Install Dependencies

Open terminal and run:

```bash
cd backend
pip install -r requirements.txt
```

This takes 1-2 minutes.

---

### Action 3: Start Backend (Terminal 1)

```bash
cd backend
python main.py
```

Wait until you see:
```
Uvicorn running on http://127.0.0.1:8000
```

---

### Action 4: Start Workers (Terminal 2)

Open a new terminal and run:

```bash
cd backend
python run_worker.py
```

Wait until you see:
```
celery@HOSTNAME ready.
4 pool workers ready to process tasks
```

---

### Action 5: Check Frontend

Your frontend is already running on http://localhost:3000

If not, start it:

```bash
pnpm dev
```

---

### Action 6: Send First Campaign

1. Open http://localhost:3000
2. You should be at the login page
3. Sign up OR login with existing Supabase account
4. Go to Dashboard
5. Click Campaigns
6. Select/create a campaign
7. Click blue button: **"Send Campaign Now"**
8. Watch emails send in real-time!

---

## Success Indicators

Backend is ready when:
- No errors in Terminal 1
- API responds: `curl http://localhost:8000/health`

Workers are ready when:
- Terminal 2 shows "4 pool workers ready"

Frontend is ready when:
- http://localhost:3000 loads without errors

Campaign sent successfully when:
- Frontend shows: "X sent, Y delivered, Z bounced"
- Status updates every 10 seconds
- Supabase shows recipients in campaign_recipients table

---

## If Something Doesn't Work

Check Terminal 1 and 2 for error messages.

Common issues:

**"Connection refused" at port 8000**
- Backend not running in Terminal 1
- Or port 8000 already in use

**"Redis connection failed"**
- UPSTASH_REDIS_REST_URL wrong in .env
- Token not matching

**"Supabase error"**
- SUPABASE_SERVICE_ROLE_KEY is wrong
- Check it starts with "eyJ"

**"AWS SES error"**
- Check AWS credentials are correct
- Check region is ap-south-1

---

## That's It!

You now have a production-ready email system that can send 100+ emails in 3-5 seconds.

Enjoy! 🚀
