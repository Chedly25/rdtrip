/**
 * Feature Empty States - Wanderlust Editorial Design
 *
 * Beautiful empty state components that guide users to discover
 * and use collaboration and expense tracking features.
 */

import { motion } from 'framer-motion'
import {
  Users,
  Receipt,
  UserPlus,
  DollarSign,
  MessageSquare,
  Vote,
  Camera,
  Split,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

interface EmptyStateProps {
  onAction?: () => void
  className?: string
}

/**
 * Collaboration Empty State
 * Shows when no collaborators have been invited yet
 */
export function CollaborationEmptyState({ onAction, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-8 px-6 text-center ${className}`}
    >
      {/* Decorative icon group */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(107, 142, 123, 0.15) 0%, rgba(107, 142, 123, 0.25) 100%)',
          }}
        >
          <Users className="w-10 h-10" style={{ color: '#6B8E7B' }} />
        </motion.div>

        {/* Floating accent icons */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #D4A853 0%, #E8C547 100%)' }}
        >
          <MessageSquare className="w-4 h-4 text-white" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute -bottom-1 -left-2 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: '#C45830' }}
        >
          <Vote className="w-3.5 h-3.5 text-white" />
        </motion.div>
      </div>

      {/* Title and description */}
      <h3
        className="text-lg font-semibold mb-2"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          color: '#2C2417',
          letterSpacing: '-0.02em',
        }}
      >
        Plan Together
      </h3>
      <p
        className="text-sm mb-4 max-w-[240px]"
        style={{ color: '#8B7355', lineHeight: 1.5 }}
      >
        Invite friends and family to collaborate on this trip. Chat, vote on stops, and plan as a group.
      </p>

      {/* Feature highlights */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {[
          { icon: <MessageSquare className="w-3 h-3" />, label: 'Group chat' },
          { icon: <Vote className="w-3 h-3" />, label: 'Vote on stops' },
          { icon: <Users className="w-3 h-3" />, label: 'Real-time sync' },
        ].map((feature, i) => (
          <motion.span
            key={feature.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(107, 142, 123, 0.12)',
              color: '#5A7D6A',
            }}
          >
            {feature.icon}
            {feature.label}
          </motion.span>
        ))}
      </div>

      {/* Action button */}
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{
          background: 'linear-gradient(135deg, #6B8E7B 0%, #5A7D6A 100%)',
          boxShadow: '0 4px 14px rgba(107, 142, 123, 0.35)',
        }}
      >
        <UserPlus className="w-4 h-4" />
        Invite Collaborators
        <ArrowRight className="w-3.5 h-3.5" />
      </motion.button>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex items-center gap-1.5 text-xs"
        style={{ color: '#C4B8A5' }}
      >
        <Sparkles className="w-3 h-3" style={{ color: '#D4A853' }} />
        <span>Free to invite unlimited collaborators</span>
      </motion.div>
    </motion.div>
  )
}

/**
 * Expenses Empty State
 * Shows when no expenses have been logged yet
 */
export function ExpensesEmptyState({ onAction, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-8 px-6 text-center ${className}`}
    >
      {/* Decorative icon group */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0.8, rotate: 10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 115, 85, 0.15) 0%, rgba(139, 115, 85, 0.25) 100%)',
          }}
        >
          <Receipt className="w-10 h-10" style={{ color: '#8B7355' }} />
        </motion.div>

        {/* Floating accent icons */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)' }}
        >
          <DollarSign className="w-4 h-4 text-white" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute -bottom-1 -left-2 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: '#D4A853' }}
        >
          <Camera className="w-3.5 h-3.5 text-white" />
        </motion.div>
      </div>

      {/* Title and description */}
      <h3
        className="text-lg font-semibold mb-2"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          color: '#2C2417',
          letterSpacing: '-0.02em',
        }}
      >
        Track Trip Expenses
      </h3>
      <p
        className="text-sm mb-4 max-w-[240px]"
        style={{ color: '#8B7355', lineHeight: 1.5 }}
      >
        Log expenses, scan receipts, and automatically calculate who owes what. No more spreadsheets.
      </p>

      {/* Feature highlights */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {[
          { icon: <Camera className="w-3 h-3" />, label: 'Scan receipts' },
          { icon: <Split className="w-3 h-3" />, label: 'Auto-split costs' },
          { icon: <DollarSign className="w-3 h-3" />, label: 'Multi-currency' },
        ].map((feature, i) => (
          <motion.span
            key={feature.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(139, 115, 85, 0.12)',
              color: '#6B5B4F',
            }}
          >
            {feature.icon}
            {feature.label}
          </motion.span>
        ))}
      </div>

      {/* Action button */}
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{
          background: 'linear-gradient(135deg, #8B7355 0%, #6B5B4F 100%)',
          boxShadow: '0 4px 14px rgba(139, 115, 85, 0.35)',
        }}
      >
        <DollarSign className="w-4 h-4" />
        Add First Expense
        <ArrowRight className="w-3.5 h-3.5" />
      </motion.button>

      {/* Budget tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex items-center gap-1.5 text-xs"
        style={{ color: '#C4B8A5' }}
      >
        <Sparkles className="w-3 h-3" style={{ color: '#D4A853' }} />
        <span>Supports 150+ currencies with live rates</span>
      </motion.div>
    </motion.div>
  )
}
