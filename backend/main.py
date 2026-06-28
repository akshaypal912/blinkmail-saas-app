from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

from config import settings
from database import get_supabase_client
from email_service import send_campaign_emails
from models import CampaignSendRequest, EmailRecipient, CampaignStatus

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BlinkMail Pro - Email Service",
    description="FastAPI backend for BlinkMail Pro email campaigns",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Get campaign details
@app.get("/api/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details from Supabase"""
    try:
        supabase = get_supabase_client()
        campaign = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
        return campaign.data
    except Exception as e:
        logger.error(f"Error fetching campaign: {str(e)}")
        raise HTTPException(status_code=404, detail="Campaign not found")

# Send campaign emails
@app.post("/api/campaigns/{campaign_id}/send")
async def send_campaign(campaign_id: str, background_tasks: BackgroundTasks):
    """
    Send campaign emails in parallel batches using Celery workers
    """
    try:
        supabase = get_supabase_client()
        
        # Get campaign details
        campaign = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
        campaign_data = campaign.data
        
        if not campaign_data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Get email template
        template = supabase.table("email_templates").select("*").eq("campaign_id", campaign_id).single().execute()
        template_data = template.data
        
        # Get recipients
        recipients = supabase.table("campaign_recipients").select(
            "id, contact_id, contacts(email, first_name, last_name)"
        ).eq("campaign_id", campaign_id).eq("status", "pending").execute()
        
        if not recipients.data:
            raise HTTPException(status_code=400, detail="No pending recipients found")
        
        # Update campaign status
        supabase.table("campaigns").update({
            "status": "sending",
            "updated_at": datetime.now().isoformat()
        }).eq("id", campaign_id).execute()
        
        # Send emails in background using Celery
        background_tasks.add_task(
            send_campaign_emails,
            campaign_id=campaign_id,
            recipients=recipients.data,
            template=template_data,
            campaign=campaign_data
        )
        
        return {
            "status": "sending",
            "campaign_id": campaign_id,
            "total_recipients": len(recipients.data),
            "message": "Campaign emails are being sent in parallel batches"
        }
    
    except Exception as e:
        logger.error(f"Error sending campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Get campaign send status
@app.get("/api/campaigns/{campaign_id}/status")
async def get_campaign_status(campaign_id: str):
    """Get real-time campaign send status"""
    try:
        supabase = get_supabase_client()
        
        # Get campaign
        campaign = supabase.table("campaigns").select("*").eq("id", campaign_id).single().execute()
        
        # Get recipient stats
        recipients = supabase.table("campaign_recipients").select("status").eq("campaign_id", campaign_id).execute()
        
        stats = {
            "pending": sum(1 for r in recipients.data if r["status"] == "pending"),
            "sent": sum(1 for r in recipients.data if r["status"] == "sent"),
            "delivered": sum(1 for r in recipients.data if r["status"] == "delivered"),
            "bounced": sum(1 for r in recipients.data if r["status"] == "bounced"),
            "complained": sum(1 for r in recipients.data if r["status"] == "complained"),
            "unsubscribed": sum(1 for r in recipients.data if r["status"] == "unsubscribed"),
        }
        
        return {
            "campaign_id": campaign_id,
            "status": campaign.data["status"],
            "statistics": stats,
            "total": len(recipients.data)
        }
    
    except Exception as e:
        logger.error(f"Error fetching campaign status: {str(e)}")
        raise HTTPException(status_code=404, detail="Campaign not found")

# Get email logs
@app.get("/api/campaigns/{campaign_id}/logs")
async def get_campaign_logs(campaign_id: str, limit: int = 50, offset: int = 0):
    """Get email send logs for a campaign"""
    try:
        supabase = get_supabase_client()
        
        logs = supabase.table("campaign_recipients").select(
            "id, status, sent_at, delivered_at, bounced_at, contacts(email)"
        ).eq("campaign_id", campaign_id).order("created_at", desc=True).range(offset, offset + limit).execute()
        
        return {
            "campaign_id": campaign_id,
            "logs": logs.data,
            "count": len(logs.data)
        }
    
    except Exception as e:
        logger.error(f"Error fetching logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Test email endpoint
@app.post("/api/test-email")
async def test_email(email: EmailStr):
    """Send a test email to verify configuration"""
    try:
        from email_service import send_single_email
        
        result = await send_single_email(
            to_email=email,
            subject="BlinkMail Pro - Test Email",
            html_content="<h1>Test</h1><p>If you received this, BlinkMail Pro is working!</p>"
        )
        
        return {
            "status": "success",
            "message": f"Test email sent to {email}",
            "message_id": result.get("MessageId")
        }
    
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.FASTAPI_HOST,
        port=settings.FASTAPI_PORT,
        reload=settings.FASTAPI_DEBUG
    )
