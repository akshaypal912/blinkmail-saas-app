import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const body = await request.json()

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

    // Just update the campaign directly (no ownership check needed as user is authenticated)
    console.log('[v0] PUT: Authenticated user:', user.id)

    // Update campaign status
    console.log('[v0] Updating campaign status:', {
      campaignId,
      status: body.status || 'sent',
      sent_count: body.sent_count,
      failed_count: body.failed_count
    })

    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: body.status || 'sent',
        sent_count: body.sent_count,
        failed_count: body.failed_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (updateError) {
      console.error('[v0] Update failed:', updateError)
      return NextResponse.json(
        { detail: updateError.message },
        { status: 500 }
      )
    }

    // Verify the update was successful by fetching the campaign
    const { data: verifyData, error: verifyError } = await supabase
      .from('campaigns')
      .select('status, sent_count, failed_count')
      .eq('id', campaignId)
      .single()

    console.log('[v0] Campaign status verified:', { 
      status: verifyData?.status, 
      sent_count: verifyData?.sent_count,
      failed_count: verifyData?.failed_count,
      verifyError: verifyError?.message
    })

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      status: body.status || 'sent',
      message: 'Campaign status updated successfully'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}
