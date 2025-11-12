import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Plus,
  Filter,
  Calendar,
  User,
  Receipt,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'
import type {
  Expense,
  ExpenseCategory,
  ExpensesResponse
} from '../../types'

interface ExpenseTrackerProps {
  routeId: string
  userId: string
  collaborators?: Array<{ id: string; name: string; avatar?: string }>
  onAddExpense?: () => void
}

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

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  accommodation: 'bg-purple-100 text-purple-700',
  food: 'bg-orange-100 text-orange-700',
  transportation: 'bg-blue-100 text-blue-700',
  activities: 'bg-pink-100 text-pink-700',
  shopping: 'bg-green-100 text-green-700',
  fuel: 'bg-yellow-100 text-yellow-700',
  tolls: 'bg-indigo-100 text-indigo-700',
  parking: 'bg-gray-100 text-gray-700',
  other: 'bg-slate-100 text-slate-700'
}

export function ExpenseTracker({ routeId, userId, collaborators = [], onAddExpense }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all')
  const [totalByCategory, setTotalByCategory] = useState<Map<ExpenseCategory, number>>(new Map())

  // WebSocket for real-time updates
  // @ts-ignore - lastMessage not needed, using onMessage callback
  const { lastMessage: _ } = useWebSocket('/ws/collab', {
    onMessage: (message) => {
      // Refresh expenses when expense events occur
      if (
        message.type === 'expense_added' ||
        message.type === 'expense_updated' ||
        message.type === 'expense_deleted'
      ) {
        console.log('Expense event received, refreshing...', message.type)
        fetchExpenses()
      }
    }
  })

  // Fetch expenses
  useEffect(() => {
    fetchExpenses()
  }, [routeId, selectedCategory])

  async function fetchExpenses() {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')

      const url = new URL(`/api/routes/${routeId}/expenses`, window.location.origin)
      if (selectedCategory !== 'all') {
        url.searchParams.set('category', selectedCategory)
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }

      const data: ExpensesResponse = await response.json()
      setExpenses(data.expenses)

      // Calculate totals by category
      const totals = new Map<ExpenseCategory, number>()
      data.summary.forEach(s => {
        totals.set(s.category, s.totalEur)
      })
      setTotalByCategory(totals)

      setError(null)
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  // Format currency
  function formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  // Get collaborator name
  function getCollaboratorName(userId: string): string {
    const collaborator = collaborators.find(c => c.id === userId)
    return collaborator?.name || 'Unknown'
  }

  // Calculate total spending
  const totalSpending = Array.from(totalByCategory.values()).reduce((sum, val) => sum + val, 0)

  // Category filter buttons
  const categories: Array<ExpenseCategory | 'all'> = [
    'all',
    'accommodation',
    'food',
    'transportation',
    'activities',
    'shopping',
    'fuel',
    'tolls',
    'parking',
    'other'
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Expense Tracker</h2>
              <p className="text-sm text-gray-600">
                Track and split trip expenses
              </p>
            </div>
          </div>
          <button
            onClick={onAddExpense}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Expense</span>
          </button>
        </div>

        {/* Total spending card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Spending</p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(totalSpending)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter by category</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat !== 'all' && CATEGORY_ICONS[cat]} {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              {cat !== 'all' && totalByCategory.has(cat) && (
                <span className="ml-1 text-xs opacity-70">
                  ({formatCurrency(totalByCategory.get(cat)!)})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Expense list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Error loading expenses</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && expenses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">No expenses yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Start tracking your trip expenses by adding your first expense
            </p>
            <button
              onClick={onAddExpense}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add First Expense
            </button>
          </div>
        )}

        {!loading && !error && expenses.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {expenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${CATEGORY_COLORS[expense.category]}`}>
                        <span className="text-xl">{CATEGORY_ICONS[expense.category]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {expense.description}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(expense.expenseDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Paid by {expense.paidByName}</span>
                          </div>
                          {expense.location && (
                            <span className="truncate">{expense.location}</span>
                          )}
                        </div>
                        {expense.notes && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {expense.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      {expense.currency !== 'EUR' && (
                        <p className="text-xs text-gray-500">
                          ≈ {formatCurrency(expense.amountEur, 'EUR')}
                        </p>
                      )}
                      <div className="mt-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Split {expense.splitMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Split among:</span>
                    <div className="flex items-center gap-1">
                      {expense.participants.slice(0, 3).map((participantId, idx) => (
                        <div
                          key={participantId}
                          className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                          style={{ marginLeft: idx > 0 ? '-8px' : '0' }}
                          title={getCollaboratorName(participantId)}
                        >
                          {getCollaboratorName(participantId).charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {expense.participants.length > 3 && (
                        <div
                          className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700"
                          style={{ marginLeft: '-8px' }}
                        >
                          +{expense.participants.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
