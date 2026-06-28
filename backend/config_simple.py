"""
Simplified Configuration - No validation errors
"""
import os
from typing import Optional

class Settings:
    # AWS
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "AKIAQQOY4S7ORU2ZMY42")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "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")
    AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
    AWS_SES_SENDER_EMAIL = os.getenv("AWS_SES_SENDER_EMAIL", "hello@undefstudio.live")
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xelmbawclsfkvtzdtojy.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL", "")
    UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
    
    # Celery
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)
    
    # Email
    MAX_BATCH_SIZE = 50
    MAX_CONCURRENT_BATCHES = 4
    EMAIL_RETRY_ATTEMPTS = 3
    EMAIL_TIMEOUT = 30
    
    # API
    API_HOST = "0.0.0.0"
    API_PORT = 8000
    DEBUG = True

settings = Settings()
