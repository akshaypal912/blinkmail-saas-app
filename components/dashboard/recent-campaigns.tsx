'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Campaign {
  id: string
  name: string
  status: string
  created_at: string
}

export function RecentCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)

        setCampaigns(data || [])
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [supabase])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-secondary rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Recent Campaigns</h2>

      {campaigns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No campaigns yet</p>
          <Link href="/dashboard/campaigns/new">
            <Button>Create Your First Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
              <div>
                <p className="font-medium text-foreground">{campaign.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge
                variant={campaign.status === 'sent' ? 'default' : 'secondary'}
              >
                {campaign.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
