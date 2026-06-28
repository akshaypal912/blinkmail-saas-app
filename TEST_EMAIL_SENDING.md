# Email Sending - Complete Test & Debugging Guide

## Quick Verification

### Backend Health Check
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status":"healthy","timestamp":"...","ses_client":"ready"}
```

If this fails, the backend is not running. Start it:
```bash
cd /vercel/share/v0-project/backend
export AWS_REGION="ap-south-1"
export AWS_ACCESS_KEY_ID="AKIAQQOY4S7ORU2ZMY42"
export AWS_SECRET_ACCESS_KEY="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"
export AWS_SES_SENDER_EMAIL="hello@undefstudio.live"
python3 production_api.py
```

---

## Test 1: Direct Backend Email Send

### Send a test email directly to backend:

```bash
curl -X POST http://localhost:8000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "palakshay071@gmail.com",
    "subject": "Test from BlinkMail Backend",
    "body": "<h1>Hello!</h1><p>This is a test email from production backend.</p>"
  }'
```

**Expected Success Response:**
```json
{
  "status": "sent",
  "email": "palakshay071@gmail.com",
  "message_id": "0000014d-...",
  "timestamp": "2026-06-28T..."
}
```

**If You Get Error:**
- `"Email address is not verified"` → Verify hello@undefstudio.live in AWS SES Console
- `"MessageRejected"` → Email format issue or not verified
- Connection refused → Backend not running

### Check Backend Logs:
```bash
tail -f /tmp/blinkmail_backend.log
```

You should see:
```
[2026-06-28 ...] INFO: Sending email to: palakshay071@gmail.com
[2026-06-28 ...] INFO: ✓ Email sent successfully to palakshay071@gmail.com (MessageId: 0000014d-...)
```

---

## Test 2: Send via Frontend (Full Integration Test)

1. **Open Browser:**
   ```
   http://localhost:3000
   ```

2. **Login/Sign Up**
   - Email: test@example.com
   - Password: Test123!

3. **Add Contacts:**
   - Dashboard → Contacts
   - Add your email (e.g., palakshay071@gmail.com)

4. **Create Campaign:**
   - Campaigns → New Campaign
   - Name: "Test Campaign"
   - Subject: "Hello from BlinkMail"
   - From: hello@undefstudio.live
   - Content: Add some HTML template

5. **Send Campaign:**
   - Click green "Send" button
   - Watch for success message
   - Check logs

6. **Verify in Frontend Logs:**
   - Browser Console (F12)
   - Look for: `[v0] Calling backend at: http://localhost:8000`
   - Should show: `[v0] Backend response: {...}`

7. **Verify in Backend Logs:**
   ```bash
   tail -f /tmp/blinkmail_backend.log
   ```
   Look for:
   ```
   INFO: Received send request for campaign: ...
   INFO: Recipients: 1, Sender: hello@undefstudio.live
   INFO: Sending email to: palakshay071@gmail.com
   INFO: ✓ Email sent successfully
   INFO: Campaign ... completed: 1 sent, 0 failed
   ```

---

## Troubleshooting Flowchart

### Symptom: "Sending..." stuck forever

1. **Check: Is backend running?**
   ```bash
   curl http://localhost:8000/health
   ```
   - ✓ Yes → Go to step 2
   - ✗ No → Start backend (see above)

2. **Check: Are there backend logs?**
   ```bash
   tail -f /tmp/blinkmail_backend.log
   ```
   - ✓ Yes (says "Received send request") → Go to step 3
   - ✗ No messages → Backend not receiving request from frontend

3. **Check: Is email verified in AWS?**
   - AWS Console → SES → Verified identities
   - Should show: `hello@undefstudio.live` with Status: `Verified`
   - ✓ Yes → Go to step 4
   - ✗ No → Verify now (see below)

4. **Check: Backend logs for SES errors**
   ```bash
   grep -i "error\|failed" /tmp/blinkmail_backend.log
   ```
   - ✓ All good → Emails should be sending
   - ✗ Has errors → See error codes below

---

## AWS SES Error Codes & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Email address is not verified` | Sender or recipient not verified | Verify in AWS SES Console |
| `MessageRejected` | Email content policy violation | Check email body, links, content |
| `InvalidParameterValue` | Invalid email format | Check email addresses for typos |
| `Throttling` | Rate limit exceeded | Space out emails, increase limit |
| `AccessDenied` | IAM permissions missing | Check AWS Access Key permissions |
| `InvalidClientTokenId` | Wrong AWS Access Key | Verify credentials in .env |

---

## Email Verification in AWS SES

### Verify Sender Email (hello@undefstudio.live):

1. Go to AWS Console
2. SES → Verified identities
3. Click "Create identity"
4. Type: Email address
5. Email: `hello@undefstudio.live`
6. Click "Create identity"
7. Check email inbox at hello@undefstudio.live
8. Click verification link from AWS
9. Status changes to "Verified" ✓

### Verify Recipient (if in Sandbox):

Repeat the same process for `palakshay071@gmail.com`

(Note: Only needed in Sandbox mode. In Production mode, you can send to any email.)

---

## Complete Email Sending Flow Verification

Run this complete test sequence:

```bash
# 1. Verify backend is running
echo "=== Test 1: Backend Health ==="
curl http://localhost:8000/health

# 2. Test direct email send
echo -e "\n=== Test 2: Direct Email Send ==="
curl -X POST http://localhost:8000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "palakshay071@gmail.com",
    "subject": "Test Email",
    "body": "<p>Test content</p>"
  }'

# 3. Check recent logs
echo -e "\n=== Test 3: Backend Logs ==="
tail -20 /tmp/blinkmail_backend.log
```

---

## Environment Variables Verification

```bash
# Check if env vars are set correctly
echo "AWS_REGION: ${AWS_REGION:?Not set}"
echo "AWS_SES_SENDER_EMAIL: ${AWS_SES_SENDER_EMAIL:?Not set}"
echo "AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:10}..."
echo "Backend: $(curl -s http://localhost:8000/health | grep status)"
```

---

## Performance Metrics

Expected performance (once verified):

- **1 email**: < 1 second
- **10 emails**: 2-5 seconds  
- **100 emails**: 10-30 seconds
- **1000 emails**: 2-5 minutes

If slower, check:
- Network latency to AWS
- AWS SES rate limits
- Backend CPU usage

---

## Success Criteria

Email sending is working when ALL of these are true:

✅ `curl http://localhost:8000/health` returns healthy
✅ Backend logs show "Email sent successfully"
✅ Email appears in recipient inbox
✅ Frontend shows success message
✅ Campaign status updates to "sent"
✅ No errors in logs

If any of these fail, refer to Troubleshooting section above.
