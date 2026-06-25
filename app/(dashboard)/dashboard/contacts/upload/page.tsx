'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ParsedContact {
  email: string
  first_name?: string
  last_name?: string
}

export default function UploadContactsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [parsed, setParsed] = useState<ParsedContact[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const parseCSV = (csvText: string): ParsedContact[] => {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim())

    const emailIndex = headers.findIndex((h) => h.includes('email'))
    const firstNameIndex = headers.findIndex((h) => h.includes('first'))
    const lastNameIndex = headers.findIndex((h) => h.includes('last'))

    if (emailIndex === -1) {
      throw new Error('CSV must contain an email column')
    }

    const contacts: ParsedContact[] = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue

      const values = lines[i].split(',').map((v) => v.trim())
      const email = values[emailIndex]

      if (email && email.includes('@')) {
        contacts.push({
          email,
          first_name: firstNameIndex !== -1 ? values[firstNameIndex] : undefined,
          last_name: lastNameIndex !== -1 ? values[lastNameIndex] : undefined,
        })
      }
    }

    return contacts
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string
        const contacts = parseCSV(csvText)
        setParsed(contacts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV')
        setParsed([])
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleUpload = async () => {
    if (parsed.length === 0) {
      setError('No valid contacts to upload')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.id) throw new Error('Not authenticated')

      // Check for duplicates and insert
      const contacts = await Promise.all(
        parsed.map(async (contact) => {
          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', contact.email)
            .single()

          if (!existing) {
            return supabase.from('contacts').insert({
              user_id: userData.user.id,
              email: contact.email,
              first_name: contact.first_name,
              last_name: contact.last_name,
              status: 'valid',
            })
          }
          return null
        })
      )

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/contacts')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload contacts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Upload Contacts"
        description="Import contacts from a CSV file"
      />

      <div className="max-w-2xl">
        {success ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Upload Complete</h2>
            <p className="text-muted-foreground mb-6">
              {parsed.length} contacts have been successfully imported
            </p>
            <Link href="/dashboard/contacts">
              <Button>View All Contacts</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-muted-foreground mb-4">
                or click to browse your computer
              </p>
              <p className="text-xs text-muted-foreground">
                CSV file must include an email column
              </p>
            </div>

            {/* File Info */}
            {file && (
              <div className="mt-6 p-4 bg-secondary/50 border border-border rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>File:</strong> {file.name}
                </p>
                <p className="text-sm text-foreground mt-2">
                  <strong>Contacts to import:</strong> {parsed.length}
                </p>
              </div>
            )}

            {/* Preview */}
            {parsed.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Preview</h3>
                <div className="bg-card border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 border-b border-border sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-foreground">Email</th>
                        <th className="px-4 py-2 text-left text-foreground">First Name</th>
                        <th className="px-4 py-2 text-left text-foreground">Last Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsed.slice(0, 10).map((contact, i) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="px-4 py-2 text-foreground font-mono">
                            {contact.email}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {contact.first_name || '—'}
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {contact.last_name || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing 10 of {parsed.length} contacts
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={loading || parsed.length === 0}
                className="flex-1"
              >
                {loading ? 'Uploading...' : 'Upload Contacts'}
              </Button>
              <Link href="/dashboard/contacts" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
