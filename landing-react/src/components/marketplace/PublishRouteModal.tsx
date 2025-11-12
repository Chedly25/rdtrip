import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { DifficultyLevel, RouteSeason } from '../../types'

interface PublishRouteModalProps {
  isOpen: boolean
  onClose: () => void
  routeId: string
  token: string
}

export default function PublishRouteModal({
  isOpen,
  onClose,
  routeId,
  token
}: PublishRouteModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: '',
    difficultyLevel: 'moderate' as DifficultyLevel,
    primaryStyle: 'best-overall',
    tags: '',
    bestSeason: 'year-round' as RouteSeason,
    isPremium: false,
    price: ''
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    if (formData.description.trim().length < 50) {
      setError('Description must be at least 50 characters')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const response = await fetch(`/api/routes/${routeId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          coverImageUrl: formData.coverImageUrl || null,
          difficultyLevel: formData.difficultyLevel,
          primaryStyle: formData.primaryStyle,
          tags,
          bestSeason: formData.bestSeason,
          isPremium: formData.isPremium,
          price: formData.isPremium && formData.price ? parseFloat(formData.price) : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish route')
      }

      const result = await response.json()
      setPublishedSlug(result.publishedRoute.slug)
      setSuccess(true)

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose()
        // Reset form
        setFormData({
          title: '',
          description: '',
          coverImageUrl: '',
          difficultyLevel: 'moderate',
          primaryStyle: 'best-overall',
          tags: '',
          bestSeason: 'year-round',
          isPremium: false,
          price: ''
        })
        setSuccess(false)
        setPublishedSlug(null)
      }, 3000)
    } catch (err) {
      console.error('Error publishing route:', err)
      setError(err instanceof Error ? err.message : 'Failed to publish route')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Publish Route to Marketplace</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                Share your amazing route with the community
              </p>
            </div>

            {/* Success State */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 bg-white flex items-center justify-center z-10"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Route Published Successfully!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your route is now live on the marketplace
                  </p>
                  {publishedSlug && (
                    <a
                      href={`/marketplace/${publishedSlug}`}
                      className="text-blue-600 hover:underline"
                    >
                      View your published route →
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="p-6 space-y-6">
                {/* Error Alert */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Route Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Epic Road Trip Through Southern France"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={255}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/255 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your route, what makes it special, highlights, tips for travelers..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length} characters (minimum 50)
                  </p>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Cover Image URL (optional)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.coverImageUrl}
                        onChange={(e) => handleChange('coverImageUrl', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Row: Difficulty & Style */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Difficulty Level *
                    </label>
                    <select
                      value={formData.difficultyLevel}
                      onChange={(e) => handleChange('difficultyLevel', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="challenging">Challenging</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Primary Style
                    </label>
                    <select
                      value={formData.primaryStyle}
                      onChange={(e) => handleChange('primaryStyle', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="adventure">Adventure</option>
                      <option value="culture">Culture</option>
                      <option value="food">Food & Wine</option>
                      <option value="hidden_gems">Hidden Gems</option>
                      <option value="best-overall">Best Overall</option>
                    </select>
                  </div>
                </div>

                {/* Best Season */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Best Season to Visit
                  </label>
                  <select
                    value={formData.bestSeason}
                    onChange={(e) => handleChange('bestSeason', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                    <option value="year-round">Year-round</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="e.g., coastal, wine-tasting, romantic, family-friendly"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add keywords to help others discover your route
                  </p>
                </div>

                {/* Premium (future feature - disabled for now) */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => handleChange('isPremium', e.target.checked)}
                      disabled
                      className="h-4 w-4 text-blue-600 rounded opacity-50 cursor-not-allowed"
                    />
                    <label className="text-sm font-semibold text-gray-600">
                      Premium Route (Coming Soon)
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Monetize your route by making it a paid premium template
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish Route
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
