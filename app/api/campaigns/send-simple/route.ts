import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { campaign_id } = await request.json()

    if (!campaign_id) {
      return NextResponse.json(
        { detail: 'campaign_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { detail: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (error || !campaign) {
      console.error('[v0] Campaign fetch error:', error)
      return NextResponse.json(
        { detail: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify user owns this campaign
    if (campaign.user_id !== user.id) {
      console.error('[v0] Unauthorized - campaign belongs to different user')
      return NextResponse.json(
        { detail: 'Unauthorized - campaign does not belong to you' },
        { status: 403 }
      )
    }
    
    console.log('[v0] Campaign ownership verified for user:', user.id)

    // Get all contacts for this user to send to
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name')
      .eq('user_id', user.id)

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { detail: 'No contacts found. Please add contacts first.' },
        { status: 400 }
      )
    }

    // Get email template for this campaign
    console.log('[v0] Querying email_templates for campaign_id:', campaign_id)
    
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('campaign_id', campaign_id)
      .single()

    console.log('[v0] ===== TEMPLATE FETCH RESULT =====')
    console.log('[v0] Template found?', !!template)
    console.log('[v0] Template error?', templateError ? templateError.message : 'none')
    console.log('[v0] Template data:', template)
    if (template) {
      console.log('[v0] Template html_content length:', template.html_content?.length || 0)
      console.log('[v0] Template html_content first 200 chars:', (template.html_content || '').substring(0, 200))
    }

    // Validate from_email is set (must be set on campaign)
    if (!campaign.from_email) {
      console.error('[v0] Campaign missing from_email')
      return NextResponse.json(
        { detail: 'Campaign does not have a sender email configured. Please edit the campaign.' },
        { status: 400 }
      )
    }

    // Prepare email data for backend
    const emailData = {
      campaign_id,
      campaign_name: campaign.name,
      subject_line: campaign.subject_line || template?.subject_line || 'No Subject',
      from_email: campaign.from_email,
      from_name: campaign.from_name || 'BlinkMail',
      html_content: template?.html_content || '<p>No content</p>',
      recipients: contacts.map(c => ({
        id: c.id,
        email: c.email,
        first_name: c.first_name || '',
        last_name: c.last_name || ''
      }))
    }

    console.log('[v0] Email data to send:', {
      campaign_id,
      recipients: emailData.recipients.length,
      has_html_content: (emailData.html_content?.length || 0) > 20,
      html_preview: (emailData.html_content || '').substring(0, 100)
    })

    // Call backend API with retry logic
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    console.log('[v0] Calling backend at:', backendUrl)
    console.log('[v0] Sending email data:', { campaign_id, recipients: contacts.length })

    // Retry configuration
    const MAX_RETRIES = 3
    const RETRY_DELAY_MS = 2000
    
    async function callBackendWithRetry(attempt = 1): Promise<Response> {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)
        
        const response = await fetch(`${backendUrl}/api/send-campaign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
          signal: controller.signal,
        })
        
        clearTimeout(timeout)
        return response
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.log(`[v0] Attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
          return callBackendWithRetry(attempt + 1)
        }
        throw error
      }
    }

    let backendResponse
    try {
      backendResponse = await callBackendWithRetry()

      if (!backendResponse.ok) {
        const backendError = await backendResponse.text()
        console.error('[v0] Backend error:', backendError)
        
        return NextResponse.json(
          { 
            detail: `Backend error: ${backendError}`,
            status: 'failed'
          },
          { status: backendResponse.status }
        )
      }

      const backendResult = await backendResponse.json()
      console.log('[v0] Backend response:', backendResult)

      // Update campaign status based on backend result
      const campaignStatus = backendResult.failed > 0 && backendResult.sent === 0 ? 'failed' : 'sent'
      
      console.log('[v0] Updating campaign status:', { campaign_id, status: campaignStatus })
      
      const { data: updateData, error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          status: campaignStatus,
          updated_at: new Date().toISOString(),
          sent_count: backendResult.sent || 0,
          failed_count: backendResult.failed || 0
        })
        .eq('id', campaign_id)

      if (updateError) {
        console.error('[v0] Error updating campaign status:', updateError)
        console.log('[v0] Update data:', updateData)
      } else {
        console.log('[v0] Campaign status updated successfully')
        // Verify the update actually happened
        const { data: verifyData } = await supabase
          .from('campaigns')
          .select('status, updated_at')
          .eq('id', campaign_id)
          .single()
        console.log('[v0] Verified status in database:', verifyData)
      }

      return NextResponse.json({
        status: campaignStatus,
        campaign_id,
        total_recipients: contacts.length,
        sent: backendResult.sent,
        failed: backendResult.failed,
        backend_response: backendResult,
        message: `Campaign sent! ${backendResult.sent} emails delivered, ${backendResult.failed} failed.`,
      })

    } catch (backendError) {
      const errorMsg = backendError instanceof Error ? backendError.message : String(backendError)
      console.error('[v0] Backend connection error after 3 retries:', errorMsg)
      
      return NextResponse.json(
        { 
          detail: `Failed to connect to backend after ${MAX_RETRIES} attempts: ${errorMsg}. Backend at ${backendUrl} is not responding. Please check: 1) Is backend running? 2) Is port 8000 open? 3) Check logs: tail -f /tmp/blinkmail_backend.log`,
          status: 'failed'
        },
        { status: 503 }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Send error:', message)
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}
