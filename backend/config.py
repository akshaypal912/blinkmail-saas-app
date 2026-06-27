from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # AWS Configuration
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "ap-south-1"
    AWS_SES_SENDER_EMAIL: str
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_ANON_KEY: Optional[str] = None
    
    # Redis/Upstash Configuration
    UPSTASH_REDIS_REST_URL: Optional[str] = None
    UPSTASH_REDIS_REST_TOKEN: Optional[str] = None
    REDIS_URL: Optional[str] = None
    
    # FastAPI Configuration
    FASTAPI_ENV: str = "development"
    FASTAPI_DEBUG: bool = True
    FASTAPI_HOST: str = "0.0.0.0"
    FASTAPI_PORT: int = 8000
    
    # Celery Configuration
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None
    
    # Email Configuration
    MAX_BATCH_SIZE: int = 50  # Process 50 emails per Celery task
    MAX_CONCURRENT_BATCHES: int = 4  # Process 4 batches in parallel
    EMAIL_RETRY_ATTEMPTS: int = 3
    EMAIL_RETRY_DELAY: int = 60  # seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env

try:
    settings = Settings()
except Exception as e:
    print(f"Error loading settings: {e}")
    # Provide defaults if .env file is missing
    settings = Settings(
        AWS_ACCESS_KEY_ID="",
        AWS_SECRET_ACCESS_KEY="",
        AWS_REGION="ap-south-1",
        AWS_SES_SENDER_EMAIL="",
        SUPABASE_URL="",
        SUPABASE_SERVICE_ROLE_KEY="",
    )
