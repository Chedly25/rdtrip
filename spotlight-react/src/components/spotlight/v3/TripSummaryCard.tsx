import { motion } from 'framer-motion';
import { MapPin, Moon, Clock, Route, Wallet, Utensils, Bed, Sparkles } from 'lucide-react';
import { Badge, StatCompact } from '../../ui';

interface BudgetBreakdown {
  total: number;
  accommodation: number;
  food: number;
  activities: number;
  confidence: 'high' | 'medium' | 'low';
}

interface TripSummaryCardProps {
  citiesCount: number;
  totalNights: number;
  estimatedDriveTime?: string;
  totalDistance?: number;
  budget?: BudgetBreakdown | null;
  tripPace?: 'leisurely' | 'balanced' | 'fast-paced';
}

const TripSummaryCard = ({
  citiesCount,
  totalNights,
  estimatedDriveTime,
  totalDistance,
  budget,
  tripPace = 'balanced',
}: TripSummaryCardProps) => {
  const paceLabels = {
    'leisurely': 'Leisurely',
    'balanced': 'Balanced',
    'fast-paced': 'Fast-Paced',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.15, 0.5, 0.5, 1] }}
      className="w-80 flex-shrink-0 bg-white rounded-rui-24 shadow-rui-3 border border-rui-grey-10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-rui-grey-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-heading-3 text-rui-black">Trip Overview</h3>
          <Badge variant="secondary" size="sm">
            {paceLabels[tripPace]}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCompact
            icon={<MapPin className="w-4 h-4 text-rui-grey-50 mx-auto" />}
            label="Cities"
            value={citiesCount}
          />
          <StatCompact
            icon={<Moon className="w-4 h-4 text-rui-grey-50 mx-auto" />}
            label="Nights"
            value={totalNights}
          />
          {estimatedDriveTime && (
            <StatCompact
              icon={<Clock className="w-4 h-4 text-rui-grey-50 mx-auto" />}
              label="Drive"
              value={estimatedDriveTime}
            />
          )}
          {totalDistance && (
            <StatCompact
              icon={<Route className="w-4 h-4 text-rui-grey-50 mx-auto" />}
              label="Distance"
              value={`${totalDistance} km`}
            />
          )}
        </div>
      </div>

      {/* Budget Section */}
      {budget && (
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-rui-grey-50" />
              <span className="text-body-2 text-rui-grey-50">Estimated Budget</span>
            </div>
            <Badge
              variant={budget.confidence === 'high' ? 'success' : budget.confidence === 'medium' ? 'warning' : 'secondary'}
              size="sm"
            >
              {budget.confidence} confidence
            </Badge>
          </div>

          {/* Total */}
          <div className="text-center mb-4">
            <p className="text-display-3 text-rui-black">{formatCurrency(budget.total)}</p>
            <p className="text-body-3 text-rui-grey-50">per person</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-t border-rui-grey-10">
              <div className="flex items-center gap-2">
                <Bed className="w-3.5 h-3.5 text-rui-grey-50" />
                <span className="text-body-3 text-rui-grey-50">Accommodation</span>
              </div>
              <span className="text-emphasis-3 text-rui-black">{formatCurrency(budget.accommodation)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-rui-grey-10">
              <div className="flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-rui-grey-50" />
                <span className="text-body-3 text-rui-grey-50">Food & Dining</span>
              </div>
              <span className="text-emphasis-3 text-rui-black">{formatCurrency(budget.food)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-rui-grey-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-rui-grey-50" />
                <span className="text-body-3 text-rui-grey-50">Activities</span>
              </div>
              <span className="text-emphasis-3 text-rui-black">{formatCurrency(budget.activities)}</span>
            </div>
          </div>
        </div>
      )}

      {/* No budget yet */}
      {!budget && (
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-rui-grey-50" />
            <span className="text-body-2 text-rui-grey-50">Budget</span>
          </div>
          <p className="text-body-3 text-rui-grey-20">
            Budget estimate will be calculated based on your route
          </p>
        </div>
      )}
    </motion.div>
  );
};

export { TripSummaryCard };
export type { TripSummaryCardProps, BudgetBreakdown };
