'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmailTemplateDesigner } from '@/components/email/designer'
import { AlertCircle, Save, Clock, Send } from 'lucide-react'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  subject_line?: string
  from_email?: string
  from_name?: string
  status: string
  scheduled_at?: string
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<string>('')
  const [htmlContent, setHtmlContent] = useState('')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const resolvedParams = await params
        setCampaignId(resolvedParams.id)
        
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (data) {
          setCampaign(data)
          
          // Fetch the template for this campaign
          const { data: templateData } = await supabase
            .from('email_templates')
            .select('html_content, subject_line')
            .eq('campaign_id', resolvedParams.id)
            .single()
          
          if (templateData && templateData.html_content) {
            console.log('[v0] Loaded template content:', templateData.html_content.length, 'chars')
            setHtmlContent(templateData.html_content)
          } else {
            console.log('[v0] No template found, starting with empty content')
          }
        } else {
          console.error('Campaign not found')
        }
      } catch (error) {
        console.error('Error fetching campaign:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()

    // Subscribe to real-time updates for this campaign
    const resolveParamsAndSubscribe = async () => {
      const resolvedParams = await params
      const subscription = supabase
        .channel(`campaign-${resolvedParams.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'campaigns', filter: `id=eq.${resolvedParams.id}` },
          (payload) => {
            console.log('[v0] Campaign updated:', payload)
            if (payload.new) {
              setCampaign(payload.new)
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    resolveParamsAndSubscribe()
  }, [params, supabase])

  const handleSave = async () => {
    if (!campaign) return

    setSaving(true)
    console.log('[v0] Saving template:', { 
      campaign_id: campaign.id, 
      html_content_length: htmlContent.length,
      html_preview: htmlContent.substring(0, 100)
    })
    
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .upsert({
          campaign_id: campaign.id,
          user_id: campaign.user_id || campaign.id,
          name: `${campaign.name} - Template`,
          html_content: htmlContent,
          subject_line: campaign.subject_line,
        })

      if (error) {
        console.error('[v0] Template save error:', error)
        alert('Error saving template: ' + error.message)
      } else {
        console.log('[v0] Template saved successfully')
        alert('Template saved successfully!')
      }

      // Show success feedback
      setTimeout(() => {
        setSaving(false)
      }, 500)
    } catch (error) {
      console.error('[v0] Error saving template:', error)
      setSaving(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!campaign || !campaignId) return

    setSending(true)
    setSendStatus('Sending campaign...')

    try {
      console.log('[v0] Sending campaign with ID:', campaign.id)
      
      const response = await fetch('/api/campaigns/send-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaign.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[v0] API error response:', data)
        throw new Error(data.detail || 'Failed to send campaign')
      }

      console.log('[v0] Send API response:', data)
      setSendStatus(`✓ Campaign sent! ${data.sent} emails delivered`)
      
      // Call the status API to update campaign
      try {
        const statusRes = await fetch(`/api/campaigns/${campaignId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'sent',
            sent_count: data.sent || 0,
            failed_count: data.failed || 0
          })
        })
        
        const statusData = await statusRes.json()
        console.log('[v0] Status API response:', statusData)
        
        if (!statusRes.ok) {
          console.error('[v0] Status update failed:', statusData)
        }
      } catch (err) {
        console.error('[v0] Status update error:', err)
      }
      
      // Update local UI
      setCampaign(prev => prev ? { 
        ...prev, 
        status: 'sent',
        sent_count: data.sent || 0,
        failed_count: data.failed || 0
      } : null)
      
      setSending(false)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Send error:', message)
      setSendStatus(`✗ Error: ${message}`)
      setSending(false)
    }
  }

  const pollCampaignStatus = async (campaignId: string) => {
    const maxAttempts = 30 // Poll for 5 minutes (10s intervals)
    let attempts = 0

    const poll = setInterval(async () => {
      attempts++

      try {
        const response = await fetch(`/api/campaigns/${campaignId}/status`)
        if (response.ok) {
          const data = await response.json()
          setSendStatus(
            `Status: ${data.statistics.sent} sent, ${data.statistics.delivered} delivered, ${data.statistics.bounced} bounced`
          )
        }
      } catch (error) {
        console.error('Error polling status:', error)
      }

      if (attempts >= maxAttempts) {
        clearInterval(poll)
      }
    }, 10000) // Poll every 10 seconds
  }

  if (loading) {
    return (
      <div className="p-8 lg:ml-64 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-8 lg:ml-64">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Link href="/dashboard/campaigns">
            <Button>Back to Campaigns</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 lg:ml-64">
      <div className="flex items-center justify-between mb-8">
        <div>
          <DashboardHeader
            title={campaign.name}
            description={`Campaign · ${campaign.status === 'draft' ? 'DRAFT' : campaign.status === 'sending' ? 'SENDING' : campaign.status === 'sent' ? 'SENT' : campaign.status.toUpperCase()}`}
          />
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Campaign Settings Bar */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Subject Line
            </label>
            <Input
              value={campaign.subject_line || ''}
              placeholder="Email subject line"
              disabled
              className="text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Name
            </label>
            <Input
              value={campaign.from_name || ''}
              placeholder="Sender name"
              disabled
              className="text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Email
            </label>
            <Input
              value={campaign.from_email || ''}
              placeholder="noreply@yourdomain.com"
              disabled
              className="text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Scheduled For
            </label>
            <Input
              type="datetime-local"
              value={campaign.scheduled_at || ''}
              disabled
              className="text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Email Template Designer */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Email Content</h2>
        <EmailTemplateDesigner
          value={htmlContent}
          onChange={setHtmlContent}
        />
      </div>

      {/* Send Status */}
      {sendStatus && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-foreground">{sendStatus}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
        <Button
          onClick={handleSendCampaign}
          disabled={sending || campaign.status === 'sent'}
          variant={campaign.status === 'draft' ? 'default' : 'outline'}
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? 'Sending...' : 'Send Campaign Now'}
        </Button>
        <Button variant="outline">
          <Clock className="w-4 h-4 mr-2" />
          Schedule Send
        </Button>
        <Link href="/dashboard/campaigns" className="ml-auto">
          <Button variant="outline">Close</Button>
        </Link>
      </div>
    </div>
  )
}
