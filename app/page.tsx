'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-20">
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 text-center">
          {/* Logo and Title */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-3">
              <svg
                className="size-12 text-primary"
                fill="none"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                strokeWidth="0.5"
              >
                <path
                  d="M14.2 14.2H17V6.9375C17 4.76288 15.2371 3 13.0625 3H5.8V5.8M14.2 14.2V7.79063L7.79062 14.2H14.2ZM14.2 14.2V17H6.9375C4.76288 17 3 15.2371 3 13.0625V5.8H5.8M5.8 5.8V12.2313L12.2313 5.8H5.8Z"
                  strokeLinejoin="round"
                />
              </svg>
              <h1 className="text-4xl font-bold">BlinkMail Pro</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Professional Email Campaign & Deliverability Platform
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="text-2xl font-semibold text-primary">📊</div>
              <h3 className="mt-3 font-semibold">Smart Analytics</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Track delivery, opens, clicks, bounces, and more
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="text-2xl font-semibold text-primary">✉️</div>
              <h3 className="mt-3 font-semibold">Email Designer</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create beautiful campaigns with drag-and-drop builder
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="text-2xl font-semibold text-primary">🛡️</div>
              <h3 className="mt-3 font-semibold">Full Compliance</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                SPF, DKIM, DMARC setup & deliverability management
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="default" size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="outline" size="lg">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Description */}
          <p className="max-w-2xl text-sm text-muted-foreground">
            BlinkMail Pro is built for enterprise teams who need professional email
            operations. Manage contacts, design campaigns, verify domains, and monitor
            deliverability all in one place.
          </p>
        </div>
      </div>
    </main>
  )
}
