# BlinkMail Pro Architecture Overview

## Email Sending Flow (Post-Migration)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                  http://localhost:3000                          │
│                                                                 │
│  - Campaign creation form                                      │
│  - CSV upload for recipients                                   │
│  - Send campaign button                                        │
│  - Campaign status display                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Request
                           │ POST /api/campaigns/send-simple
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes (Next.js)                        │
│              app/api/campaigns/send-simple/route.ts            │
│                                                                 │
│  - Validate campaign data                                      │
│  - Format email recipients                                     │
│  - Call backend API                                            │
│  - Update campaign status in Supabase                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Request
                           │ POST http://localhost:8000/api/send-campaign
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI/Python)                      │
│              http://localhost:8000                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ production_api.py                                        │  │
│  │                                                          │  │
│  │  POST /api/send-campaign                                │  │
│  │  ├─ Validate recipients                                 │  │
│  │  ├─ For each recipient:                                 │  │
│  │  │  ├─ Personalize subject & content                    │  │
│  │  │  ├─ Call: send_email_via_brevo()                     │  │
│  │  │  └─ Collect results                                  │  │
│  │  └─ Return summary (sent/failed counts)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ email_service.py                                         │  │
│  │                                                          │  │
│  │  send_single_email()                                    │  │
│  │  ├─ Call email_provider.send_single_email()            │  │
│  │  ├─ Handle response                                     │  │
│  │  └─ Return result                                       │  │
│  │                                                          │  │
│  │  send_email_batch()                                     │  │
│  │  ├─ Batch multiple emails                              │  │
│  │  ├─ Parallel processing (Celery)                        │  │
│  │  └─ Track sent/failed                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ email_provider.py (ABSTRACTION LAYER)                  │  │
│  │                                                          │  │
│  │  EmailProvider (ABC)                                    │  │
│  │  ├─ send_single_email(abstract)                         │  │
│  │  ├─ send_batch(abstract)                                │  │
│  │  └─ health_check(abstract)                              │  │
│  │                                                          │  │
│  │  BrevoEmailProvider                                     │  │
│  │  ├─ send_single_email(to_email, subject, html...)       │  │
│  │  ├─ send_batch(recipients, subject, html...)            │  │
│  │  └─ health_check()                                      │  │
│  │                                                          │  │
│  │  Future Providers:                                      │  │
│  │  ├─ SendGridEmailProvider                               │  │
│  │  ├─ MailgunEmailProvider                                │  │
│  │  └─ SparkPostEmailProvider                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│         BREVO TRANSACTIONAL EMAIL API                          │
│         https://api.brevo.com/v3/smtp/email                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    📧 Email Delivered
                    to recipient inbox
```

## Class Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 EmailProvider (ABC)                         │
│                                                             │
│  Abstract Base Class                                        │
│  ├─ @abstractmethod send_single_email()                     │
│  ├─ @abstractmethod send_batch()                            │
│  └─ @abstractmethod health_check()                          │
│                                                             │
│  Purpose: Define interface for any email provider           │
│  Allows: Easy switching between providers                   │
│  Pattern: Strategy pattern for email sending                │
└────────────┬────────────────────────────────────────────────┘
             │
             │ Implements
             ▼
┌─────────────────────────────────────────────────────────────┐
│            BrevoEmailProvider(EmailProvider)                │
│                                                             │
│  Concrete Implementation                                    │
│  ├─ __init__(api_key)                                       │
│  │  └─ httpx.AsyncClient with Brevo headers                │
│  │                                                         │
│  ├─ async send_single_email(...)                            │
│  │  └─ POST to https://api.brevo.com/v3/smtp/email         │
│  │     Returns: {status, message_id, timestamp}            │
│  │                                                         │
│  ├─ async send_batch(...)                                   │
│  │  └─ POST to https://api.brevo.com/v3/smtp/email         │
│  │     Returns: {status, recipients, message_ids}          │
│  │                                                         │
│  ├─ health_check()                                          │
│  │  └─ Returns provider status                             │
│  │                                                         │
│  └─ async close()                                           │
│     └─ Cleanup httpx client                                │
│                                                             │
│  Error Handling:                                            │
│  ├─ 401: Invalid API key                                    │
│  ├─ 400: Invalid email format                               │
│  ├─ 429: Rate limit exceeded                                │
│  └─ Others: Logged and returned                             │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
┌──────────────────────────────────────────────────────────┐
│            Environment Variables (.env)                  │
│                                                          │
│  EMAIL_PROVIDER=brevo                                    │
│  BREVO_API_KEY=abc123xyz...                              │
│  BREVO_FROM_EMAIL=noreply@undefstudio.live              │
│  BREVO_FROM_NAME=BlinkMail                              │
│  ... other settings ...                                 │
└─────────────────────┬──────────────────────────────────┘
                      │ Loaded by
                      ▼
┌──────────────────────────────────────────────────────────┐
│        config.py (Settings Class)                        │
│                                                          │
│  class Settings(BaseSettings):                           │
│    EMAIL_PROVIDER: str = "brevo"                         │
│    BREVO_API_KEY: str                                    │
│    BREVO_FROM_EMAIL: str                                 │
│    BREVO_FROM_NAME: str                                  │
│    ... validation ...                                   │
│                                                          │
│  settings = Settings()  # Validates on startup           │
└─────────────────────┬──────────────────────────────────┘
                      │ Used by
                      ▼
┌──────────────────────────────────────────────────────────┐
│     get_email_provider(provider_name, api_key)           │
│                                                          │
│  Factory Function                                        │
│  ├─ Reads settings from environment                      │
│  ├─ Validates provider type                              │
│  ├─ Returns appropriate provider instance                │
│  └─ Raises error if invalid                              │
│                                                          │
│  Returns: EmailProvider instance (BrevoEmailProvider)    │
└──────────────────────────────────────────────────────────┘
```

