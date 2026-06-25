'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Trash2, Edit2, Copy } from 'lucide-react'

interface Template {
  id: string
  name: string
  subject_line?: string
  created_at: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false })

        setTemplates(data || [])
      } catch (error) {
        console.error('Error fetching templates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [supabase])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await supabase.from('email_templates').delete().eq('id', id)
      setTemplates(templates.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleDuplicate = async (template: Template) => {
    try {
      const { error } = await supabase.from('email_templates').insert({
        name: `${template.name} (Copy)`,
        subject_line: template.subject_line,
      })

      if (!error) {
        // Refresh templates
        const { data } = await supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false })

        setTemplates(data || [])
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
    }
  }

  return (
    <div className="p-8 lg:ml-64">
      <DashboardHeader
        title="Email Templates"
        description="Create and manage reusable email templates"
      />

      {/* Create Template */}
      <div className="mb-6">
        <Link href="/dashboard/campaigns/new">
          <Button>Create New Template</Button>
        </Link>
      </div>

      {/* Templates List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No templates created yet</p>
            <Link href="/dashboard/campaigns/new">
              <Button>Create Your First Template</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-6 hover:bg-secondary/30 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.subject_line ? `Subject: ${template.subject_line}` : 'No subject line'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="text-primary hover:text-primary/80 transition-colors p-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="text-primary hover:text-primary/80 transition-colors p-2">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
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
