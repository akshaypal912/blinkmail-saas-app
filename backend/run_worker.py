#!/usr/bin/env python
"""
Run Celery worker for email batch processing
"""
import os
import sys
from celery_app import app
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info("Starting Celery worker...")
    
    # Configure worker with 4 concurrent processes
    app.worker_main([
        'worker',
        '--loglevel=info',
        '--concurrency=4',  # 4 parallel email batch processors
        '--queues=celery',
        '--prefetch-multiplier=1',
        '--time-limit=1800',  # 30 minutes hard limit
        '--soft-time-limit=1500',  # 25 minutes soft limit
    ])
