import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

const Badge = ({ variant = 'default', size = 'md', children, className }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap'

  const variants = {
    default: 'bg-rui-black text-white',
    secondary: 'bg-rui-grey-5 text-rui-black',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    outline: 'bg-transparent border border-rui-grey-20 text-rui-grey-50',
  }

  const sizes = {
    sm: 'h-5 px-2 text-body-3',
    md: 'h-6 px-3 text-body-3',
  }

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}

export { Badge }
export type { BadgeProps }
