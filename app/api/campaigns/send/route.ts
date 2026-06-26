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

    // Get the user session
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { detail: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify campaign belongs to user
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json(
        { detail: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get recipients
    const { data: recipients } = await supabase
      .from('campaign_recipients')
      .select('id, contact_id, contacts(email, first_name, last_name)')
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending')

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { detail: 'No pending recipients found' },
        { status: 400 }
      )
    }

    // Get email template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('campaign_id', campaign_id)
      .single()

    // Call FastAPI backend
    const backendUrl = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/campaigns/${campaign_id}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign_id,
        recipients: recipients || [],
        template: template || { subject_line: campaign.subject_line, html_content: '' },
        campaign,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { detail: error.detail || 'Failed to send campaign' },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Update campaign status in database
    await supabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id)

    return NextResponse.json({
      status: 'sending',
      campaign_id,
      total_recipients: recipients.length,
      message: 'Campaign emails queued for sending',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}
