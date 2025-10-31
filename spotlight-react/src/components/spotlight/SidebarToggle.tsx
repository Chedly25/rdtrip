import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayout } from '../../contexts/LayoutContext'

export function SidebarToggle() {
  const { isSidebarCollapsed, toggleSidebar } = useLayout()

  return (
    <AnimatePresence>
      <motion.button
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 group"
        onClick={toggleSidebar}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-premium-hover border border-gray-200 transition-all group-hover:shadow-premium-xl">
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-700" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          )}
        </div>

        {/* Tooltip */}
        <motion.div
          className="absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <div className="rounded-lg bg-black/90 px-3 py-2 text-xs text-white">
            {isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          </div>
        </motion.div>
      </motion.button>
    </AnimatePresence>
  )
}
