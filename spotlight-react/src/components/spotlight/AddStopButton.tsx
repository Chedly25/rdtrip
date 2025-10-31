import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

interface AddStopButtonProps {
  onAdd: () => void
  position: 'before' | 'after'
}

export function AddStopButton({ onAdd, position: _position }: AddStopButtonProps) {
  const { routeData } = useRouteDataStore()
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  return (
    <motion.button
      onClick={onAdd}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 0.6, height: 'auto' }}
      whileHover={{ opacity: 1, scale: 1.02 }}
      className="group relative w-full overflow-hidden rounded-xl border-2 border-dashed px-6 py-4 transition-all hover:shadow-lg"
      style={{
        borderColor: `${theme.primary}80`,
        background: `linear-gradient(to right, ${theme.primary}15, ${theme.secondary}15)`,
        color: theme.primary,
      }}
    >
      <div className="flex items-center justify-center gap-2">
        <motion.div
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
        >
          <Plus className="h-5 w-5" />
        </motion.div>
        <span className="font-semibold">Add Stop Here</span>
      </div>

      {/* Decorative gradient on hover */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-xl opacity-0 blur-xl transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(to right, ${theme.primary}30, ${theme.secondary}30)`,
        }}
        initial={false}
      />
    </motion.button>
  )
}
