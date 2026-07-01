'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code2, Eye } from 'lucide-react'

const emailTemplates = [
  {
    name: 'Blank',
    html: `<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 20px auto; background-color: white; }
      .header { padding: 20px; background-color: #0969da; color: white; text-align: center; }
      .content { padding: 20px; }
      .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome</h1>
      </div>
      <div class="content">
        <p>Your email content goes here.</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`,
  },
  {
    name: 'Newsletter',
    html: `<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 20px auto; background-color: white; }
      .header { padding: 30px 20px; background-color: #0969da; color: white; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; }
      .content { padding: 30px 20px; }
      .article { margin-bottom: 30px; border-bottom: 1px solid #e0e0e0; }
      .article:last-child { border-bottom: none; }
      .article h2 { color: #0969da; margin-top: 0; }
      .cta { text-align: center; margin: 20px 0; }
      .cta a { background-color: #0969da; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; }
      .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Monthly Newsletter</h1>
      </div>
      <div class="content">
        <div class="article">
          <h2>Article Title</h2>
          <p>Article summary and description goes here.</p>
        </div>
        <div class="article">
          <h2>Another Article</h2>
          <p>More content and information here.</p>
        </div>
        <div class="cta">
          <a href="#">Read More</a>
        </div>
      </div>
      <div class="footer">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`,
  },
  {
    name: 'Promotional',
    html: `<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 20px auto; background-color: white; }
      .banner { padding: 40px 20px; background: linear-gradient(135deg, #0969da 0%, #1f6feb 100%); color: white; text-align: center; }
      .banner h1 { margin: 0 0 10px 0; font-size: 32px; }
      .banner p { margin: 0; font-size: 18px; }
      .content { padding: 30px 20px; }
      .offer { background-color: #fff3cd; padding: 20px; border-left: 4px solid #0969da; margin: 20px 0; }
      .cta { text-align: center; margin: 30px 0; }
      .cta a { background-color: #0969da; color: white; padding: 14px 40px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; }
      .footer { padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="banner">
        <h1>Special Offer</h1>
        <p>Limited Time Deal</p>
      </div>
      <div class="content">
        <p>Get 30% off on selected items</p>
        <div class="offer">
          <strong>Offer Details:</strong>
          <p>Valid for 48 hours only. Use code SAVE30 at checkout.</p>
        </div>
        <div class="cta">
          <a href="#">Shop Now</a>
        </div>
      </div>
      <div class="footer">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`,
  },
]

interface EmailTemplateDesignerProps {
  value: string
  onChange: (value: string) => void
}

export function EmailTemplateDesigner({ value, onChange }: EmailTemplateDesignerProps) {
  const [template, setTemplate] = useState(value || '')
  const [preview, setPreview] = useState(true)

  const applyTemplate = (html: string) => {
    console.log('[v0] Applying template, length:', html.length)
    setTemplate(html)
    onChange(html)
  }

  return (
    <div className="space-y-4">
      {/* Template Gallery */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Quick Templates</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {emailTemplates.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => applyTemplate(tmpl.html)}
              className="p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-foreground text-center"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor/Preview Tabs */}
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            HTML Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* HTML Editor */}
        <TabsContent value="code" className="mt-4">
          <textarea
            value={template}
            onChange={(e) => {
              const newValue = e.target.value
              console.log('[v0] Editor changed, new length:', newValue.length)
              setTemplate(newValue)
              onChange(newValue)
            }}
            className="w-full h-96 p-4 border border-border rounded-lg font-mono text-sm bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Paste your HTML or edit here..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Edit the HTML directly or use the preview to see how your email looks.
          </p>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="mt-4">
          <div className="border border-border rounded-lg overflow-hidden bg-white dark:bg-card">
            <iframe
              srcDoc={template}
              className="w-full h-96 border-none"
              title="Email Preview"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This is how your email will appear in most email clients.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
