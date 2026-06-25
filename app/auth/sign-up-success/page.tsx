import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <span className="text-2xl">✓</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent a confirmation link to your email. Click the link to verify your account and get started.
          </p>

          <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Once verified, you&apos;ll have full access to BlinkMail Pro&apos;s email campaign and deliverability tools.
            </p>
          </div>

          <Link href="/auth/login">
            <Button className="w-full">Return to Sign In</Button>
          </Link>

          <p className="text-xs text-muted-foreground mt-6">
            Didn&apos;t receive an email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
