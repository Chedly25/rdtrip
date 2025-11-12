import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Camera,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  DollarSign,
  Sparkles
} from 'lucide-react'
import type { ExpenseCategory, SplitMethod, ReceiptData } from '../../types'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  routeId: string
  userId: string
  collaborators: Array<{ id: string; name: string; avatar?: string }>
  onSuccess: () => void
}

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'accommodation',
  'transportation',
  'activities',
  'fuel',
  'tolls',
  'parking',
  'shopping',
  'other'
]

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  accommodation: '🏨',
  food: '🍽️',
  transportation: '🚗',
  activities: '🎭',
  shopping: '🛍️',
  fuel: '⛽',
  tolls: '🛣️',
  parking: '🅿️',
  other: '📝'
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK']

export function AddExpenseModal({
  isOpen,
  onClose,
  routeId,
  userId,
  collaborators,
  onSuccess
}: AddExpenseModalProps) {
  // Form state
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [participants, setParticipants] = useState<string[]>([userId])

  // Receipt scanning state
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannedData, setScannedData] = useState<ReceiptData | null>(null)
  const [showAiSuggestion, setShowAiSuggestion] = useState(false)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle receipt file selection
  async function handleReceiptUpload(file: File) {
    try {
      setIsScanning(true)
      setScanError(null)

      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('receipt', file)

      const response = await fetch(`/api/routes/${routeId}/expenses/scan-receipt`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to scan receipt')
      }

      const result = await response.json()
      const data: ReceiptData = result.data

      // Auto-fill form with scanned data
      setDescription(data.description || data.merchant || '')
      setAmount(data.amount.toString())
      setCurrency(data.currency || 'EUR')
      setExpenseDate(data.date || new Date().toISOString().split('T')[0])
      setLocation(data.location || '')

      // Set AI-suggested category
      if (data.aiCategory) {
        setCategory(data.aiCategory as ExpenseCategory)
        setShowAiSuggestion(true)
      }

      setScannedData(data)
    } catch (err) {
      console.error('Receipt scanning error:', err)
      setScanError(err instanceof Error ? err.message : 'Failed to scan receipt')
    } finally {
      setIsScanning(false)
    }
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate
    if (!description.trim() || !amount || participants.length === 0) {
      setError('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/routes/${routeId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          description: description.trim(),
          category,
          amount: parseFloat(amount),
          currency,
          expenseDate,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
          splitMethod,
          participants,
          receiptData: scannedData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create expense')
      }

      // Success!
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('Error creating expense:', err)
      setError(err instanceof Error ? err.message : 'Failed to create expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset and close
  function handleClose() {
    setDescription('')
    setCategory('food')
    setAmount('')
    setCurrency('EUR')
    setExpenseDate(new Date().toISOString().split('T')[0])
    setLocation('')
    setNotes('')
    setSplitMethod('equal')
    setParticipants([userId])
    setScannedData(null)
    setShowAiSuggestion(false)
    setError(null)
    setSuccess(false)
    setScanError(null)
    onClose()
  }

  // Toggle participant
  function toggleParticipant(participantId: string) {
    setParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Expense</h2>
              <p className="text-xs text-gray-600">Track a new trip expense</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Success message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">Expense added!</p>
                  <p className="text-xs text-green-700 mt-0.5">Your expense has been saved.</p>
                </div>
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-900">{error}</p>
              </motion.div>
            )}

            {/* Receipt scanning */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="text-center">
                <Camera className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Scan Receipt (Optional)
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  AI will extract details automatically
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleReceiptUpload(file)
                  }}
                  className="hidden"
                />

                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload Receipt</span>
                      </>
                    )}
                  </button>
                </div>

                {scanError && (
                  <p className="text-xs text-red-600 mt-2">{scanError}</p>
                )}

                {scannedData && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        Receipt scanned! Form auto-filled.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Dinner at La Piazza"
                disabled={isSubmitting || success}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
                {showAiSuggestion && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    ✨ AI suggested
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    disabled={isSubmitting || success}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      category === cat
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                    <div className="text-xs font-medium text-gray-700 capitalize">
                      {cat}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting || success}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isSubmitting || success}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="expenseDate"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  disabled={isSubmitting || success}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Rome, Italy"
                  disabled={isSubmitting || success}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Split method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Method
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMethod('equal')}
                  disabled={isSubmitting || success}
                  className={`flex-1 px-4 py-2 border-2 rounded-lg text-sm font-medium ${
                    splitMethod === 'equal'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod('custom')}
                  disabled={isSubmitting || success}
                  className={`flex-1 px-4 py-2 border-2 rounded-lg text-sm font-medium ${
                    splitMethod === 'custom'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Custom Split
                </button>
              </div>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Among <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <label
                    key={collab.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={participants.includes(collab.id)}
                      onChange={() => toggleParticipant(collab.id)}
                      disabled={isSubmitting || success}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                      {collab.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{collab.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                disabled={isSubmitting || success}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success || !description || !amount || participants.length === 0}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : success ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Added!</span>
                  </>
                ) : (
                  <span>Add Expense</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
