import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatProps {
  icon?: LucideIcon
  label: string
  value: string | number
  subValue?: string
  className?: string
}

const Stat = ({ icon: Icon, label, value, subValue, className }: StatProps) => {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {Icon && (
        <div className="w-9 h-9 rounded-rui-12 bg-rui-grey-5 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-rui-grey-50" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-body-3 text-rui-grey-50 mb-0.5">{label}</p>
        <p className="text-heading-3 text-rui-black truncate">{value}</p>
        {subValue && (
          <p className="text-body-3 text-rui-grey-50 mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  )
}

// Compact version for grids
interface StatCompactProps {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
}

const StatCompact = ({ label, value, icon, className }: StatCompactProps) => {
  return (
    <div className={cn('text-center', className)}>
      {icon && <div className="mb-1">{icon}</div>}
      <p className="text-heading-3 text-rui-black">{value}</p>
      <p className="text-body-3 text-rui-grey-50">{label}</p>
    </div>
  )
}

export { Stat, StatCompact }
export type { StatProps, StatCompactProps }
