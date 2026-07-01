import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // IMPORTANT: In Next.js 16, params is a Promise and must be awaited
    const { id: campaignId } = await params
    const body = await request.json()

    console.log('[v0] PUT /status called with campaignId:', campaignId)
    console.log('[v0] Request body:', body)

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[v0] Auth error:', userError)
      return NextResponse.json(
        { detail: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[v0] Authenticated user:', user.id)

    // Update campaign status directly
    console.log('[v0] Updating campaign:', campaignId)
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: body.status || 'sent',
        sent_count: body.sent_count ?? 0,
        failed_count: body.failed_count ?? 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (updateError) {
      console.error('[v0] Update error:', updateError)
      return NextResponse.json(
        { detail: updateError.message },
        { status: 500 }
      )
    }

    console.log('[v0] Update successful, verifying...')

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('campaigns')
      .select('status, sent_count, failed_count')
      .eq('id', campaignId)
      .single()

    console.log('[v0] Verification result:', {
      status: verifyData?.status,
      sent_count: verifyData?.sent_count,
      failed_count: verifyData?.failed_count,
      error: verifyError?.message
    })

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      status: verifyData?.status || 'sent',
      message: 'Campaign status updated successfully'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Status API error:', message)
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // IMPORTANT: In Next.js 16, params is a Promise and must be awaited
    const { id: campaignId } = await params

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

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error || !campaign) {
      return NextResponse.json(
        { detail: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      campaign_id: campaignId,
      status: campaign.status,
      sent_count: campaign.sent_count || 0,
      failed_count: campaign.failed_count || 0
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}
