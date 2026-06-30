# Campaign Status Workflow - Complete Guide

## Campaign Statuses

Your BlinkMail Pro uses 4 campaign statuses:

### 1. DRAFT (Gray Badge)
- **When**: Immediately after campaign creation
- **What it means**: Campaign is being edited, not yet ready to send
- **User actions**: Edit campaign details, design email, add recipients
- **Can send?**: NO - Send button is disabled
- **Next status**: Ready to send (after editing complete)

### 2. SENDING (Orange Badge)
- **When**: While emails are actively being sent to recipients
- **What it means**: Backend is processing and sending emails
- **Duration**: Usually 10-30 seconds depending on recipient count
- **Can send?**: NO - Cannot send again while sending
- **Next status**: SENT (when all emails processed)

### 3. SENT (Green Badge)
- **When**: After all recipient emails have been processed
- **What it means**: Campaign completed, emails delivered or failed
- **Shows counts**: "X sent • Y failed"
- **Can send?**: NO - Campaign already sent
- **What failed means**: Some recipients weren't verified in AWS SES Sandbox

### 4. FAILED (Red Badge)
- **When**: If backend couldn't send any emails
- **What it means**: Technical error prevented sending
- **Can send?**: NO - Must troubleshoot first

## Expected Workflow

```
User creates campaign
         ↓
Campaign Status: DRAFT (gray badge)
         ↓
User edits campaign (add subject, from email, design)
         ↓
User clicks "Send Campaign"
         ↓
Campaign Status: SENDING (orange badge, rotating)
         ↓ (10-30 seconds later)
Backend completes sending
         ↓
Campaign Status: SENT (green badge with counts)
```

## What You Should See

### When Creating Campaign
- Form opens: "Create New Campaign"
- Fill in: Name, Subject, From Email, From Name
- Click: "Create Campaign"
- Result: Campaign created with status **DRAFT**

### In Campaigns List (After Creation)
- New campaign appears at top
- Status badge shows: **Draft** (gray)
- Send button is DISABLED (grayed out)
- Edit button available

### After Clicking "Send" (Detail Page)
- Status badge changes to: **Sending...** (orange, rotating)
- Message shows: "Campaign queued! Sending X emails..."
- Retry logic: Automatically retries 3 times if backend fails

### After Emails Sent
- Status badge changes to: **Sent** (green)
- Shows counts: "X sent • Y failed"
- Details: Which emails succeeded/failed
- Send button becomes DISABLED

## Common Scenarios

### Scenario 1: "I see DRAFT but clicking Send doesn't work"
**Reason**: Campaign must be edited first (add template/recipients)
**Solution**: Click Edit button → Add email template → Return to campaign page

### Scenario 2: "Status shows SENDING but nothing happens"
**Reason**: Either still processing or backend is slow
**Solution**: Wait 30 seconds, then refresh page
**If still stuck**: Backend might be down, check logs: `tail -f /tmp/blinkmail_backend.log`

### Scenario 3: "Shows SENT but I didn't get emails"
**Reason**: Recipient email not verified in AWS SES Sandbox
**Solution**: Request Production Access to send to any email
**Or**: Verify specific recipient emails in AWS SES Console

### Scenario 4: "Shows FAILED"
**Reason**: Backend error or connection issue
**Solution**: Check backend health: `curl http://localhost:8000/health`
**Then**: Restart backend: `bash /vercel/share/v0-project/backend/start_backend.sh &`

## Files Changed

1. **`/app/(dashboard)/dashboard/campaigns/page.tsx`**
   - Better status badge colors (gray=draft, orange=sending, green=sent, red=failed)
   - Disabled send button for draft/sent/sending campaigns
   - Added helpful tooltips

2. **`/app/(dashboard)/dashboard/campaigns/[id]/page.tsx`**
   - Better status display in header
   - Proper badge colors
   - Human-readable status labels

## Status Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ User Creates Campaign                           │
└────────────────────┬────────────────────────────┘
                     ↓
          Status: DRAFT (Gray Badge)
          Send button: DISABLED
                     ↓
┌─────────────────────────────────────────────────┐
│ User Edits Campaign (Add template, recipients)  │
└────────────────────┬────────────────────────────┘
                     ↓
       ┌─────────────────────────────┐
       │  Campaign Ready to Send?    │
       │  - Has template? YES        │
       │  - Has recipients? YES      │
       │  - From email set? YES      │
       └──────────┬──────────────────┘
                  ↓
      Status: Still DRAFT (Gray Badge)
      Send button: ENABLED
                  ↓
      ┌──────────────────────────┐
      │ User Clicks "Send"       │
      └────────────┬─────────────┘
                   ↓
         Status: SENDING (Orange Badge)
         Send button: DISABLED
         Shows: "Campaign queued..."
                   ↓ (10-30 seconds)
         Backend processes all emails
                   ↓
         Status: SENT (Green Badge)
         Shows: "X sent • Y failed"
         Send button: DISABLED
```

## Tips for Success

1. **Always wait for SENT status** - Don't refresh too quickly
2. **Check backend health** - If SENDING gets stuck, check: `curl http://localhost:8000/health`
3. **Monitor logs** - Use: `tail -f /tmp/blinkmail_backend.log`
4. **Request Production Access** - To send to all users, not just verified
5. **Use Health Check** - `curl http://localhost:3000/api/health/backend`

## FAQ

**Q: Why is my campaign stuck on SENDING?**
A: Check if backend is running. If not, start it: `bash /vercel/share/v0-project/backend/start_backend.sh &`

**Q: Can I send the same campaign twice?**
A: No, once sent (SENT status), campaigns cannot be resent. Create a new campaign instead.

**Q: Why do some emails fail?**
A: They're not verified in AWS SES. Either verify them individually or request Production Access.

**Q: How do I know if backend is healthy?**
A: `curl http://localhost:3000/api/health/backend` or `curl http://localhost:8000/health`

**Q: What does "X failed" mean?**
A: Those recipients' emails weren't verified in AWS SES Sandbox mode.

