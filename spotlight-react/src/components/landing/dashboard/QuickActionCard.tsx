/**
 * Quick Action Card - Wanderlust Editorial Design
 *
 * Beautiful action cards that guide users to key features.
 * Each card has a unique color from the Wanderlust palette.
 */

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface QuickActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  color: 'terracotta' | 'golden' | 'sage' | 'blue'
  badge?: string
}

const colorMap = {
  terracotta: {
    bg: 'linear-gradient(135deg, rgba(196, 88, 48, 0.08) 0%, rgba(196, 88, 48, 0.15) 100%)',
    iconBg: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
    border: 'rgba(196, 88, 48, 0.2)',
    text: '#C45830',
    hoverBg: 'rgba(196, 88, 48, 0.12)',
  },
  golden: {
    bg: 'linear-gradient(135deg, rgba(212, 168, 83, 0.08) 0%, rgba(212, 168, 83, 0.15) 100%)',
    iconBg: 'linear-gradient(135deg, #D4A853 0%, #C49A48 100%)',
    border: 'rgba(212, 168, 83, 0.2)',
    text: '#B8923D',
    hoverBg: 'rgba(212, 168, 83, 0.12)',
  },
  sage: {
    bg: 'linear-gradient(135deg, rgba(107, 142, 123, 0.08) 0%, rgba(107, 142, 123, 0.15) 100%)',
    iconBg: 'linear-gradient(135deg, #6B8E7B 0%, #5A7D6A 100%)',
    border: 'rgba(107, 142, 123, 0.2)',
    text: '#5A7D6A',
    hoverBg: 'rgba(107, 142, 123, 0.12)',
  },
  blue: {
    bg: 'linear-gradient(135deg, rgba(91, 110, 140, 0.08) 0%, rgba(91, 110, 140, 0.15) 100%)',
    iconBg: 'linear-gradient(135deg, #5B6E8C 0%, #4A5D7B 100%)',
    border: 'rgba(91, 110, 140, 0.2)',
    text: '#4A5D7B',
    hoverBg: 'rgba(91, 110, 140, 0.12)',
  },
}

export function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  color,
  badge,
}: QuickActionCardProps) {
  const colors = colorMap[color]

  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative block rounded-2xl p-6 transition-all duration-300 overflow-hidden"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Badge */}
      {badge && (
        <div
          className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: colors.iconBg }}
        >
          {badge}
        </div>
      )}

      {/* Icon */}
      <div
        className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm"
        style={{ background: colors.iconBg }}
      >
        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <h3
        className="text-lg font-semibold mb-1.5 transition-colors"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          color: '#2C2417',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed mb-4"
        style={{ color: '#8B7355' }}
      >
        {description}
      </p>

      {/* Arrow indicator */}
      <div
        className="flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2.5"
        style={{ color: colors.text }}
      >
        <span>Get started</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Hover gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: colors.hoverBg }}
      />
    </motion.a>
  )
}
