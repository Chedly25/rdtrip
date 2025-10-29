import { useState } from 'react'
import { DollarSign, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BudgetData {
  summary: {
    total: number
    perPerson: number
    confidence: 'low' | 'medium' | 'high'
    currency: string
    note?: string
  }
  transportation?: {
    fuel: { total: number; pricePerLiter: number; litersNeeded: number; consumption: string }
    tolls: { total: number; breakdown?: Array<{ section: string; cost: number }> }
    parking: { total: number; perCity?: Array<{ city: string; days: number; dailyRate: number; total: number }> }
  }
  accommodation?: {
    total: number
    avgPerNight: number
    nights: number
    byCity?: Array<{ city: string; priceRange: { min: number; max: number }; avgPrice: number; nights: number }>
  }
  dining?: {
    total: number
    breakdown?: {
      breakfast: { perPerson: number; dailyTotal: number; tripTotal: number }
      lunch: { perPerson: number; dailyTotal: number; tripTotal: number }
      dinner: { perPerson: number; dailyTotal: number; tripTotal: number }
      snacks: { dailyTotal: number; tripTotal: number }
    }
  }
  activities?: {
    total: number
    estimatedCount: number
    items?: Array<{ name: string; city: string; cost: number }>
  }
  misc?: {
    total: number
    note: string
  }
  savingsTips?: string[]
  priceContext?: {
    bestMonthsForPrices: string[]
    expensivePeriods: string[]
    currentMonthContext: string
  }
  warning?: string
  error?: string
}

interface BudgetDisplayProps {
  budgetData: BudgetData | null
  loading: boolean
  themeColor: string
}

export function BudgetDisplay({ budgetData, loading, themeColor }: BudgetDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full animate-pulse" style={{ backgroundColor: themeColor + '20' }}></div>
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Calculating trip costs...</p>
      </div>
    )
  }

  if (!budgetData || budgetData.error) {
    return (
      <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Budget calculation unavailable</p>
            <p className="text-sm text-amber-700 mt-1">
              {budgetData?.warning || 'Unable to calculate budget at this time. Try again later.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const confidenceColors = {
    low: 'bg-amber-100 text-amber-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-green-100 text-green-700'
  }

  const confidenceLabels = {
    low: '~Estimate',
    medium: 'Good estimate',
    high: 'High confidence'
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      {/* Summary Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: themeColor + '20' }}
          >
            <DollarSign className="h-6 w-6" style={{ color: themeColor }} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              Estimated Cost
            </h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                €{budgetData.summary.total.toLocaleString()}
              </span>
              <span className="text-base text-gray-600">total</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg text-gray-700">
                €{budgetData.summary.perPerson.toLocaleString()} <span className="text-sm text-gray-500">per person</span>
              </span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${confidenceColors[budgetData.summary.confidence]}`}>
                {confidenceLabels[budgetData.summary.confidence]}
              </span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-2 flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {showDetails ? (
            <>
              <span>Less</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Details</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Budget Breakdown Bar */}
      {budgetData.transportation && budgetData.accommodation && budgetData.dining && budgetData.activities && (
        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="flex h-full">
              <div
                className="bg-blue-500"
                style={{
                  width: `${((budgetData.transportation.fuel.total + budgetData.transportation.tolls.total + budgetData.transportation.parking.total) / budgetData.summary.total) * 100}%`
                }}
                title="Transportation"
              />
              <div
                className="bg-purple-500"
                style={{
                  width: `${(budgetData.accommodation.total / budgetData.summary.total) * 100}%`
                }}
                title="Accommodation"
              />
              <div
                className="bg-orange-500"
                style={{
                  width: `${(budgetData.dining.total / budgetData.summary.total) * 100}%`
                }}
                title="Dining"
              />
              <div
                className="bg-green-500"
                style={{
                  width: `${(budgetData.activities.total / budgetData.summary.total) * 100}%`
                }}
                title="Activities"
              />
              {budgetData.misc && (
                <div
                  className="bg-gray-400"
                  style={{
                    width: `${(budgetData.misc.total / budgetData.summary.total) * 100}%`
                  }}
                  title="Miscellaneous"
                />
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Transport</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-600">Hotels</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">Food</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Activities</span>
            </div>
            {budgetData.misc && (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600">Misc</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-4 overflow-hidden border-t border-gray-200 pt-4"
          >
            {/* Transportation */}
            {budgetData.transportation && (
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  🚗 Transportation
                  <span className="text-sm font-normal text-gray-600">
                    €{(budgetData.transportation.fuel.total + budgetData.transportation.tolls.total + budgetData.transportation.parking.total).toFixed(2)}
                  </span>
                </h5>
                <div className="ml-6 space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Fuel ({budgetData.transportation.fuel.consumption})</span>
                    <span className="font-medium">€{budgetData.transportation.fuel.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tolls</span>
                    <span className="font-medium">€{budgetData.transportation.tolls.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parking</span>
                    <span className="font-medium">€{budgetData.transportation.parking.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Accommodation */}
            {budgetData.accommodation && (
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  🏨 Accommodation
                  <span className="text-sm font-normal text-gray-600">
                    €{budgetData.accommodation.total}
                  </span>
                </h5>
                <div className="ml-6 space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>{budgetData.accommodation.nights} nights</span>
                    <span className="font-medium">€{budgetData.accommodation.avgPerNight}/night avg</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dining */}
            {budgetData.dining && (
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  🍽️ Dining
                  <span className="text-sm font-normal text-gray-600">
                    €{budgetData.dining.total}
                  </span>
                </h5>
                {budgetData.dining.breakdown && (
                  <div className="ml-6 space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Meals (B/L/D + Snacks)</span>
                      <span className="font-medium">
                        €{(
                          budgetData.dining.breakdown.breakfast.tripTotal +
                          budgetData.dining.breakdown.lunch.tripTotal +
                          budgetData.dining.breakdown.dinner.tripTotal +
                          budgetData.dining.breakdown.snacks.tripTotal
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activities */}
            {budgetData.activities && (
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                  🎭 Activities
                  <span className="text-sm font-normal text-gray-600">
                    €{budgetData.activities.total}
                  </span>
                </h5>
                <div className="ml-6 space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>~{budgetData.activities.estimatedCount} activities</span>
                    <span className="font-medium">
                      €{(budgetData.activities.total / budgetData.activities.estimatedCount).toFixed(2)} avg
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Savings Tips */}
            {budgetData.savingsTips && budgetData.savingsTips.length > 0 && (
              <div className="mt-4 rounded-lg bg-green-50 p-4">
                <h5 className="mb-2 flex items-center gap-2 font-semibold text-green-900">
                  💡 Money-Saving Tips
                </h5>
                <ul className="ml-6 space-y-1 text-sm text-green-800">
                  {budgetData.savingsTips.slice(0, 3).map((tip, index) => (
                    <li key={index} className="list-disc">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price Context */}
            {budgetData.priceContext && (
              <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm">
                <h5 className="mb-2 font-semibold text-blue-900">📅 When to Go</h5>
                <p className="text-blue-800">
                  <span className="font-medium">Best prices:</span>{' '}
                  {budgetData.priceContext.bestMonthsForPrices.join(', ')}
                </p>
                <p className="mt-1 text-blue-800">
                  <span className="font-medium">Avoid:</span>{' '}
                  {budgetData.priceContext.expensivePeriods.join(', ')}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note */}
      {budgetData.summary.note && (
        <div className="mt-3 text-xs text-gray-500 italic">
          {budgetData.summary.note}
        </div>
      )}
    </div>
  )
}
