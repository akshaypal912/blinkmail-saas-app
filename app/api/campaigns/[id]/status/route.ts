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

    // Verify campaign belongs to user
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json(
        { detail: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Update campaign status
    console.log('[v0] Updating campaign status:', {
      campaignId,
      status: body.status || 'sent',
      sent_count: body.sent_count,
      failed_count: body.failed_count
    })

    const { error: updateError, data: updateData } = await supabase
      .from('campaigns')
      .update({
        status: body.status || 'sent',
        sent_count: body.sent_count,
        failed_count: body.failed_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    console.log('[v0] Update result:', { updateError: updateError?.message, updateData })

    if (updateError) {
      console.error('[v0] Update failed:', updateError)
      return NextResponse.json(
        { detail: updateError.message },
        { status: 500 }
      )
    }

    console.log('[v0] Campaign status updated successfully')

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
