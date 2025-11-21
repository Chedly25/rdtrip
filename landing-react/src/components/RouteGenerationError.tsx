import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface RouteGenerationErrorProps {
  error: string
  onRetry: () => void
  onCancel: () => void
}

export function RouteGenerationError({ error, onRetry, onCancel }: RouteGenerationErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="w-full max-w-2xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-gray-200"
    >
      {/* Error Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.1,
          type: 'spring',
          stiffness: 200,
          damping: 20
        }}
        className="flex justify-center mb-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
          <AlertCircle className="w-8 h-8 text-gray-900" strokeWidth={2} />
        </div>
      </motion.div>

      {/* Error Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          Something went wrong
        </h2>
        <p className="text-base text-gray-600 mb-2">
          We encountered an issue while creating your route
        </p>
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3 mt-4 font-mono">
          {error}
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 justify-center"
      >
        <motion.button
          onClick={onRetry}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </motion.button>

        <motion.button
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
        >
          Cancel
        </motion.button>
      </motion.div>

      {/* Help Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-gray-500 mt-6"
      >
        If the problem persists, please try again later or contact support
      </motion.p>
    </motion.div>
  )
}
