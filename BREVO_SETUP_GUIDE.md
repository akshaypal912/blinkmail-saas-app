# Brevo Setup Guide for BlinkMail Pro

## Quick Start (5 minutes)

### Step 1: Get Brevo API Key (2 minutes)

1. Visit: https://www.brevo.com/register
2. Sign up for free account
3. After signup, go to: **Settings** → **Account & Billing** → **API Keys**
4. Click **"Create API Key"**
5. Name it: "BlinkMail" (optional)
6. Select scope: **Transactional Email** (must have this)
7. Click **Generate**
8. **Copy the API key** (you'll need it in next step)

### Step 2: Update Environment Variables (2 minutes)

Edit `/vercel/share/v0-project/backend/.env`:

```bash
# Email Provider Configuration (Brevo)
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your_api_key_here_paste_it
BREVO_FROM_EMAIL=noreply@undefstudio.live
BREVO_FROM_NAME=BlinkMail
```

Replace `your_api_key_here_paste_it` with the actual API key from Step 1.

### Step 3: Start Backend (1 minute)

```bash
bash /vercel/share/v0-project/START_EMAIL_BACKEND.sh
```

You should see:
```
✓ Backend is running and healthy!
✓ Email API ready at http://localhost:8000
```

### Step 4: Test It Works (30 seconds)

Open frontend: http://localhost:3000
- Create a new campaign
- Add an email recipient (any real email works!)
- Click Send
- Email should arrive in seconds!

## That's It! 🎉

You now have working email sending with Brevo. No sandbox restrictions, no AWS account needed.

---

## Common Issues

### Issue: "BREVO_API_KEY is required"

**Solution:**
1. Check `.env` file has the API key
2. Make sure there are no spaces: `BREVO_API_KEY=abc123xyz`
3. Restart backend: `bash START_EMAIL_BACKEND.sh`

### Issue: "Email sending fails"

**Check:**
```bash
# View logs
tail -f /tmp/blinkmail_backend.log

# Look for error message
```

Common errors:
- `401 Unauthorized` → Invalid API key (paste it again)
- `invalid email` → Email format issue
- `too many requests` → Rate limit (Brevo free: 300/day)

### Issue: "Cannot find module email_provider"

**Solution:**
```bash
cd /vercel/share/v0-project/backend
python3 -m pip install --break-system-packages -r requirements.txt
```

### Issue: Backend crashes on startup

**Solution:**
```bash
# Kill old processes
pkill -f "python3.*production_api"

# Wait
sleep 2

# Reinstall dependencies
cd /vercel/share/v0-project/backend
python3 -m pip install --break-system-packages -r requirements.txt --force-reinstall

# Start fresh
python3 production_api.py
```

---

## What's Changed vs AWS SES

| Aspect | AWS SES | Brevo |
|--------|---------|-------|
| Setup | 20 minutes | 5 minutes |
| API Key | Access Key + Secret | Single key |
| Sandbox | Verified recipients only | Send to anyone |
| Free Limit | 62k/month (AWS acct) | 300/day forever |
| Restrictions | Many | None |
| **Your Choice** | ❌ Complex | ✅ Simple |

---

## Advanced: Testing API Directly

### Health Check
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-06-30T10:30:00.000000",
  "email_provider": "brevo",
  "provider_status": "ready"
}
```

### Send Test Email
```bash
curl -X POST http://localhost:8000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_email@example.com",
    "subject": "Test from Brevo",
    "body": "<h1>Hello!</h1><p>Email working via Brevo</p>",
    "from_email": "noreply@undefstudio.live"
  }'
```

### Send Campaign
```bash
curl -X POST http://localhost:8000/api/send-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "test123",
    "campaign_name": "Test Campaign",
    "subject_line": "Hello {first_name}!",
    "from_email": "noreply@undefstudio.live",
    "from_name": "BlinkMail",
    "html_content": "<h1>Welcome {first_name}!</h1><p>Email: {email}</p>",
    "recipients": [
      {
        "id": "1",
        "email": "user1@example.com",
        "first_name": "Alice",
        "last_name": "Smith"
      },
      {
        "id": "2",
        "email": "user2@example.com",
        "first_name": "Bob",
        "last_name": "Jones"
      }
    ]
  }'
```

---

## Monitoring

### View Logs
```bash
tail -f /tmp/blinkmail_backend.log
```

### Check Brevo Dashboard
1. Go to: https://app.brevo.com
2. Click: **Statistics** or **Campaigns**
3. See delivery stats, bounces, opens, clicks
4. Monitor API usage

### Monitor Database
1. Supabase console: https://supabase.com
2. Check `campaigns` table for status
3. Check `contacts` table for sent/failed

---

## Scaling

### Increase Send Rate
Edit `/vercel/share/v0-project/backend/config.py`:
```python
MAX_BATCH_SIZE = 100  # was 50, now 100
MAX_CONCURRENT_BATCHES = 8  # was 4, now 8
```

### Handle More Recipients
- Free tier: 300/day
- Upgrade in Brevo dashboard for higher limits
- No change needed in BlinkMail code!

---

## Production Deployment

### Environment Variables
Set in your hosting platform:
```
EMAIL_PROVIDER=brevo
BREVO_API_KEY=[your_key]
BREVO_FROM_EMAIL=noreply@undefstudio.live
BREVO_FROM_NAME=BlinkMail
```

### No Other Changes Needed
- Frontend code: ✅ No changes
- Database: ✅ No changes
- API endpoints: ✅ No changes
- UI/UX: ✅ No changes

The migration is **100% transparent** to users!

---

## Need Help?

1. **Brevo Docs**: https://developers.brevo.com/docs/getting-started
2. **API Reference**: https://developers.brevo.com/docs/sending-transactional-email
3. **Support**: https://app.brevo.com/support
4. **Status**: https://status.brevo.com

---

## Summary

✅ Get API key from Brevo (5 min)
✅ Update `.env` file (1 min)
✅ Start backend (1 min)
✅ Test in frontend (30 sec)
✅ Done! Start sending emails

Total time: **~10 minutes**

Enjoy your upgraded email system! 🚀

