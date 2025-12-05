/**
 * Add Expense Modal - "The Travel Ledger"
 *
 * A warm, editorial-style expense tracking modal inspired by vintage
 * travel journals and accounting ledgers. Features hand-crafted aesthetics
 * with the Wanderlust Editorial color palette.
 *
 * Design: Warm cream backgrounds, terracotta accents, golden highlights,
 * with subtle paper textures and elegant typography.
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Camera,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  Receipt,
  Sparkles,
  MapPin,
  Calendar,
  SplitSquareHorizontal,
  FileText,
  UtensilsCrossed,
  Hotel,
  Car,
  Ticket,
  Fuel,
  CircleDollarSign,
  ParkingCircle,
  ShoppingBag,
  MoreHorizontal,
  type LucideIcon
} from 'lucide-react'
import type { ExpenseCategory, SplitMethod, ReceiptData } from '../../types'

// =============================================================================
// WANDERLUST EDITORIAL COLOR PALETTE
// =============================================================================
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  parchment: '#F5E6C8',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  terracottaDark: '#A04020',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  espresso: '#2C2417',
  darkBrown: '#3D2A1E',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',
  warmGray: '#E8DFD3',
}

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

// Category configuration with proper React icons and refined colors
const CATEGORY_CONFIG: Record<ExpenseCategory, {
  Icon: LucideIcon
  label: string
  color: string
  bgColor: string
}> = {
  food: {
    Icon: UtensilsCrossed,
    label: 'Dining',
    color: colors.terracotta,
    bgColor: `${colors.terracotta}12`
  },
  accommodation: {
    Icon: Hotel,
    label: 'Lodging',
    color: colors.sage,
    bgColor: `${colors.sage}15`
  },
  transportation: {
    Icon: Car,
    label: 'Transport',
    color: '#5B7C99',
    bgColor: 'rgba(91, 124, 153, 0.12)'
  },
  activities: {
    Icon: Ticket,
    label: 'Activities',
    color: colors.golden,
    bgColor: `${colors.golden}15`
  },
  fuel: {
    Icon: Fuel,
    label: 'Fuel',
    color: '#7B6B5B',
    bgColor: 'rgba(123, 107, 91, 0.12)'
  },
  tolls: {
    Icon: CircleDollarSign,
    label: 'Tolls',
    color: colors.mediumBrown,
    bgColor: `${colors.mediumBrown}12`
  },
  parking: {
    Icon: ParkingCircle,
    label: 'Parking',
    color: '#6B8E8E',
    bgColor: 'rgba(107, 142, 142, 0.12)'
  },
  shopping: {
    Icon: ShoppingBag,
    label: 'Shopping',
    color: colors.terracottaLight,
    bgColor: `${colors.terracottaLight}12`
  },
  other: {
    Icon: MoreHorizontal,
    label: 'Other',
    color: colors.lightBrown,
    bgColor: `${colors.lightBrown}12`
  }
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

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Please log in to scan receipts')
      }

      // Check if route is saved
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeId)
      if (!isValidUUID) {
        throw new Error('Please save your route first to scan receipts')
      }

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
      const token = localStorage.getItem('token')

      // Check if user is authenticated
      if (!token) {
        setError('Please log in to track expenses')
        setIsSubmitting(false)
        return
      }

      // Check if route is saved (has valid UUID format)
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeId)
      if (!isValidUUID) {
        setError('Please save your route first to track expenses')
        setIsSubmitting(false)
        return
      }

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

  // Shared input styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontFamily: 'Georgia, serif',
    fontSize: '14px',
    color: colors.espresso,
    background: colors.warmWhite,
    border: `1px solid ${colors.warmGray}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: '"Courier New", monospace',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: colors.mediumBrown,
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
  }

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(44, 36, 23, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
            borderRadius: '20px',
            border: `1px solid ${colors.warmGray}`,
            boxShadow: `0 25px 50px -12px rgba(44, 36, 23, 0.4), inset 0 1px 0 rgba(255,255,255,0.5)`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Ledger Style */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: `2px solid ${colors.golden}`,
              background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
              position: 'relative',
            }}
          >
            {/* Decorative top border */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${colors.terracotta} 0%, ${colors.golden} 50%, ${colors.terracotta} 100%)`,
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px rgba(196, 88, 48, 0.3)`,
                  }}
                >
                  <Receipt style={{ width: 22, height: 22, color: 'white' }} />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: '20px',
                      fontWeight: 600,
                      color: colors.espresso,
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Travel Ledger
                  </h2>
                  <p
                    style={{
                      fontFamily: '"Courier New", monospace',
                      fontSize: '11px',
                      letterSpacing: '1px',
                      color: colors.lightBrown,
                      marginTop: '2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Record a new expense
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: `${colors.terracotta}15` }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: `1px solid ${colors.warmGray}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  color: colors.lightBrown,
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <form onSubmit={handleSubmit}>
              {/* Success message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    background: `${colors.sage}15`,
                    border: `1px solid ${colors.sage}`,
                    borderRadius: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <Check style={{ width: 20, height: 20, color: colors.sage, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: 600, color: colors.sage, margin: 0 }}>
                      Expense recorded!
                    </p>
                    <p style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: colors.sageLight, marginTop: '2px' }}>
                      Your expense has been added to the ledger.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    background: `${colors.terracotta}10`,
                    border: `1px solid ${colors.terracotta}`,
                    borderRadius: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle style={{ width: 20, height: 20, color: colors.terracotta, flexShrink: 0 }} />
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: colors.terracotta, margin: 0 }}>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Receipt Scanning - Vintage ticket style */}
              <div
                style={{
                  border: `2px dashed ${colors.golden}`,
                  borderRadius: '12px',
                  padding: '20px',
                  background: `${colors.parchment}30`,
                  marginBottom: '24px',
                  textAlign: 'center',
                }}
              >
                <Camera style={{ width: 32, height: 32, color: colors.golden, margin: '0 auto 12px' }} />
                <h3
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.espresso,
                    marginBottom: '4px',
                  }}
                >
                  Scan Receipt
                </h3>
                <p
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '11px',
                    color: colors.lightBrown,
                    marginBottom: '16px',
                  }}
                >
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
                  style={{ display: 'none' }}
                />

                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '10px 20px',
                    background: isScanning ? colors.lightBrown : `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenLight} 100%)`,
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: 'white',
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isScanning ? 'none' : `0 4px 12px rgba(212, 168, 83, 0.35)`,
                  }}
                >
                  {isScanning ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Upload style={{ width: 16, height: 16 }} />
                      <span>Upload Receipt</span>
                    </>
                  )}
                </motion.button>

                {scanError && (
                  <p style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: colors.terracotta, marginTop: '12px' }}>
                    {scanError}
                  </p>
                )}

                {scannedData && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px',
                      background: `${colors.sage}15`,
                      border: `1px solid ${colors.sage}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sparkles style={{ width: 14, height: 14, color: colors.sage }} />
                    <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: colors.sage, fontWeight: 600 }}>
                      Receipt scanned! Form auto-filled.
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Description <span style={{ color: colors.terracotta }}>*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner at La Piazza"
                  disabled={isSubmitting || success}
                  style={{
                    ...inputStyle,
                    opacity: isSubmitting || success ? 0.6 : 1,
                  }}
                  required
                />
              </div>

              {/* Category Grid - Refined Icon Buttons */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>
                  Category <span style={{ color: colors.terracotta }}>*</span>
                  {showAiSuggestion && (
                    <span style={{ marginLeft: '8px', color: colors.golden, fontWeight: 400, fontStyle: 'italic', textTransform: 'none' }}>
                      ✨ AI suggested
                    </span>
                  )}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {CATEGORIES.map((cat) => {
                    const config = CATEGORY_CONFIG[cat]
                    const IconComponent = config.Icon
                    const isSelected = category === cat
                    return (
                      <motion.button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        disabled={isSubmitting || success}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        initial={false}
                        animate={{
                          borderColor: isSelected ? config.color : colors.warmGray,
                          backgroundColor: isSelected ? config.bgColor : colors.warmWhite,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                          padding: '14px 8px',
                          border: `2px solid ${isSelected ? config.color : colors.warmGray}`,
                          borderRadius: '14px',
                          background: isSelected ? config.bgColor : colors.warmWhite,
                          cursor: isSubmitting || success ? 'not-allowed' : 'pointer',
                          opacity: isSubmitting || success ? 0.6 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: isSelected
                            ? `0 4px 12px ${config.color}20`
                            : '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Icon container with subtle background */}
                        <motion.div
                          animate={{
                            backgroundColor: isSelected ? `${config.color}18` : 'rgba(139, 115, 85, 0.08)',
                            scale: isSelected ? 1.05 : 1,
                          }}
                          transition={{ duration: 0.2 }}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent
                            style={{
                              width: '20px',
                              height: '20px',
                              color: isSelected ? config.color : colors.lightBrown,
                              strokeWidth: 1.75,
                              transition: 'color 0.2s ease',
                            }}
                          />
                        </motion.div>
                        <span
                          style={{
                            fontFamily: '"Courier New", monospace',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: isSelected ? config.color : colors.mediumBrown,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {config.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Amount and Currency Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>
                    Amount <span style={{ color: colors.terracotta }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontFamily: 'Georgia, serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: colors.lightBrown,
                      }}
                    >
                      {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={isSubmitting || success}
                      style={{
                        ...inputStyle,
                        paddingLeft: '36px',
                        fontFamily: "'Fraunces', Georgia, serif",
                        fontSize: '18px',
                        fontWeight: 600,
                        opacity: isSubmitting || success ? 0.6 : 1,
                      }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={isSubmitting || success}
                    style={{
                      ...inputStyle,
                      fontFamily: '"Courier New", monospace',
                      fontWeight: 600,
                      opacity: isSubmitting || success ? 0.6 : 1,
                      cursor: 'pointer',
                    }}
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur} value={cur}>{cur}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Location Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>
                    <Calendar style={{ width: 12, height: 12, display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Date <span style={{ color: colors.terracotta }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    disabled={isSubmitting || success}
                    style={{
                      ...inputStyle,
                      fontFamily: '"Courier New", monospace',
                      opacity: isSubmitting || success ? 0.6 : 1,
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Rome"
                    disabled={isSubmitting || success}
                    style={{
                      ...inputStyle,
                      opacity: isSubmitting || success ? 0.6 : 1,
                    }}
                  />
                </div>
              </div>

              {/* Split Method */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  <SplitSquareHorizontal style={{ width: 12, height: 12, display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Split Method
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['equal', 'custom'] as SplitMethod[]).map((method) => (
                    <motion.button
                      key={method}
                      type="button"
                      onClick={() => setSplitMethod(method)}
                      disabled={isSubmitting || success}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: `2px solid ${splitMethod === method ? colors.sage : colors.warmGray}`,
                        borderRadius: '8px',
                        background: splitMethod === method ? `${colors.sage}10` : colors.warmWhite,
                        fontFamily: '"Courier New", monospace',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: splitMethod === method ? colors.sage : colors.mediumBrown,
                        textTransform: 'uppercase',
                        cursor: isSubmitting || success ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting || success ? 0.6 : 1,
                      }}
                    >
                      {method === 'equal' ? 'Equal Split' : 'Custom Split'}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Participants - Only show if there are collaborators */}
              {collaborators.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>
                    Split Among <span style={{ color: colors.terracotta }}>*</span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {collaborators.map((collab) => (
                      <label
                        key={collab.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          border: `1px solid ${participants.includes(collab.id) ? colors.sage : colors.warmGray}`,
                          borderRadius: '8px',
                          background: participants.includes(collab.id) ? `${colors.sage}08` : colors.warmWhite,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={participants.includes(collab.id)}
                          onChange={() => toggleParticipant(collab.id)}
                          disabled={isSubmitting || success}
                          style={{ accentColor: colors.sage }}
                        />
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenLight} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'Georgia, serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'white',
                          }}
                        >
                          {collab.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: colors.espresso }}>
                          {collab.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>
                  <FileText style={{ width: 12, height: 12, display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Notes <span style={{ color: colors.lightBrown, fontWeight: 400, fontStyle: 'italic', textTransform: 'none' }}>(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  disabled={isSubmitting || success}
                  rows={2}
                  style={{
                    ...inputStyle,
                    resize: 'none',
                    opacity: isSubmitting || success ? 0.6 : 1,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${colors.warmGray}` }}>
                <motion.button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: 'transparent',
                    border: `1px solid ${colors.warmGray}`,
                    borderRadius: '10px',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: colors.mediumBrown,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.5 : 1,
                    textTransform: 'uppercase',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting || success || !description || !amount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: isSubmitting || success || !description || !amount
                      ? colors.lightBrown
                      : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                    border: 'none',
                    borderRadius: '10px',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    color: colors.cream,
                    cursor: isSubmitting || success || !description || !amount ? 'not-allowed' : 'pointer',
                    boxShadow: isSubmitting || success || !description || !amount
                      ? 'none'
                      : `0 4px 14px rgba(196, 88, 48, 0.35)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      Recording...
                    </>
                  ) : success ? (
                    <>
                      <Check style={{ width: 16, height: 16 }} />
                      Recorded!
                    </>
                  ) : (
                    <>
                      <Receipt style={{ width: 16, height: 16 }} />
                      Record Expense
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
