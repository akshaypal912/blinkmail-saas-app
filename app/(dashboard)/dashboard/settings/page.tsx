'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Profile {
  display_name?: string
  company_name?: string
  email: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user?.id) throw new Error('Not authenticated')

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single()

        if (data) {
          setProfile(data)
          setDisplayName(data.display_name || '')
          setCompanyName(data.company_name || '')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.id) throw new Error('Not authenticated')

      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          company_name: companyName,
        })
        .eq('id', userData.user.id)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="p-8 lg:ml-64 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="max-w-2xl space-y-8">
        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Profile Information</h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-1">
                Full Name
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <Input
                id="companyName"
                type="text"
                placeholder="Your company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-900 rounded-lg flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">Profile updated successfully</p>
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>

        {/* Account Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Account</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Sign out of your account and return to the login page.
              </p>
              <Button
                variant="destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* API Info Section */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
          <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">API Integration</h2>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            BlinkMail Pro is designed to integrate with enterprise email infrastructure including Amazon SES, SendGrid, Mailgun, and custom SMTP servers.
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            API documentation and integration guides coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