## Email Sending Process (Detailed)

```
1. FRONTEND INITIATES
   └─ User clicks "Send Campaign"
   └─ POST /api/campaigns/send-simple
   └─ Includes: campaign_id, recipients, template

2. NEXT.JS API ROUTE VALIDATES
   └─ Validate campaign exists
   └─ Validate recipients (email format)
   └─ Format data for backend
   └─ Update Supabase: status = "sending"

3. CALL BACKEND API
   └─ POST http://localhost:8000/api/send-campaign
   └─ Send recipients list
   └─ Send email template
   └─ Send sender info

4. FASTAPI ENDPOINT (production_api.py)
   └─ Validate request
   └─ For each recipient:
      └─ Personalize subject
      └─ Personalize HTML content
      └─ Call send_email_via_brevo()

5. SEND VIA BREVO FUNCTION
   └─ Check if provider initialized
   └─ Call: email_provider.send_single_email()
   └─ Await response
   └─ Log result

6. EMAIL PROVIDER SENDS
   └─ Format Brevo API payload
   └─ POST https://api.brevo.com/v3/smtp/email
   └─ Headers: api-key, content-type
   └─ Body: sender, to, subject, htmlContent
   └─ Await response

7. BREVO API PROCESSES
   └─ Validate sender email
   └─ Validate recipient email
   └─ Queue for delivery
   └─ Return: messageId

8. RESPONSE FLOWS BACK
   └─ Provider returns: {status: "sent", message_id: "..."}
   └─ FastAPI endpoint collects results
   └─ Returns summary: {sent: N, failed: M}

9. FRONTEND UPDATES
   └─ Next.js receives response
   └─ Updates Supabase: status = "sent", sent_count = N
   └─ UI shows campaign status
   └─ User sees success message

10. EMAIL DELIVERY
    └─ Brevo sends via SMTP
    └─ Email arrives in recipient inbox
    └─ Delivery tracking via webhooks (optional)
```

## Data Flow

```
Input: Campaign Request
├─ campaign_id: "123"
├─ campaign_name: "Newsletter"
├─ subject_line: "Hello {first_name}"
├─ from_email: "sender@example.com"
├─ from_name: "Sender Name"
├─ html_content: "<h1>Hi {first_name}</h1>"
└─ recipients:
   ├─ {id: "1", email: "a@test.com", first_name: "Alice"}
   └─ {id: "2", email: "b@test.com", first_name: "Bob"}

Processing: Backend
├─ For recipient 1:
│  ├─ subject: "Hello Alice"
│  ├─ html: "<h1>Hi Alice</h1>"
│  └─ email: "a@test.com"
│
└─ For recipient 2:
   ├─ subject: "Hello Bob"
   ├─ html: "<h1>Hi Bob</h1>"
   └─ email: "b@test.com"

Output: Campaign Result
├─ campaign_id: "123"
├─ total_recipients: 2
├─ sent: 2
├─ failed: 0
├─ timestamp: "2024-06-30T10:30:00"
└─ details: [
    {status: "sent", email: "a@test.com", message_id: "..."},
    {status: "sent", email: "b@test.com", message_id: "..."}
  ]

Database Update: Supabase
├─ campaigns table:
│  └─ UPDATE status = "sent", sent_count = 2, failed_count = 0
│
└─ contacts table:
   ├─ UPDATE contact 1: status = "sent"
   └─ UPDATE contact 2: status = "sent"
```

## Error Handling Flow

