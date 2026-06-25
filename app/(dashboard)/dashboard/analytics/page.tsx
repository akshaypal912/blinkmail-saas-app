'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { MetricCard } from '@/components/dashboard/metric-card'
import { BarChart3, TrendingUp, Mail, CheckCircle } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Analytics"
        description="Campaign performance and deliverability metrics"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Sent"
          value="0"
          icon={<Mail className="w-6 h-6" />}
          trend={{ label: 'No campaigns sent yet', isPositive: true }}
        />
        <MetricCard
          title="Delivered"
          value="0"
          icon={<CheckCircle className="w-6 h-6" />}
          trend={{ label: '0% delivery rate', isPositive: true }}
        />
        <MetricCard
          title="Open Rate"
          value="0%"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ label: 'No opens yet', isPositive: true }}
        />
        <MetricCard
          title="Click Rate"
          value="0%"
          icon={<BarChart3 className="w-6 h-6" />}
          trend={{ label: 'No clicks yet', isPositive: true }}
        />
      </div>

      {/* Coming Soon */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Advanced Analytics Coming Soon</h2>
        <p className="text-muted-foreground">
          Detailed campaign performance charts, engagement trends, and deliverability reports will be available soon.
        </p>
      </div>
    </div>
  )
}
