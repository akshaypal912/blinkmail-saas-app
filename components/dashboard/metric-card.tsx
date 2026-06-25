import { ReactNode } from 'react'

export function MetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string
  value: string | number
  icon: ReactNode
  trend?: { label: string; isPositive: boolean }
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.label}
            </p>
          )}
        </div>
        <div className="text-primary/40 bg-primary/5 p-3 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}
