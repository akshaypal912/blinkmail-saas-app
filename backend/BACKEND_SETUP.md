# BlinkMail Pro - Backend Setup Guide

## Architecture Overview

```
Frontend (Next.js)
    ↓
FastAPI Backend (Email Service)
    ↓
Celery Workers (Parallel Email Batches)
    ↓
Redis/Upstash Queue
    ↓
AWS SES (Email Sending)
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Environment File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your values:

```
AWS_ACCESS_KEY_ID=AKIAQQOY4S7ORU2ZMY42
AWS_SECRET_ACCESS_KEY=vDm4FbdKNkdvmxUAIE768Ow2l1/MAFUEivjR2pPg
AWS_REGION=ap-south-1
AWS_SES_SENDER_EMAIL=hello@undefstudio.live
SUPABASE_URL=https://xelmbawclsfkvtzdtojy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### 3. Start FastAPI Backend

```bash
python main.py
```

The backend will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 4. Start Celery Worker (in another terminal)

```bash
python run_worker.py
```

This starts 4 concurrent workers for parallel email processing.

## API Endpoints

### Send Campaign

**POST** `/api/campaigns/{campaign_id}/send`

Sends all pending emails in the campaign using parallel Celery workers.

```bash
curl -X POST http://localhost:8000/api/campaigns/123/send
```

Response:
```json
{
  "status": "sending",
  "campaign_id": "123",
  "total_recipients": 100,
  "message": "Campaign emails are being sent in parallel batches"
}
```

### Get Campaign Status

**GET** `/api/campaigns/{campaign_id}/status`

Get real-time status of campaign sends.

```bash
curl http://localhost:8000/api/campaigns/123/status
```

Response:
```json
{
  "campaign_id": "123",
  "status": "sending",
  "statistics": {
    "pending": 0,
    "sent": 50,
    "delivered": 45,
    "bounced": 2,
    "complained": 0,
    "unsubscribed": 0
  },
  "total": 100
}
```

### Get Campaign Logs

**GET** `/api/campaigns/{campaign_id}/logs?limit=50&offset=0`

Get email send logs for a campaign.

```bash
curl http://localhost:8000/api/campaigns/123/logs
```

### Test Email

**POST** `/api/test-email`

Send a test email to verify SES configuration.

```bash
curl -X POST http://localhost:8000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## How It Works

### Parallel Batch Processing

1. **Frontend** sends request to send campaign
2. **FastAPI** fetches all recipients (e.g., 1000 emails)
3. **Backend** splits into batches (50 emails per batch = 20 batches)
4. **Celery** queues 20 parallel tasks in Redis
5. **4 Workers** process batches concurrently
   - Worker 1: Batch 1-5 (250 emails)
   - Worker 2: Batch 6-10 (250 emails)
   - Worker 3: Batch 11-15 (250 emails)
   - Worker 4: Batch 16-20 (250 emails)
6. **AWS SES** sends emails from each batch
7. **Database** updates recipient status in real-time

### Result: 1000 emails sent in ~15-30 seconds

## Configuration

### Adjust Batch Size

Edit `backend/config.py`:
```python
MAX_BATCH_SIZE: int = 50  # Emails per batch (default 50)
MAX_CONCURRENT_BATCHES: int = 4  # Parallel workers (default 4)
```

Increase `MAX_CONCURRENT_BATCHES` for faster sending (uses more resources).

## Environment Variables Explained

| Variable | Purpose |
|----------|---------|
| `AWS_ACCESS_KEY_ID` | AWS authentication |
| `AWS_SECRET_ACCESS_KEY` | AWS authentication |
| `AWS_REGION` | AWS region where SES is verified |
| `AWS_SES_SENDER_EMAIL` | Email address to send from |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for backend access |
| `UPSTASH_REDIS_REST_URL` | Redis broker URL |
| `UPSTASH_REDIS_REST_TOKEN` | Redis authentication |

## Monitoring

### View Celery Tasks

```bash
# In another terminal
python -m celery -A celery_app events
```

### View Logs

```bash
# Backend logs show request/response
# Worker logs show email sending details

# Monitor specific campaign
tail -f backend.log | grep "campaign_id"
```

## Troubleshooting

### "Failed to authenticate with AWS SES"
- Check AWS credentials
- Verify region matches where SES is set up
- Ensure sender email is verified in AWS SES

### "Connection refused to Redis"
- Check Upstash credentials
- Verify Redis URL format

### "Supabase authentication failed"
- Verify service role key (not anon key)
- Check Supabase URL

### Emails not being sent
- Check Celery worker is running: `python run_worker.py`
- View worker logs for errors
- Verify recipients exist in database
- Check email template is valid

## Performance Tuning

For **100 emails in parallel:**
- Increase `MAX_CONCURRENT_BATCHES` to 8-10
- Keep `MAX_BATCH_SIZE` at 50 (AWS SES best practice)
- Deploy workers on separate servers for true horizontal scaling

## Security Notes

- **NEVER** commit `.env` file to git
- Service role key is for backend only (has write access)
- AWS credentials should have minimal IAM permissions
- Enable CloudTrail logging for AWS SES requests
