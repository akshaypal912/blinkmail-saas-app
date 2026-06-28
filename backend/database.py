from supabase import create_client
from config import settings
import logging

logger = logging.getLogger(__name__)

_supabase_client = None

def get_supabase_client():
    """Get or create Supabase client"""
    global _supabase_client
    
    if _supabase_client is None:
        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    return _supabase_client

async def update_recipient_status(recipient_id: str, status: str, metadata: dict = None):
    """Update recipient email status in database"""
    try:
        supabase = get_supabase_client()
        update_data = {"status": status}
        
        if metadata:
            if status == "delivered":
                update_data["delivered_at"] = metadata.get("timestamp")
            elif status == "bounced":
                update_data["bounced_at"] = metadata.get("timestamp")
            elif status == "complained":
                update_data["complained_at"] = metadata.get("timestamp")
            elif status == "sent":
                update_data["sent_at"] = metadata.get("timestamp")
        
        supabase.table("campaign_recipients").update(update_data).eq("id", recipient_id).execute()
        logger.info(f"Updated recipient {recipient_id} status to {status}")
    
    except Exception as e:
        logger.error(f"Failed to update recipient status: {str(e)}")

async def get_campaign_analytics(campaign_id: str):
    """Get campaign analytics"""
    try:
        supabase = get_supabase_client()
        analytics = supabase.table("campaign_analytics").select("*").eq("campaign_id", campaign_id).single().execute()
        return analytics.data
    
    except Exception as e:
        logger.error(f"Failed to get campaign analytics: {str(e)}")
        return None

async def update_campaign_analytics(campaign_id: str, updates: dict):
    """Update campaign analytics"""
    try:
        supabase = get_supabase_client()
        supabase.table("campaign_analytics").update(updates).eq("campaign_id", campaign_id).execute()
        logger.info(f"Updated analytics for campaign {campaign_id}")
    
    except Exception as e:
        logger.error(f"Failed to update campaign analytics: {str(e)}")

async def add_to_suppression_list(user_id: str, email: str, reason: str):
    """Add email to suppression list (bounces, complaints, etc)"""
    try:
        supabase = get_supabase_client()
        supabase.table("suppression_list").insert({
            "user_id": user_id,
            "email": email,
            "reason": reason
        }).execute()
        logger.info(f"Added {email} to suppression list: {reason}")
    
    except Exception as e:
        logger.error(f"Failed to add to suppression list: {str(e)}")
