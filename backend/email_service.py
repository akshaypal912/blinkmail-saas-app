import boto3
import logging
from typing import List, Dict, Optional
from datetime import datetime
from config import settings
from database import update_recipient_status, update_campaign_analytics, add_to_suppression_list
from celery_app import send_email_batch_task
import asyncio
import re

logger = logging.getLogger(__name__)

# Initialize AWS SES client
ses_client = boto3.client(
    'ses',
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)

async def send_single_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    reply_to: Optional[List[str]] = None
) -> Dict:
    """
    Send a single email via AWS SES
    """
    try:
        from_addr = from_email or settings.AWS_SES_SENDER_EMAIL
        
        if from_name:
            from_addr = f"{from_name} <{from_addr}>"
        
        # Send email
        response = ses_client.send_email(
            Source=from_addr,
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {'Html': {'Data': html_content, 'Charset': 'UTF-8'}}
            },
            ReplyToAddresses=reply_to or []
        )
        
        logger.info(f"Email sent to {to_email}, MessageId: {response['MessageId']}")
        return {"status": "success", "MessageId": response['MessageId']}
    
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
    """
    try:
        logger.info(f"Starting campaign send for {campaign_id} with {len(recipients)} recipients")
        
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
        
        logger.info(f"Campaign {campaign_id} queued for sending")
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
    Send a batch of emails (called by Celery worker)
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
                
                # Send email
                result = await send_single_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_content,
                    from_email=campaign.get("from_email", settings.AWS_SES_SENDER_EMAIL),
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
        
        logger.info(f"Batch {batch_index} completed: {sent_count} sent, {failed_count} failed")
        
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
