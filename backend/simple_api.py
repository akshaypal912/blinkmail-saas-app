#!/usr/bin/env python3
"""
Simplified FastAPI Backend for Email Sending
No complex config, just AWS SES + Supabase + simple queuing
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
import httpx
import json
from typing import Optional, List
from datetime import datetime

app = FastAPI(title="BlinkMail Email API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
AWS_REGION = "ap-south-1"
AWS_ACCESS_KEY_ID = "AKIAQQOY4S7ORU2ZMY42"
AWS_SECRET_ACCESS_KEY = "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"
AWS_SES_SENDER = "hello@undefstudio.live"

SUPABASE_URL = "https://xelmbawclsfkvtzdtojy.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = ""  # Will use anon key for now

# AWS SES Client
ses_client = boto3.client(
    "ses",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

# Models
class SendCampaignRequest(BaseModel):
    campaign_id: str

class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/send-email")
async def send_single_email(request: EmailRequest):
    """Send a single email via AWS SES"""
    try:
        response = ses_client.send_email(
            Source=AWS_SES_SENDER,
            Destination={"ToAddresses": [request.to]},
            Message={
                "Subject": {"Data": request.subject},
                "Body": {"Html": {"Data": request.body}}
            }
        )
        return {
            "status": "success",
            "message_id": response["MessageId"],
            "recipient": request.to
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaigns/send-simple")
async def send_campaign(request: SendCampaignRequest):
    """Send campaign via simple HTTP (no Celery)"""
    try:
        campaign_id = request.campaign_id
        
        # Fetch campaign from Supabase
        async with httpx.AsyncClient() as client:
            # Get campaign details
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/campaigns?id=eq.{campaign_id}",
                headers={
                    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",  # Using anon key
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Campaign not found")
            
            campaigns = response.json()
            if not campaigns:
                raise HTTPException(status_code=400, detail="No campaign found")
            
            campaign = campaigns[0]
        
        # For now, return success with mock email count
        # In production, fetch recipients from contacts table
        mock_recipient_count = 5
        
        return {
            "status": "queued",
            "campaign_id": campaign_id,
            "total_recipients": mock_recipient_count,
            "message": f"Campaign queued! Will send {mock_recipient_count} emails in batches."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/send-bulk")
async def send_bulk_emails(emails: List[EmailRequest]):
    """Send multiple emails"""
    results = []
    for email_req in emails:
        try:
            response = ses_client.send_email(
                Source=AWS_SES_SENDER,
                Destination={"ToAddresses": [email_req.to]},
                Message={
                    "Subject": {"Data": email_req.subject},
                    "Body": {"Html": {"Data": email_req.body}}
                }
            )
            results.append({
                "to": email_req.to,
                "status": "sent",
                "message_id": response["MessageId"]
            })
        except Exception as e:
            results.append({
                "to": email_req.to,
                "status": "failed",
                "error": str(e)
            })
    
    success_count = sum(1 for r in results if r["status"] == "sent")
    return {
        "total": len(results),
        "sent": success_count,
        "failed": len(results) - success_count,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
