import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function authenticateAndVerifyOwnership(
  campaignId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized', status: 401, campaign: null }
  }

  // Verify campaign belongs to user
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .single()

  if (!campaign) {
    return { error: 'Campaign not found', status: 404, campaign: null }
  }

  return { error: null, status: 200, campaign, user }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const result = await authenticateAndVerifyOwnership(campaignId)

    if (result.error) {
      return NextResponse.json(
        { detail: result.error },
        { status: result.status }
      )
    }

    const campaign = result.campaign!

    // Return campaign status with counts
    return NextResponse.json({
      campaign_id: campaignId,
      status: campaign.status,
      sent: campaign.sent_count || 0,
      failed: campaign.failed_count || 0,
      total_recipients: campaign.sent_count + campaign.failed_count || 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    console.log('[v0] PUT /api/campaigns/[id]/status called with campaignId:', campaignId)
    
    const body = await request.json()
    console.log('[v0] Request body:', body)
    
    const result = await authenticateAndVerifyOwnership(campaignId)
    console.log('[v0] Auth result:', { error: result.error, status: result.status, campaign_found: !!result.campaign })
    
    if (result.error) {
      console.error('[v0] Auth error:', result.error)
      return NextResponse.json(
        { detail: result.error },
        { status: result.status }
      )
    }

    const supabase = await createClient()

    // Update campaign status
    console.log('[v0] Updating campaign', campaignId, 'to status:', body.status)
    const { error: updateError, data: updateData } = await supabase
      .from('campaigns')
      .update({
        status: body.status || 'sent',
        sent_count: body.sent_count,
        failed_count: body.failed_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()

    if (updateError) {
      console.error('[v0] Update error:', updateError)
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
    console.error('[v0] Error updating status:', message)
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}

    const supabase = await createClient()

    // Update campaign status
    console.log('[v0] API: Updating campaign status to:', body.status)
    const { error: updateError, data: updateData } = await supabase
      .from('campaigns')
      .update({
        status: body.status || 'sent',
        sent_count: body.sent_count,
        failed_count: body.failed_count,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()

    if (updateError) {
      console.error('[v0] API: Update error:', updateError)
      return NextResponse.json(
        { detail: updateError.message },
        { status: 500 }
      )
    }

    console.log('[v0] API: Campaign status updated successfully')

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      status: body.status || 'sent',
      message: 'Campaign status updated successfully'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] API: Error updating status:', message)
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}
