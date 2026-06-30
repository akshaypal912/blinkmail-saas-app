"""
Modular Email Provider Architecture
Supports multiple email providers via simple provider switching
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailProvider(ABC):
    """Abstract base class for email providers"""
    
    @abstractmethod
    async def send_single_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str,
        from_name: str,
        reply_to: Optional[list] = None
    ) -> Dict:
        """Send a single email"""
        pass
    
    @abstractmethod
    async def send_batch(
        self,
        recipients: list,
        subject: str,
        html_content: str,
        from_email: str,
        from_name: str
    ) -> Dict:
        """Send to multiple recipients"""
        pass
    
    @abstractmethod
    def health_check(self) -> Dict:
        """Check provider health status"""
        pass


class BrevoEmailProvider(EmailProvider):
    """Brevo (Sendinblue) email provider using Transactional API"""
    
    def __init__(self, api_key: str):
        """Initialize Brevo provider"""
        if not api_key:
            raise ValueError("BREVO_API_KEY is required")
        
        self.api_key = api_key
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        self.batch_api_url = "https://api.brevo.com/v3/smtp/email/batch"
        
        # Import httpx for HTTP requests (already in requirements)
        import httpx
        self.client = httpx.AsyncClient(
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": self.api_key
            },
            timeout=30.0
        )
        
        logger.info("✓ Brevo email provider initialized")
    
    async def send_single_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str,
        from_name: str = None,
        reply_to: Optional[list] = None
    ) -> Dict:
        """Send a single email via Brevo Transactional API"""
        try:
            payload = {
                "sender": {
                    "name": from_name or "BlinkMail",
                    "email": from_email
                },
                "to": [
                    {
                        "email": to_email
                    }
                ],
                "subject": subject,
                "htmlContent": html_content
            }
            
            if reply_to:
                payload["replyTo"] = {"email": reply_to[0]}
            
            response = await self.client.post(self.api_url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            message_id = data.get("messageId", "unknown")
            
            logger.info(f"✓ Email sent to {to_email} via Brevo (MessageId: {message_id})")
            
            return {
                "status": "sent",
                "email": to_email,
                "message_id": message_id,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"✗ Brevo error for {to_email}: {error_msg}")
            
            # Handle specific Brevo errors
            if "invalid email" in error_msg.lower():
                logger.error("→ Invalid email format")
            elif "too many requests" in error_msg.lower() or "429" in error_msg:
                logger.error("→ Rate limit exceeded, retry later")
            elif "authentication" in error_msg.lower() or "401" in error_msg:
                logger.error("→ Invalid API key")
            
            return {
                "status": "failed",
                "email": to_email,
                "error": error_msg
            }
    
    async def send_batch(
        self,
        recipients: list,
        subject: str,
        html_content: str,
        from_email: str,
        from_name: str = None
    ) -> Dict:
        """Send batch emails via Brevo"""
        try:
            # Build recipient list
            to_recipients = [
                {"email": recipient.get("email")}
                for recipient in recipients
                if recipient.get("email")
            ]
            
            if not to_recipients:
                return {"status": "failed", "error": "No valid recipients"}
            
            payload = {
                "sender": {
                    "name": from_name or "BlinkMail",
                    "email": from_email
                },
                "to": to_recipients,
                "subject": subject,
                "htmlContent": html_content
            }
            
            response = await self.client.post(self.api_url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            message_ids = data.get("messageId")
            
            logger.info(f"✓ Batch sent to {len(to_recipients)} recipients via Brevo")
            
            return {
                "status": "sent",
                "recipients": len(to_recipients),
                "message_ids": message_ids,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"✗ Brevo batch error: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "recipients": len(recipients)
            }
    
    def health_check(self) -> Dict:
        """Check Brevo API health"""
        return {
            "provider": "brevo",
            "status": "healthy",
            "api_url": self.api_url,
            "timestamp": datetime.now().isoformat()
        }
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


def get_email_provider(provider_name: str = None, api_key: str = None) -> EmailProvider:
    """Factory function to get email provider"""
    import os
    
    provider = provider_name or os.getenv("EMAIL_PROVIDER", "brevo")
    key = api_key or os.getenv("BREVO_API_KEY")
    
    if provider.lower() == "brevo":
        return BrevoEmailProvider(api_key=key)
    else:
        raise ValueError(f"Unknown email provider: {provider}")
