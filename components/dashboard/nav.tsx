'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { User, LogOut, Menu } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useState } from 'react'

export function DashboardNav({ user }: { user: SupabaseUser | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="bg-card border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between">
      {/* Mobile Menu Button */}
      <button className="lg:hidden p-2 hover:bg-secondary rounded-lg">
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">{user?.email}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
