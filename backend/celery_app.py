from celery import Celery, Task
from config import settings
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

# Determine broker URL (support both Redis and Upstash)
if settings.UPSTASH_REDIS_REST_URL:
    # Upstash REST API format
    BROKER_URL = f"https://{settings.UPSTASH_REDIS_REST_TOKEN}@{settings.UPSTASH_REDIS_REST_URL.replace('https://', '')}"
elif settings.REDIS_URL:
    BROKER_URL = settings.REDIS_URL
else:
    BROKER_URL = settings.CELERY_BROKER_URL or "redis://localhost:6379/0"

# Create Celery app
app = Celery(
    'blinkmail_pro',
    broker=BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND or BROKER_URL
)

# Celery configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,  # Process one task at a time per worker
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks
)

class CallbackTask(Task):
    """Task class with callbacks"""
    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f"Task {task_id} succeeded: {retval}")
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")

app.Task = CallbackTask

@app.task(bind=True, max_retries=settings.EMAIL_RETRY_ATTEMPTS)
def send_email_batch_task(
    self,
    campaign_id: str,
    batch_index: int,
    recipients: List[Dict],
    template: Dict,
    campaign: Dict
):
    """
    Celery task to send a batch of emails
    This runs in parallel across multiple workers
    """
    try:
        from email_service import send_email_batch
        import asyncio
        
        logger.info(f"Starting email batch task: campaign={campaign_id}, batch={batch_index}")
        
        # Run async function
        result = asyncio.run(send_email_batch(
            campaign_id=campaign_id,
            batch_index=batch_index,
            recipients=recipients,
            template=template,
            campaign=campaign
        ))
        
        return result
    
    except Exception as exc:
        logger.error(f"Error in send_email_batch_task: {str(exc)}")
        # Retry with exponential backoff
        raise self.retry(
            exc=exc,
            countdown=settings.EMAIL_RETRY_DELAY * (2 ** self.request.retries),
            max_retries=settings.EMAIL_RETRY_ATTEMPTS
        )

@app.task
def process_bounces():
    """
    Task to process email bounces from SES
    Scheduled to run periodically
    """
    try:
        logger.info("Processing email bounces")
        # Implementation would fetch SNS notifications from SQS
        # and update suppression lists
    except Exception as e:
        logger.error(f"Error processing bounces: {str(e)}")

@app.task
def process_complaints():
    """
    Task to process email complaints from SES
    Scheduled to run periodically
    """
    try:
        logger.info("Processing email complaints")
        # Implementation would fetch SNS notifications from SQS
        # and update suppression lists
    except Exception as e:
        logger.error(f"Error processing complaints: {str(e)}")

@app.task
def cleanup_old_logs():
    """
    Task to cleanup old email logs
    Scheduled to run periodically
    """
    try:
        logger.info("Cleaning up old logs")
        # Implementation would delete logs older than 90 days
    except Exception as e:
        logger.error(f"Error cleaning up logs: {str(e)}")

if __name__ == '__main__':
    app.start()
