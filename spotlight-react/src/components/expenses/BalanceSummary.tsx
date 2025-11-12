import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign
} from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { Balance, SimplifiedSettlement, BalancesResponse } from '../../types'

interface BalanceSummaryProps {
  routeId: string
  userId: string
}

export function BalanceSummary({ routeId, userId }: BalanceSummaryProps) {
  const [balances, setBalances] = useState<Balance[]>([])
  const [settlements, setSettlements] = useState<SimplifiedSettlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket for real-time updates
  // @ts-ignore - lastMessage not needed, using onMessage callback
  const { lastMessage: _ } = useWebSocket('/ws/collab', {
    onMessage: (message) => {
      // Refresh balances when expenses or settlements change
      if (
        message.type === 'expense_added' ||
        message.type === 'expense_updated' ||
        message.type === 'expense_deleted' ||
        message.type === 'settlement_created' ||
        message.type === 'settlement_updated'
      ) {
        console.log('Balance affecting event received, refreshing...', message.type)
        fetchBalances()
      }
    }
  })

  useEffect(() => {
    fetchBalances()
  }, [routeId])

  async function fetchBalances() {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')

      const response = await fetch(`/api/routes/${routeId}/expenses/balances`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch balances')
      }

      const data: BalancesResponse = await response.json()
      setBalances(data.balances)
      setSettlements(data.settlements)
      setError(null)
    } catch (err) {
      console.error('Error fetching balances:', err)
      setError(err instanceof Error ? err.message : 'Failed to load balances')
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount))
  }

  // Find current user's balance
  const currentUserBalance = balances.find(b => b.userId === userId)
  const userOwes = currentUserBalance && currentUserBalance.balance < 0
  const userIsOwed = currentUserBalance && currentUserBalance.balance > 0
  const userIsSettled = !currentUserBalance || Math.abs(currentUserBalance.balance) < 0.01

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Balance Summary</h2>
            <p className="text-sm text-gray-600">Who owes whom</p>
          </div>
        </div>

        {/* Current user's status */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && currentUserBalance && (
          <div
            className={`rounded-lg p-4 border-2 ${
              userIsSettled
                ? 'bg-green-50 border-green-200'
                : userOwes
                ? 'bg-orange-50 border-orange-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Balance</p>
                {userIsSettled ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-lg font-bold text-green-700">All settled up!</p>
                  </div>
                ) : (
                  <p
                    className={`text-2xl font-bold ${
                      userOwes ? 'text-orange-700' : 'text-blue-700'
                    }`}
                  >
                    {userOwes ? 'You owe ' : 'You are owed '}
                    {formatCurrency(currentUserBalance.balance)}
                  </p>
                )}
              </div>
              {userOwes ? (
                <TrendingDown className="h-12 w-12 text-orange-400 opacity-50" />
              ) : userIsOwed ? (
                <TrendingUp className="h-12 w-12 text-blue-400 opacity-50" />
              ) : (
                <CheckCircle className="h-12 w-12 text-green-400 opacity-50" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Error loading balances</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Simplified settlements */}
            {settlements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Suggested Settlements ({settlements.length})
                </h3>
                <div className="space-y-3">
                  {settlements.map((settlement, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {/* From */}
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700">
                              {settlement.fromName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">
                              {settlement.fromName}
                            </span>
                          </div>

                          {/* Arrow */}
                          <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />

                          {/* To */}
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                              {settlement.toName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">
                              {settlement.toName}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="ml-4 text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(settlement.amount)}
                          </p>
                          <p className="text-xs text-gray-500">EUR</p>
                        </div>
                      </div>

                      {/* Mark as settled button */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Mark as Settled</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All user balances */}
            {balances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  All Balances
                </h3>
                <div className="space-y-2">
                  {balances.map((balance, idx) => {
                    const isCurrentUser = balance.userId === userId
                    const owes = balance.balance < 0
                    const isSettled = Math.abs(balance.balance) < 0.01

                    return (
                      <motion.div
                        key={balance.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`bg-white rounded-lg border p-4 ${
                          isCurrentUser ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                isSettled
                                  ? 'bg-green-100 text-green-700'
                                  : owes
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {balance.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {balance.userName}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-blue-600 font-normal">
                                    (You)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">{balance.userEmail}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            {isSettled ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Settled</span>
                              </div>
                            ) : (
                              <>
                                <p
                                  className={`text-lg font-bold ${
                                    owes ? 'text-orange-700' : 'text-blue-700'
                                  }`}
                                >
                                  {owes ? '-' : '+'}
                                  {formatCurrency(balance.balance)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {owes ? 'owes' : 'is owed'}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && balances.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">No balances yet</p>
                <p className="text-sm text-gray-500">
                  Add expenses to see who owes what
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
