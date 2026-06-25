'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Mail,
  Users,
  Send,
  Settings,
  Globe,
  BarChart3,
  Ban,
} from 'lucide-react'

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Campaigns',
    icon: Mail,
    href: '/dashboard/campaigns',
  },
  {
    label: 'Contacts',
    icon: Users,
    href: '/dashboard/contacts',
  },
  {
    label: 'Templates',
    icon: Send,
    href: '/dashboard/templates',
  },
  {
    label: 'Domains',
    icon: Globe,
    href: '/dashboard/domains',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
  },
  {
    label: 'Suppressions',
    icon: Ban,
    href: '/dashboard/suppressions',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:flex-col lg:w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <span className="text-lg font-bold text-primary-foreground">⚡</span>
          </div>
          <span className="font-bold text-lg text-foreground hidden md:inline">BlinkMail</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {routes.map((route) => {
          const Icon = route.icon
          const isActive = pathname === route.href || pathname.startsWith(route.href + '/')

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{route.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-2">
        <p className="text-xs text-muted-foreground">BlinkMail Pro</p>
        <p className="text-xs text-muted-foreground">Enterprise Email Platform</p>
      </div>
    </div>
  )
}
