from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class EmailRecipient(BaseModel):
    id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class EmailTemplate(BaseModel):
    id: str
    name: str
    subject_line: str
    html_content: str
    plain_text: Optional[str] = None
    
    class Config:
        from_attributes = True

class Campaign(BaseModel):
    id: str
    name: str
    subject_line: str
    from_email: str
    from_name: Optional[str] = None
    status: str = "draft"
    scheduled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CampaignSendRequest(BaseModel):
    campaign_id: str
    send_at: Optional[datetime] = None
    test_email: Optional[EmailStr] = None

class CampaignStatus(BaseModel):
    campaign_id: str
    status: str
    total: int
    sent: int
    delivered: int
    bounced: int
    complained: int
    unsubscribed: int
    pending: int
    failed: int = 0

class SendEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str
    html_content: str
    from_email: Optional[str] = None
    from_name: Optional[str] = None

class BatchSendRequest(BaseModel):
    campaign_id: str
    recipients: List[EmailRecipient]
    template: EmailTemplate
    campaign: Campaign

class EmailLog(BaseModel):
    id: str
    recipient_id: str
    status: str
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    bounced_at: Optional[datetime] = None
    complained_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True

class SuppressionEntry(BaseModel):
    email: EmailStr
    reason: str
    date_added: datetime
    
    class Config:
        from_attributes = True
