'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RecentCampaigns } from '@/components/dashboard/recent-campaigns'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, Users, Send, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState({
    totalCampaigns: 0,
    totalContacts: 0,
    totalSent: 0,
    totalDelivered: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: campaigns } = await supabase.from('campaigns').select('id')
        const { data: contacts } = await supabase.from('contacts').select('id')

        setAnalytics({
          totalCampaigns: campaigns?.length || 0,
          totalContacts: contacts?.length || 0,
          totalSent: 0,
          totalDelivered: 0,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }
    }

    fetchAnalytics()
  }, [supabase])

  return (
    <div className="p-8">
      <DashboardHeader
        title="Welcome to BlinkMail Pro"
        description="Manage your email campaigns and monitor deliverability"
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/campaigns/new" className="block">
          <Button className="w-full h-12 text-base" size="lg">
            <Mail className="w-5 h-5 mr-2" />
            New Campaign
          </Button>
        </Link>
        <Link href="/dashboard/contacts" className="block">
          <Button variant="outline" className="w-full h-12 text-base" size="lg">
            <Users className="w-5 h-5 mr-2" />
            Manage Contacts
          </Button>
        </Link>
        <Link href="/dashboard/domains" className="block">
          <Button variant="outline" className="w-full h-12 text-base" size="lg">
            <TrendingUp className="w-5 h-5 mr-2" />
            Domain Setup
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Campaigns"
          value={analytics.totalCampaigns}
          icon={<Mail className="w-6 h-6" />}
        />
        <MetricCard
          title="Contacts"
          value={analytics.totalContacts}
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Emails Sent"
          value={analytics.totalSent}
          icon={<Send className="w-6 h-6" />}
        />
        <MetricCard
          title="Delivery Rate"
          value={analytics.totalSent > 0 ? `${Math.round((analytics.totalDelivered / analytics.totalSent) * 100)}%` : '0%'}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* Recent Campaigns */}
      <RecentCampaigns />
    </div>
  )
}
