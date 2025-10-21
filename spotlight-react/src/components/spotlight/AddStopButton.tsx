import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface AddStopButtonProps {
  onAdd: () => void
  position: 'before' | 'after'
}

export function AddStopButton({ onAdd, position: _position }: AddStopButtonProps) {
  return (
    <motion.button
      onClick={onAdd}
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1, scale: 1.02 }}
      className="group relative w-full rounded-xl border-2 border-dashed border-primary-200 bg-gradient-to-r from-primary-50 to-purple-50 px-6 py-4 text-primary-600 opacity-0 transition-all hover:border-primary-400 hover:shadow-md"
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
        className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"
        initial={false}
      />
    </motion.button>
  )
}
