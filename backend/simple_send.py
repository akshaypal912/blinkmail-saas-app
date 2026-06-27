#!/usr/bin/env python3
"""
Simple Email Sender - No complex config needed
Sends emails via AWS SES immediately
"""
import json
import boto3
import os
from datetime import datetime

# AWS SES Client
ses_client = boto3.client(
    'ses',
    region_name='ap-south-1',
    aws_access_key_id='AKIAQQOY4S7ORU2ZMY42',
    aws_secret_access_key='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'
)

SENDER_EMAIL = 'hello@undefstudio.live'

def send_test_email(to_email, subject, body):
    """Send a single test email via AWS SES"""
    try:
        response = ses_client.send_email(
            Source=SENDER_EMAIL,
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {'Data': subject},
                'Body': {'Html': {'Data': body}}
            }
        )
        print(f"✓ Email sent to {to_email} - MessageId: {response['MessageId']}")
        return True
    except Exception as e:
        print(f"✗ Failed to send to {to_email}: {str(e)}")
        return False

def send_bulk_emails(recipients_list, subject, body):
    """Send emails to multiple recipients"""
    print(f"\n📧 Sending {len(recipients_list)} emails...")
    print(f"Subject: {subject}\n")
    
    success_count = 0
    for i, recipient in enumerate(recipients_list, 1):
        email = recipient['email'] if isinstance(recipient, dict) else recipient
        print(f"[{i}/{len(recipients_list)}] Sending to {email}...", end=" ")
        if send_test_email(email, subject, body):
            success_count += 1
        print()
    
    print(f"\n✓ Complete: {success_count}/{len(recipients_list)} emails sent successfully")
    return success_count

if __name__ == "__main__":
    # Test email
    test_recipients = [
        "test@example.com",
        "user@example.com",
    ]
    
    test_subject = "Welcome to BlinkMail Pro!"
    test_body = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h1>Welcome to BlinkMail Pro!</h1>
            <p>Your professional email campaign platform is ready.</p>
            <p>Start sending emails today!</p>
            <p>Time sent: {}</p>
        </body>
    </html>
    """.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    send_bulk_emails(test_recipients, test_subject, test_body)
