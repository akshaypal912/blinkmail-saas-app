# BlinkMail Pro - Email Sending Implementation Requirements

## What You Need to Provide

### 1. **AWS Account Setup** (for Amazon SES)
- [ ] AWS Account created
- [ ] AWS Access Key ID
- [ ] AWS Secret Access Key
- [ ] Preferred AWS Region (e.g., `us-east-1`)
- [ ] Sender email verified in AWS SES console (e.g., `noreply@yourdomain.com`)

**Where to get:**
- Create AWS account at https://aws.amazon.com
- Generate Access Keys in IAM console
- Verify sender email in SES console (Services → SES → Email Addresses)

### 2. **Redis Instance** (for task queue)
Choose ONE option:

**Option A: Local Redis** (Development)
- [ ] Redis installed locally (`brew install redis` on Mac)
- [ ] Redis running on default port 6379 OR custom port
- [ ] Connection URL: `redis://localhost:6379`

**Option B: Cloud Redis** (Production)
- [ ] Upstash Redis account (https://upstash.com)
- [ ] Redis connection URL (from Upstash dashboard)
- [ ] Example: `redis://default:password@host:port`

### 3. **Backend Server Configuration**
- [ ] Server URL where FastAPI will run (e.g., `http://localhost:8000`)
- [ ] Port number (default: 8000)
- [ ] CORS allowed origin (e.g., `http://localhost:3000` for local dev)

### 4. **Environment Variables**
Create a `.env.local` file in the backend directory with:

```env
# AWS SES Credentials
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_SES_SENDER_EMAIL=noreply@yourdomain.com

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Backend Configuration
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 5. **Database Permissions**
- [ ] Supabase service role key (with full database access)
- [ ] Read access to: campaigns, contacts, email_templates, campaign_recipients
- [ ] Write access to: campaign_recipients (to update sent/opened/bounced status)

### 6. **Email Sender Domain** (Optional but recommended)
For better deliverability:
- [ ] Custom domain for sending emails
- [ ] SPF record configured
- [ ] DKIM configured
- [ ] DMARC configured

---

## What I'll Build For You

### Frontend Changes
- [ ] "Send Campaign" button on campaign detail page
- [ ] Loading state and progress indicator
- [ ] Success/error notifications
- [ ] Send schedule form (immediate or scheduled)
- [ ] Campaign status tracking (Draft → Sending → Sent)

### Backend Setup (Python FastAPI)
```
backend/
├── main.py                 # FastAPI app
├── requirements.txt        # Python dependencies
├── .env.local             # Environment config
├── config.py              # Configuration
├── models.py              # Pydantic models
├── routes/
│   └── campaigns.py       # POST /api/campaigns/{id}/send
├── services/
│   ├── supabase_client.py # Supabase connection
│   ├── email_sender.py    # SES email logic
│   └── validator.py       # Email validation
├── workers/
│   └── celery_tasks.py    # Async email tasks
└── docker-compose.yml     # Redis + Celery setup (optional)
```

### What the Flow Will Be
1. User clicks "Send Campaign" button in dashboard
2. Frontend sends POST request to backend: `/api/campaigns/{campaign_id}/send`
3. Backend validates campaign and recipients
4. Creates Celery tasks for batch sending (100 emails per batch)
5. Redis queue distributes tasks to workers
6. Celery workers send emails via AWS SES (parallel)
7. Updates database with delivery status
8. Frontend receives real-time updates

---

## Quick Checklist for You

**Before we start, confirm you have:**

- [ ] AWS account with SES access
- [ ] AWS credentials (Access Key ID & Secret Key)
- [ ] Verified sender email in SES
- [ ] Redis instance (local or cloud)
- [ ] Redis connection URL
- [ ] Supabase service role key
- [ ] Preferred backend port (default: 8000)

**Once ready, just provide:**

```
AWS_ACCESS_KEY_ID: [your key]
AWS_SECRET_ACCESS_KEY: [your secret]
AWS_REGION: [e.g., us-east-1]
AWS_SES_SENDER_EMAIL: [verified email]
REDIS_URL: [connection string]
SUPABASE_SERVICE_ROLE_KEY: [key]
SUPABASE_URL: [your supabase URL]
```

---

## Implementation Order

1. **Backend Setup** - FastAPI + Supabase client
2. **SES Integration** - Send test email via AWS
3. **Redis + Celery** - Set up queue and workers
4. **Batch Sending** - Implement parallel email sending
5. **Frontend Button** - Add "Send Campaign" action
6. **Status Tracking** - Monitor delivery in real-time
7. **Error Handling** - Manage bounces, failures, retries
