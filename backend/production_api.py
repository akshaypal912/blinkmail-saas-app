#!/usr/bin/env python3
"""
Production-Grade Email API with Brevo
Complete error handling, logging, and Brevo Transactional Email integration
"""
import os
import logging
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import asyncio
from dotenv import load_dotenv
from email_provider import get_email_provider

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="BlinkMail Production API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# CONFIG & SETUP
# ==============================================================================

EMAIL_PROVIDER_NAME = os.getenv("EMAIL_PROVIDER", "brevo")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "noreply@undefstudio.live")
BREVO_FROM_NAME = os.getenv("BREVO_FROM_NAME", "BlinkMail")

logger.info(f"Email Provider: {EMAIL_PROVIDER_NAME}")
logger.info(f"From Email: {BREVO_FROM_EMAIL}")
logger.info(f"From Name: {BREVO_FROM_NAME}")

# Warn if API key not set
if not BREVO_API_KEY:
    logger.warning("⚠️  BREVO_API_KEY environment variable not set. Email sending will fail.")

# Initialize Email Provider
email_provider = None
try:
    email_provider = get_email_provider(provider_name=EMAIL_PROVIDER_NAME, api_key=BREVO_API_KEY)
    health_check = email_provider.health_check()
    logger.info(f"✓ Email provider initialized successfully: {health_check}")
except Exception as e:
    logger.error(f"✗ Failed to initialize email provider: {e}")
    email_provider = None

# ==============================================================================
# MODELS
# ==============================================================================

class Recipient(BaseModel):
    id: str
    email: str
    first_name: str = ""
    last_name: str = ""

class SendCampaignRequest(BaseModel):
    campaign_id: str
    campaign_name: str
    subject_line: str
    from_email: str
    from_name: str
    html_content: str
    recipients: List[Recipient]

# ==============================================================================
# HEALTH CHECK
# ==============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "email_provider": EMAIL_PROVIDER_NAME,
        "provider_status": "ready" if email_provider else "NOT READY"
    }

# ==============================================================================
# EMAIL SENDING
# ==============================================================================

async def send_email_via_brevo(
    to_email: str,
    subject: str,
    html_body: str,
    from_email: str,
    from_name: str
) -> Dict:
    """
    Send email via Brevo Transactional Email API
    Returns detailed response or error info
    """
    if not email_provider:
        return {
            "status": "failed",
            "error": "Email provider not initialized",
            "email": to_email
        }

    try:
        logger.info(f"Sending email to: {to_email}")
        
        result = await email_provider.send_single_email(
            to_email=to_email,
            subject=subject,
            html_content=html_body,
            from_email=from_email,
            from_name=from_name
        )
        
        if result["status"] == "sent":
            logger.info(f"✓ Email sent successfully to {to_email} (MessageId: {result.get('message_id', 'unknown')})")
        else:
            logger.error(f"✗ Failed to send to {to_email}: {result.get('error')}")
        
        return result
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"✗ Brevo error for {to_email}: {error_msg}")
        
        # Check for common Brevo errors
        if "authentication" in error_msg.lower() or "401" in error_msg:
            logger.error("→ Invalid Brevo API key")
        elif "invalid email" in error_msg.lower():
            logger.error("→ Invalid email format")
        elif "429" in error_msg or "rate limit" in error_msg.lower():
            logger.error("→ Brevo rate limit exceeded, retrying later")
        
        return {"status": "failed", "email": to_email, "error": error_msg}

@app.post("/api/send-campaign")
async def send_campaign(request: SendCampaignRequest):
    """
    Send campaign emails to all recipients via Brevo
    Real implementation with detailed error reporting
    """
    logger.info(f"Received send request for campaign: {request.campaign_id}")
    logger.info(f"Recipients: {len(request.recipients)}, Sender: {request.from_email}")
    logger.info(f"HTML Content length: {len(request.html_content)} chars")
    logger.info(f"HTML Preview: {request.html_content[:200] if request.html_content else 'EMPTY'}")
    
    if not request.recipients:
        logger.error("No recipients provided")
        raise HTTPException(status_code=400, detail="No recipients provided")
    
    results = []
    sent_count = 0
    failed_count = 0
    
    # Send to each recipient
    for recipient in request.recipients:
        try:
            # Personalize content
            subject = request.subject_line.replace(
                "{first_name}", 
                recipient.first_name or "there"
            )
            
            html_content = request.html_content.replace(
                "{first_name}", 
                recipient.first_name or "there"
            ).replace(
                "{email}", 
                recipient.email
            )
            
            # Send email via Brevo
            result = await send_email_via_brevo(
                to_email=recipient.email,
                subject=subject,
                html_body=html_content,
                from_email=request.from_email,
                from_name=request.from_name
            )
            
            results.append(result)
            
            if result["status"] == "sent":
                sent_count += 1
            else:
                failed_count += 1
        
        except Exception as e:
            logger.error(f"Error sending to {recipient.email}: {str(e)}")
            results.append({
                "status": "failed",
                "email": recipient.email,
                "error": str(e)
            })
            failed_count += 1
    
    # Summary
    logger.info(f"Campaign {request.campaign_id} completed: {sent_count} sent, {failed_count} failed")
    
    return {
        "campaign_id": request.campaign_id,
        "campaign_name": request.campaign_name,
        "total_recipients": len(request.recipients),
        "sent": sent_count,
        "failed": failed_count,
        "timestamp": datetime.now().isoformat(),
        "details": results
    }

@app.post("/api/send-email")
async def send_single_email_endpoint(email: str, subject: str, body: str, from_email: str = ""):
    """Test endpoint to send a single email via Brevo"""
    logger.info(f"Test send to: {email}")
    
    sender_email = from_email or BREVO_FROM_EMAIL
    
    result = await send_email_via_brevo(
        to_email=email,
        subject=subject,
        html_body=body,
        from_email=sender_email,
        from_name=BREVO_FROM_NAME
    )
    
    if result["status"] == "failed":
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to send"))
    
    return result

# ==============================================================================
# MAIN
# ==============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting BlinkMail Production API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
