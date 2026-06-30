import logging
from typing import List, Dict, Optional
from datetime import datetime
from dotenv import load_dotenv
from config import settings
from database import update_recipient_status, update_campaign_analytics, add_to_suppression_list
from celery_app import send_email_batch_task
from email_provider import get_email_provider
import asyncio
import re

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Email Provider (Brevo)
try:
    email_provider = get_email_provider(provider_name=settings.EMAIL_PROVIDER, api_key=settings.BREVO_API_KEY)
    logger.info(f"✓ Email provider initialized: {settings.EMAIL_PROVIDER}")
except Exception as e:
    logger.error(f"✗ Failed to initialize email provider: {e}")
    email_provider = None

async def send_single_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    reply_to: Optional[List[str]] = None
) -> Dict:
    """
    Send a single email via Brevo Transactional Email API
    """
    if not email_provider:
        logger.error("Email provider not initialized")
        return {"status": "failed", "error": "Email provider not initialized"}
    
    try:
        from_addr = from_email or settings.BREVO_FROM_EMAIL
        from_name_str = from_name or settings.BREVO_FROM_NAME
        
        # Send email via Brevo
        result = await email_provider.send_single_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            from_email=from_addr,
            from_name=from_name_str,
            reply_to=reply_to
        )
        
        if result["status"] == "sent":
            logger.info(f"Email sent to {to_email}, MessageId: {result.get('message_id')}")
            return {"status": "success", "MessageId": result.get('message_id')}
        else:
            logger.error(f"Failed to send email to {to_email}: {result.get('error')}")
            return {"status": "failed", "error": result.get('error')}
    
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"status": "failed", "error": str(e)}

async def send_campaign_emails(
    campaign_id: str,
    recipients: List[Dict],
    template: Dict,
    campaign: Dict
):
    """
    Send campaign emails in parallel batches using Celery
    Uses Brevo provider for email delivery
    """
    try:
        logger.info(f"Starting campaign send for {campaign_id} with {len(recipients)} recipients")
        logger.info(f"Using email provider: {settings.EMAIL_PROVIDER}")
        
        # Split recipients into batches
        batch_size = settings.MAX_BATCH_SIZE
        batches = [recipients[i:i + batch_size] for i in range(0, len(recipients), batch_size)]
        
        logger.info(f"Created {len(batches)} batches of {batch_size} recipients each")
        
        # Send batches asynchronously using Celery
        tasks = []
        for batch_index, batch in enumerate(batches):
            task = send_email_batch_task.delay(
                campaign_id=campaign_id,
                batch_index=batch_index,
                recipients=batch,
                template=template,
                campaign=campaign
            )
            tasks.append(task)
            logger.info(f"Queued batch {batch_index + 1}/{len(batches)}")
        
        # Update campaign status
        from database import get_supabase_client
        supabase = get_supabase_client()
        supabase.table("campaigns").update({
            "status": "sending",
            "updated_at": datetime.now().isoformat()
        }).eq("id", campaign_id).execute()
        
        logger.info(f"Campaign {campaign_id} queued for sending via {settings.EMAIL_PROVIDER}")
        return {"status": "queued", "batches": len(batches), "total_recipients": len(recipients)}
    
    except Exception as e:
        logger.error(f"Error in send_campaign_emails: {str(e)}")
        raise

async def send_email_batch(
    campaign_id: str,
    batch_index: int,
    recipients: List[Dict],
    template: Dict,
    campaign: Dict
):
    """
    Send a batch of emails via Brevo (called by Celery worker)
    This runs in parallel for multiple batches
    """
    try:
        logger.info(f"Processing batch {batch_index} with {len(recipients)} recipients for campaign {campaign_id}")
        
        sent_count = 0
        failed_count = 0
        
        for recipient in recipients:
            try:
                # Extract recipient info
                contact = recipient.get("contacts", {})
                to_email = contact.get("email") if isinstance(contact, dict) else recipient.get("email")
                first_name = contact.get("first_name") if isinstance(contact, dict) else ""
                
                # Personalize subject and content
                subject = template.get("subject_line", "").replace("{first_name}", first_name or "")
                html_content = template.get("html_content", "").replace("{first_name}", first_name or "")
                html_content = html_content.replace("{email}", to_email or "")
                
                # Send email via Brevo
                result = await send_single_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_content,
                    from_email=campaign.get("from_email", settings.BREVO_FROM_EMAIL),
                    from_name=campaign.get("from_name")
                )
                
                if result["status"] == "success":
                    # Update recipient status to "sent"
                    await update_recipient_status(
                        recipient.get("id"),
                        "sent",
                        {"timestamp": datetime.now().isoformat()}
                    )
                    sent_count += 1
                else:
                    failed_count += 1
                    logger.error(f"Failed to send to {to_email}: {result.get('error')}")
            
            except Exception as e:
                logger.error(f"Error sending to recipient in batch {batch_index}: {str(e)}")
                failed_count += 1
        
        logger.info(f"Batch {batch_index} completed: {sent_count} sent, {failed_count} failed (via {settings.EMAIL_PROVIDER})")
        
        # Update campaign analytics
        await update_campaign_analytics(
            campaign_id,
            {"sent": sent_count, "updated_at": datetime.now().isoformat()}
        )
        
        return {
            "batch": batch_index,
            "sent": sent_count,
            "failed": failed_count
        }
    
    except Exception as e:
        logger.error(f"Error in send_email_batch: {str(e)}")
        return {"batch": batch_index, "sent": 0, "failed": len(recipients), "error": str(e)}

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
