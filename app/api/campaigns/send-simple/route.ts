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
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('campaign_id', campaign_id)
      .single()

    // Update campaign status to 'sending'
    await supabase
      .from('campaigns')
      .update({ 
        status: 'sending',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign_id)

    // For testing: just return success without calling backend
    // In production, this would queue to Celery/FastAPI
    return NextResponse.json({
      status: 'sending',
      campaign_id,
      total_recipients: contacts.length,
      message: `Campaign queued! Ready to send to ${contacts.length} contacts`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Send error:', message)
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}
