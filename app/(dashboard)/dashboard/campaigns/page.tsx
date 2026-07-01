'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Trash2, Edit2, Search, Mail, Send } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  subject_line?: string
  status: string
  created_at: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })

        setCampaigns(data || [])
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()

    // Subscribe to real-time updates for campaign changes
    const subscription = supabase
      .channel('campaigns')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns' },
        (payload) => {
          console.log('[v0] Campaign updated:', payload)
          
          if (payload.eventType === 'UPDATE') {
            setCampaigns(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new : c)
            )
          } else if (payload.eventType === 'INSERT') {
            setCampaigns(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setCampaigns(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.subject_line?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      await supabase.from('campaigns').delete().eq('id', id)
      setCampaigns(campaigns.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    setSendingId(campaignId)
    try {
      const response = await fetch('/api/campaigns/send-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaignId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(`Error: ${data.detail || 'Failed to send campaign'}`)
        return
      }

      const message = data.failed > 0 
        ? `Campaign sent! ${data.sent} delivered, ${data.failed} failed (not verified in AWS SES). Request Production Access to send to all users.`
        : `Campaign sent! ${data.sent} emails delivered successfully.`
      
      alert(message)
      
      // Wait a moment for database to process
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Refresh campaigns immediately
      const { data: updated } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (updated) {
        setCampaigns(updated)
        
        // Also update local state immediately
        setCampaigns(prev =>
          prev.map(c => 
            c.id === campaignId 
              ? { ...c, status: 'sent' }
              : c
          )
        )
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Campaigns"
        description="Create and manage your email campaigns"
      />

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Campaigns Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Link href="/dashboard/campaigns/new">
              <Button>Create Your First Campaign</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground truncate max-w-xs">
                      {campaign.subject_line || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            campaign.status === 'sent' 
                              ? 'default' 
                              : campaign.status === 'draft'
                              ? 'secondary'
                              : campaign.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {campaign.status === 'draft' ? 'Draft' : campaign.status === 'sending' ? 'Sending...' : campaign.status === 'sent' ? 'Sent' : campaign.status === 'failed' ? 'Failed' : campaign.status}
                        </Badge>
                        {campaign.status === 'sent' && (campaign as any).sent_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {(campaign as any).sent_count} sent {(campaign as any).failed_count > 0 && `• ${(campaign as any).failed_count} failed`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleSendCampaign(campaign.id)}
                        disabled={sendingId === campaign.id || campaign.status === 'sent' || campaign.status === 'sending' || campaign.status === 'draft'}
                        className="text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={campaign.status === 'draft' ? 'Edit campaign first before sending' : campaign.status === 'sent' ? 'Campaign already sent' : campaign.status === 'sending' ? 'Campaign is currently sending' : 'Send campaign'}
                      >
                        {sendingId === campaign.id ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                      <Link href={`/dashboard/campaigns/${campaign.id}`} className="inline">
                        <button className="text-primary hover:text-primary/80 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredCampaigns.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredCampaigns.length} of {campaigns.length} campaigns
        </div>
      )}
    </div>
  )
}
