#!/usr/bin/env python3
"""
Production-Grade Email API with AWS SES
Complete error handling, logging, and SES integration
"""
import os
import boto3
import logging
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import asyncio

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

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
# Use SES_FROM_EMAIL environment variable (required - no default)
AWS_SENDER = os.getenv("SES_FROM_EMAIL", "")
AWS_SENDER_NAME = os.getenv("SES_FROM_NAME", "BlinkMail")

logger.info(f"AWS Region: {AWS_REGION}")
logger.info(f"AWS Sender Email: {AWS_SENDER if AWS_SENDER else 'NOT SET (will use campaign from_email)'}")
logger.info(f"AWS Sender Name: {AWS_SENDER_NAME}")

# Warn if SES_FROM_EMAIL not set
if not AWS_SENDER:
    logger.warning("⚠️  SES_FROM_EMAIL environment variable not set. Will use campaign from_email instead.")

# Initialize AWS SES
try:
    ses_client = boto3.client(
        "ses",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY
    )
    logger.info("✓ AWS SES client initialized successfully")
except Exception as e:
    logger.error(f"✗ Failed to initialize AWS SES: {e}")
    ses_client = None

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
        "ses_client": "ready" if ses_client else "NOT READY"
    }

# ==============================================================================
# EMAIL SENDING
# ==============================================================================

async def send_email_via_ses(
    to_email: str,
    subject: str,
    html_body: str,
    from_email: str,
    from_name: str
) -> Dict:
    """
    Send email via AWS SES
    Returns detailed response or error info
    """
    if not ses_client:
        return {
            "status": "failed",
            "error": "SES client not initialized",
            "email": to_email
        }

    try:
        logger.info(f"Sending email to: {to_email}")
        
        response = ses_client.send_email(
            Source=f"{from_name} <{from_email}>" if from_name else from_email,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}}
            }
        )
        
        message_id = response.get("MessageId", "unknown")
        logger.info(f"✓ Email sent successfully to {to_email} (MessageId: {message_id})")
        
        return {
            "status": "sent",
            "email": to_email,
            "message_id": message_id,
            "timestamp": datetime.now().isoformat()
        }
    
    except ses_client.exceptions.MessageRejected as e:
        error_msg = f"Message rejected by SES: {str(e)}"
        logger.error(f"✗ {error_msg}")
        return {"status": "failed", "email": to_email, "error": error_msg}
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"✗ SES error for {to_email}: {error_msg}")
        
        # Check for common SES errors
        if "MessageRejected" in str(type(e)):
            logger.error("→ Email address may not be verified in AWS SES")
        elif "InvalidParameterValue" in str(type(e)):
            logger.error("→ Invalid email format or SES configuration")
        elif "Throttling" in error_msg:
            logger.error("→ SES rate limit exceeded, retrying later")
        
        return {"status": "failed", "email": to_email, "error": error_msg}

@app.post("/api/send-campaign")
async def send_campaign(request: SendCampaignRequest):
    """
    Send campaign emails to all recipients
    Real implementation with detailed error reporting
    """
    logger.info(f"Received send request for campaign: {request.campaign_id}")
    logger.info(f"Recipients: {len(request.recipients)}, Sender: {request.from_email}")
    
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
            
            # Send email
            result = await send_email_via_ses(
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
async def send_single_email(email: str, subject: str, body: str, from_email: str = ""):
    """Test endpoint to send a single email"""
    logger.info(f"Test send to: {email}")
    
    sender_email = from_email or AWS_SENDER or "noreply@undefstudio.live"
    
    result = await send_email_via_ses(
        to_email=email,
        subject=subject,
        html_body=body,
        from_email=sender_email,
        from_name=AWS_SENDER_NAME
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
