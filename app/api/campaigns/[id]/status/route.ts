import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

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
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json(
        { detail: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get recipient statistics
    const { data: recipients } = await supabase
      .from('campaign_recipients')
      .select('status')
      .eq('campaign_id', campaignId)

    const stats = {
      pending: recipients?.filter((r: any) => r.status === 'pending').length || 0,
      sent: recipients?.filter((r: any) => r.status === 'sent').length || 0,
      delivered:
        recipients?.filter((r: any) => r.status === 'delivered').length || 0,
      bounced: recipients?.filter((r: any) => r.status === 'bounced').length || 0,
      complained:
        recipients?.filter((r: any) => r.status === 'complained').length || 0,
      unsubscribed:
        recipients?.filter((r: any) => r.status === 'unsubscribed').length || 0,
    }

    return NextResponse.json({
      campaign_id: campaignId,
      status: campaign.status,
      statistics: stats,
      total: recipients?.length || 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    )
  }
}
