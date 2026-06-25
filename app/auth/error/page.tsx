import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full mb-6">
            <span className="text-2xl">!</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
          <p className="text-muted-foreground mb-6">
            Something went wrong during the authentication process. Please try again.
          </p>

          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full">Return to Sign In</Button>
            </Link>
            <Link href="/auth/sign-up" className="block">
              <Button variant="outline" className="w-full">Create New Account</Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            If you continue experiencing issues, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
