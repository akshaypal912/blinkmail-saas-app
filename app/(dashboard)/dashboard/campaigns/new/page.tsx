'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewCampaignPage() {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name.trim()) {
      setError('Campaign name is required')
      setLoading(false)
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.id) throw new Error('Not authenticated')

      const { data, error: dbError } = await supabase
        .from('campaigns')
        .insert({
          user_id: userData.user.id,
          name: name.trim(),
          subject_line: subject,
          from_email: fromEmail,
          from_name: fromName,
          status: 'draft',
        })
        .select()
        .single()

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${data.id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Create New Campaign"
        description="Start a new email campaign"
      />

      <div className="max-w-2xl">
        {success ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Campaign Created</h2>
            <p className="text-muted-foreground">Redirecting to campaign editor...</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Campaign Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Summer Sale 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Give your campaign a clear, descriptive name
              </p>
            </div>

            {/* Subject Line */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                Email Subject Line
              </label>
              <Input
                id="subject"
                type="text"
                placeholder="Check out our summer collection!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional - you can set this later
              </p>
            </div>

            {/* From Name */}
            <div>
              <label htmlFor="fromName" className="block text-sm font-medium text-foreground mb-2">
                From Name
              </label>
              <Input
                id="fromName"
                type="text"
                placeholder="Your Company"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The name displayed in the "From" field
              </p>
            </div>

            {/* From Email */}
            <div>
              <label htmlFor="fromEmail" className="block text-sm font-medium text-foreground mb-2">
                From Email Address
              </label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be from a verified domain
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
              <Link href="/dashboard/campaigns" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
