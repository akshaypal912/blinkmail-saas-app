'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Copy } from 'lucide-react'
import Link from 'next/link'

export default function AddDomainPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [records, setRecords] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const generateDNSRecords = (domainName: string) => {
    return {
      spf: {
        type: 'TXT',
        name: `@`,
        value: `v=spf1 include:sendgrid.net ~all`,
      },
      dkim: {
        type: 'CNAME',
        name: `s1._domainkey`,
        value: `s1.domainkey.sendgrid.net`,
      },
      dmarc: {
        type: 'TXT',
        name: `_dmarc`,
        value: `v=DMARC1; p=quarantine; rua=mailto:admin@${domainName}`,
      },
    }
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!domain.trim()) {
      setError('Domain name is required')
      setLoading(false)
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.id) throw new Error('Not authenticated')

      const { error: dbError } = await supabase.from('domains').insert({
        user_id: userData.user.id,
        domain: domain.trim(),
        status: 'pending_verification',
      })

      if (dbError) throw dbError

      setRecords(generateDNSRecords(domain.trim()))
      setSuccess(true)

      setTimeout(() => {
        router.push('/dashboard/domains')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Add New Domain"
        description="Setup a domain for sending emails"
      />

      <div className="max-w-3xl">
        {success ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Domain Added</h2>
            <p className="text-muted-foreground mb-4">
              Please configure the DNS records below to verify your domain.
            </p>
            {records && (
              <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-6 text-left space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">SPF Record</p>
                  <div className="bg-card p-3 rounded border border-border flex items-center justify-between">
                    <code className="text-xs text-foreground font-mono">{records.spf.value}</code>
                    <button
                      onClick={() => copyToClipboard(records.spf.value)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">DKIM Record</p>
                  <div className="bg-card p-3 rounded border border-border flex items-center justify-between">
                    <code className="text-xs text-foreground font-mono">{records.dkim.value}</code>
                    <button
                      onClick={() => copyToClipboard(records.dkim.value)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">DMARC Record</p>
                  <div className="bg-card p-3 rounded border border-border flex items-center justify-between">
                    <code className="text-xs text-foreground font-mono truncate">{records.dmarc.value}</code>
                    <button
                      onClick={() => copyToClipboard(records.dmarc.value)}
                      className="text-primary hover:text-primary/80 flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Redirecting to domains...</p>
          </div>
        ) : (
          <form onSubmit={handleAddDomain} className="space-y-6">
            {/* Domain Input */}
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-foreground mb-2">
                Domain Name
              </label>
              <Input
                id="domain"
                type="text"
                placeholder="mail.example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use a subdomain like mail.yourdomain.com for best practices
              </p>
            </div>

            {/* DNS Info Tabs */}
            <Tabs defaultValue="spf" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="spf">SPF</TabsTrigger>
                <TabsTrigger value="dkim">DKIM</TabsTrigger>
                <TabsTrigger value="dmarc">DMARC</TabsTrigger>
              </TabsList>

              <TabsContent value="spf" className="mt-4 space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">SPF Record</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Sender Policy Framework (SPF) helps prevent email spoofing by specifying which mail servers can send emails from your domain.
                  </p>
                  <div className="bg-white dark:bg-card p-3 rounded border border-border font-mono text-xs text-foreground break-all">
                    v=spf1 include:sendgrid.net ~all
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dkim" className="mt-4 space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">DKIM Record</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    DomainKeys Identified Mail (DKIM) adds a digital signature to your emails, proving they come from your domain.
                  </p>
                  <div className="bg-white dark:bg-card p-3 rounded border border-border font-mono text-xs text-foreground break-all">
                    s1._domainkey CNAME s1.domainkey.sendgrid.net
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dmarc" className="mt-4 space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">DMARC Record</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Domain-based Message Authentication, Reporting and Conformance (DMARC) helps protect your brand from email fraud.
                  </p>
                  <div className="bg-white dark:bg-card p-3 rounded border border-border font-mono text-xs text-foreground break-all">
                    v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Error */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !domain.trim()}
              >
                {loading ? 'Adding...' : 'Add Domain'}
              </Button>
              <Link href="/dashboard/domains">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
