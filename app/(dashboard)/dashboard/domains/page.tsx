'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Trash2, Edit2, Globe, CheckCircle, Clock } from 'lucide-react'

interface Domain {
  id: string
  domain: string
  status: string
  verified_at?: string
  created_at: string
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const { data } = await supabase
          .from('domains')
          .select('*')
          .order('created_at', { ascending: false })

        setDomains(data || [])
      } catch (error) {
        console.error('Error fetching domains:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDomains()
  }, [supabase])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return

    try {
      await supabase.from('domains').delete().eq('id', id)
      setDomains(domains.filter((d) => d.id !== id))
    } catch (error) {
      console.error('Error deleting domain:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'verified') return <CheckCircle className="w-4 h-4 text-green-600" />
    return <Clock className="w-4 h-4 text-yellow-600" />
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Domain Configuration"
        description="Setup and verify your sending domains"
      />

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Configure SPF, DKIM, and DMARC records for your sending domains to improve deliverability and prevent spoofing.
        </p>
      </div>

      {/* Add Domain Button */}
      <div className="mb-6">
        <Link href="/dashboard/domains/add">
          <Button>
            <Globe className="w-4 h-4 mr-2" />
            Add New Domain
          </Button>
        </Link>
      </div>

      {/* Domains List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : domains.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No domains configured yet</p>
            <Link href="/dashboard/domains/add">
              <Button>Add Your First Domain</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="p-6 hover:bg-secondary/30 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{domain.domain}</h3>
                    <Badge
                      variant={domain.status === 'verified' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(domain.status)}
                      {domain.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(domain.created_at).toLocaleDateString()}
                    {domain.verified_at &&
                      ` • Verified ${new Date(domain.verified_at).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/domains/${domain.id}`}>
                    <button className="text-primary hover:text-primary/80 transition-colors p-2">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(domain.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
