import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { Budget, ExpenseCategory, BudgetsResponse } from '../../types'

interface BudgetOverviewProps {
  routeId: string
  userId: string
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

export function BudgetOverview({ routeId }: BudgetOverviewProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket for real-time updates
  // @ts-ignore - lastMessage not needed, using onMessage callback
  const { lastMessage: _ } = useWebSocket('/ws/collab', {
    onMessage: (message) => {
      // Refresh budgets when expenses change (budget vs actual spending)
      if (
        message.type === 'expense_added' ||
        message.type === 'expense_updated' ||
        message.type === 'expense_deleted'
      ) {
        console.log('Expense event received, refreshing budgets...', message.type)
        fetchBudgets()
      }
    }
  })

  useEffect(() => {
    fetchBudgets()
  }, [routeId])

  async function fetchBudgets() {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')

      const response = await fetch(`/api/routes/${routeId}/budgets`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch budgets')
      }

      const data: BudgetsResponse = await response.json()
      setBudgets(data.budgets)
      setError(null)
    } catch (err) {
      console.error('Error fetching budgets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  function getProgressBarColor(percentage: number, threshold: number): string {
    if (percentage >= 1) return 'bg-red-500'
    if (percentage >= threshold) return 'bg-orange-500'
    return 'bg-green-500'
  }

  // Calculate totals
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.actualSpent || 0), 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overallPercentage = totalBudgeted > 0 ? totalSpent / totalBudgeted : 0

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PiggyBank className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Budget Overview</h2>
              <p className="text-sm text-gray-600">Track spending vs budget</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            <Plus className="h-4 w-4" />
            <span>Set Budget</span>
          </button>
        </div>

        {/* Overall budget summary */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        )}

        {!loading && budgets.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(totalBudgeted)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(overallPercentage * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${getProgressBarColor(overallPercentage, 0.8)}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {(overallPercentage * 100).toFixed(0)}% used
              </span>
              <span className={`font-medium ${totalRemaining >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {totalRemaining >= 0 ? formatCurrency(totalRemaining) + ' remaining' : formatCurrency(Math.abs(totalRemaining)) + ' over budget'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Budget categories */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Error loading budgets</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!loading && budgets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PiggyBank className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">No budgets set</p>
            <p className="text-sm text-gray-500 mb-4">
              Set category budgets to track your spending
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Set Your First Budget
            </button>
          </div>
        )}

        {!loading && budgets.length > 0 && (
          <div className="space-y-4">
            {budgets.map((budget, idx) => {
              const percentage = budget.spendPercentage || 0
              const isOverBudget = percentage >= 1
              const isNearLimit = percentage >= budget.alertThreshold && !isOverBudget

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white rounded-lg border-2 p-4 ${
                    isOverBudget
                      ? 'border-red-200 bg-red-50'
                      : isNearLimit
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CATEGORY_ICONS[budget.category]}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {budget.category}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(budget.budgetedAmount)} budgeted
                        </p>
                      </div>
                    </div>

                    {/* Status indicator */}
                    {isOverBudget ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Over budget!</span>
                      </div>
                    ) : isNearLimit ? (
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-medium">Near limit</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">On track</span>
                      </div>
                    )}
                  </div>

                  {/* Spending details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(budget.actualSpent || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Remaining</span>
                      <span
                        className={`font-medium ${
                          (budget.remaining || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {budget.remaining !== undefined && budget.remaining >= 0
                          ? formatCurrency(budget.remaining)
                          : formatCurrency(Math.abs(budget.remaining || 0)) + ' over'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage * 100, 100)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full ${getProgressBarColor(percentage, budget.alertThreshold)}`}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {(percentage * 100).toFixed(0)}% used
                        </span>
                        {isNearLimit && !isOverBudget && (
                          <span className="text-xs text-orange-600 font-medium">
                            {((1 - percentage) * budget.budgetedAmount).toFixed(0)} EUR left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
