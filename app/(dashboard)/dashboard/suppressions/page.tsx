'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Search } from 'lucide-react'

interface SuppressionEntry {
  id: string
  email: string
  reason: string
  created_at: string
}

export default function SuppressionsPage() {
  const [entries, setEntries] = useState<SuppressionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchSuppressions = async () => {
      try {
        const { data } = await supabase
          .from('suppression_list')
          .select('*')
          .order('created_at', { ascending: false })

        setEntries(data || [])
      } catch (error) {
        console.error('Error fetching suppressions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuppressions()
  }, [supabase])

  const filteredEntries = entries.filter((entry) =>
    entry.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('suppression_list').delete().eq('id', id)
      setEntries(entries.filter((e) => e.id !== id))
    } catch (error) {
      console.error('Error deleting suppression:', error)
    }
  }

  const getReaseonColor = (reason: string) => {
    switch (reason) {
      case 'bounce':
        return 'destructive'
      case 'complaint':
        return 'secondary'
      case 'unsubscribe':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Suppression List"
        description="Manage bounced, complained, and unsubscribed addresses"
      />

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Addresses on the suppression list will not receive future campaign emails to protect your sender reputation.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search addresses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppressions Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No suppressed addresses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Email Address
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-mono">
                      {entry.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getReaseonColor(entry.reason)}>
                        {entry.reason}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(entry.id)}
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
      {filteredEntries.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} suppressed addresses
        </div>
      )}
    </div>
  )
}