```
Error Scenarios
│
├─ Invalid API Key
│  └─ Caught: BrevoEmailProvider.__init__()
│  └─ Raised: ValueError("BREVO_API_KEY is required")
│  └─ Logged: ✗ Failed to initialize email provider
│  └─ User sees: "Backend not ready"
│
├─ Invalid Email Format
│  └─ Caught: Brevo API returns 400
│  └─ Logged: ✗ Brevo error for user@invalid: invalid email
│  └─ Response: {status: "failed", error: "invalid email"}
│  └─ Count: Added to failed_count
│
├─ Rate Limited
│  └─ Caught: Brevo API returns 429
│  └─ Logged: ✗ Brevo error: 429 rate limit exceeded
│  └─ Count: Added to failed_count
│  └─ Retry: Automatic via Celery (configurable)
│
├─ Network Error
│  └─ Caught: httpx timeout/connection error
│  └─ Logged: ✗ Failed to send email to user@test.com
│  └─ Response: {status: "failed", error: "network error"}
│  └─ Count: Added to failed_count
│
└─ Provider Initialization Failed
   └─ Email provider = None
   └─ All sends return: {status: "failed", error: "provider not initialized"}
   └─ Health check shows: provider_status = "NOT READY"
```

## Modular Provider Architecture Benefits

```
┌─────────────────────────────────────────────────────────┐
│          SWITCHING PROVIDERS (Future)                   │
│                                                         │
│  Current: EMAIL_PROVIDER=brevo                          │
│                                                         │
│  To switch to SendGrid:                                │
│  ├─ Add SendGridEmailProvider class                     │
│  ├─ Update config.py for SENDGRID_API_KEY              │
│  ├─ Change: EMAIL_PROVIDER=sendgrid                    │
│  ├─ Change: SENDGRID_API_KEY=xyz                       │
│  └─ NO CODE CHANGES needed elsewhere!                  │
│                                                         │
│  To switch back to Brevo:                              │
│  └─ Change: EMAIL_PROVIDER=brevo                       │
│  └─ Done! (All existing code still works)              │
│                                                         │
│  Benefits:                                              │
│  ✅ Zero downtime switching                             │
│  ✅ Easy A/B testing providers                          │
│  ✅ Gradual migration between providers                 │
│  ✅ Fallback provider on outage                         │
│  ✅ No refactoring needed                               │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Production Environment                │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Environment Variables (from platform)            │ │
│  │                                                  │ │
│  │ EMAIL_PROVIDER=brevo                            │ │
│  │ BREVO_API_KEY=***secret***                       │ │
│  │ BREVO_FROM_EMAIL=noreply@company.com             │ │
│  │ BREVO_FROM_NAME=Company                          │ │
│  │ ... other settings ...                           │ │
│  └──────────────────────────────────────────────────┘ │
│                        │                               │
│                        ▼                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │ FastAPI Backend (production_api.py)              │ │
│  │ ├─ Port: 8000                                    │ │
│  │ ├─ Workers: 4 (via gunicorn/uvicorn)            │ │
│  │ └─ Health check: /health                        │ │
│  └──────────────────────────────────────────────────┘ │
│                        │                               │
│                        ├─ Uses: email_provider.py     │
│                        ├─ Calls: BrevoEmailProvider   │
│                        └─ Logs: CloudWatch/Papertrail │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Celery Workers (optional, for large scale)       │ │
│  │ ├─ Broker: Redis/RabbitMQ                        │ │
│  │ ├─ Concurrency: 4 workers                        │ │
│  │ └─ Task: send_email_batch_task                   │ │
│  └──────────────────────────────────────────────────┘ │
│                        │                               │
└────────────────────────┼───────────────────────────────┘
                         │
                         ├─ Health checks: /health
                         ├─ Metrics: sent/failed counts
                         ├─ Logs: application logs
                         └─ Monitoring: uptime tracking
```

## Technology Stack

```
Frontend Layer:
├─ Next.js 16 (App Router)
├─ React 19
├─ TypeScript
├─ Tailwind CSS
└─ Supabase client

Backend Layer:
├─ FastAPI (Python)
├─ Uvicorn (ASGI server)
├─ Pydantic (validation)
├─ httpx (async HTTP)
└─ Celery (optional, task queue)

Email Layer:
├─ EmailProvider abstraction
├─ BrevoEmailProvider (Brevo REST API)
└─ Transactional Email API

Data Layer:
├─ Supabase (PostgreSQL)
├─ JWT authentication
├─ Row-level security
└─ Real-time subscriptions

Optional Services:
├─ Celery (background tasks)
├─ Redis/Upstash (caching/queue)
├─ Brevo webhooks (delivery tracking)
└─ Sentry (error tracking)
```

---

## Key Points

✅ **Modular Design**: Easy to swap email providers
✅ **Async Operations**: Non-blocking email sends
✅ **Error Resilience**: Handles failures gracefully
✅ **Scalable**: Supports thousands of emails
✅ **Maintainable**: Clear separation of concerns
✅ **Testable**: Each layer can be tested independently
✅ **Observable**: Comprehensive logging
✅ **Future-Proof**: Ready for other providers

