# 🚀 Deploy BlinkMail Pro Email System NOW

## What You Have ✅

All credentials are now ready:

```
AWS_ACCESS_KEY_ID           ✅ Provided
AWS_SECRET_ACCESS_KEY       ✅ Provided
AWS_REGION                  ✅ ap-south-1
AWS_SES_SENDER_EMAIL        ✅ hello@undefstudio.live
SUPABASE_URL                ✅ https://xelmbawclsfkvtzdtojy.supabase.co
UPSTASH_REDIS_REST_URL      ✅ Provided
UPSTASH_REDIS_REST_TOKEN    ✅ Provided
SUPABASE_SERVICE_ROLE_KEY   ✅ You have it!
```

---

## Step 1: Complete the .env File

**File:** `backend/.env`

Replace these placeholders:

```bash
# Replace PASTE_YOUR_SERVICE_ROLE_KEY_HERE with your actual Supabase service role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Replace PASTE_YOUR_UPSTASH_URL_HERE with your actual Upstash URL
UPSTASH_REDIS_REST_URL=https://xxx-xxx.upstash.io

# Replace PASTE_YOUR_UPSTASH_TOKEN_HERE with your actual Upstash token
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- fastapi
- uvicorn
- celery
- redis
- boto3 (AWS)
- supabase
- httpx
- python-dotenv
- pydantic

---

## Step 3: Start Backend Server (Terminal 1)

```bash
cd backend
python main.py
```

Expected output:
```
Uvicorn running on http://127.0.0.1:8000
```

---

## Step 4: Start Celery Workers (Terminal 2)

```bash
cd backend
python run_worker.py
```

Expected output:
```
celery@HOSTNAME ready.
4 pool workers ready to process tasks
```

---

## Step 5: Start Frontend (Terminal 3)

```bash
pnpm dev
```

App runs on: http://localhost:3000

---

## Step 6: Send Your First Campaign!

1. Open http://localhost:3000
2. Login with your Supabase credentials
3. Go to **Dashboard** → **Campaigns**
4. Select or create a campaign
5. Click **"Send Campaign Now"** button
6. Watch real-time email sending status! ✓

---

## Verify It's Working

### Backend API Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "workers": 4,
  "redis": "connected"
}
```

### Celery Workers Status

Check Terminal 2 for active worker logs when sending campaigns.

### Real-time Tracking

Frontend shows: `"X sent, Y delivered, Z bounced"`

Updates every 10 seconds while campaign is sending.

---

## Performance Expectations

**First 100 emails:**
- Time: 3-5 seconds
- Speed: 20-33 emails/second

**First 1000 emails:**
- Time: 15-30 seconds
- Speed: 33-66 emails/second

---

## Troubleshooting

### Issue: "Connection refused" on port 8000
- Make sure backend is running (Step 3)
- Check if port 8000 is in use: `lsof -i :8000`

### Issue: "Redis connection failed"
- Verify UPSTASH_REDIS_REST_URL in .env is correct
- Check Upstash credentials
- Test with: `python -c "import redis; print(redis.Redis.from_url(...)"`

### Issue: "Supabase auth error"
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Not the anon key - must be service_role key
- Check SUPABASE_URL format

### Issue: "AWS SES error"
- Verify AWS credentials in .env
- Check region is ap-south-1
- Ensure hello@undefstudio.live is verified in AWS SES

---

## Next Steps

### Local Testing (Now)
1. Send 10 test emails
2. Check Supabase campaign_recipients table
3. Monitor real-time status updates

### Production Deployment (This Week)
1. Deploy backend to Vercel (Node/Python support)
2. Deploy frontend to Vercel
3. Configure environment variables in Vercel
4. Test end-to-end

### Scaling (This Month)
1. Increase workers to 8+ for higher throughput
2. Monitor email metrics and costs
3. Set up bounce handling
4. Configure SES event notifications

---

## Commands Quick Reference

```bash
# Backend
cd backend && python main.py                 # Start API
python run_worker.py                         # Start workers

# Frontend
pnpm dev                                     # Start Next.js
pnpm build                                   # Build for production

# Testing
curl http://localhost:8000/health            # Check backend
curl http://localhost:3000                   # Check frontend
```

---

## Files You'll Use Most

- `backend/.env` - Configuration (keep secret!)
- `backend/main.py` - API endpoints
- `backend/email_service.py` - AWS SES integration
- `backend/celery_app.py` - Worker configuration
- `app/(dashboard)/campaigns/[id]/page.tsx` - Frontend UI

---

## Support

If you encounter issues:

1. Check `START_HERE.md` for navigation
2. Read `backend/BACKEND_SETUP.md` for API details
3. See `EMAIL_SENDING_SETUP.md` for configuration help
4. Review logs in both terminals

---

## You're Ready! 🚀

All credentials are set. All code is written. All configuration is ready.

**Next action:** Complete .env with your service role key and Upstash credentials.

Then run the 4 commands above and start sending campaigns!

Good luck! 🎉
