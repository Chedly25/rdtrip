/**
 * LogisticsPanel
 *
 * Displays practical travel logistics: parking, tips, warnings, and timing.
 * Clean, utilitarian design that prioritizes scannable information.
 *
 * Design Philosophy:
 * - Practical and scannable like a well-designed info card
 * - Clear visual hierarchy with icon-led sections
 * - Warning items stand out without being alarming
 * - Market days get special treatment (time-sensitive)
 * - Compact but never cramped
 */

import { motion } from 'framer-motion';
import {
  Car,
  Lightbulb,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Info,
  MapPin,
  Ban,
} from 'lucide-react';
import type { LogisticsOutput } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface LogisticsPanelProps {
  logistics: LogisticsOutput;
  /** Compact mode for card embedding */
  compact?: boolean;
  /** Animation delay */
  delay?: number;
}

// =============================================================================
// Main Component
// =============================================================================

export function LogisticsPanel({
  logistics,
  compact = false,
  delay = 0,
}: LogisticsPanelProps) {
  const { parking, tips, warnings, bestTimes, marketDays } = logistics;

  const hasContent = parking || (tips?.length ?? 0) > 0 || (warnings?.length ?? 0) > 0 || (bestTimes?.length ?? 0) > 0 || (marketDays?.length ?? 0) > 0;

  if (!hasContent) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No logistics info available yet</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-4"
    >
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center border border-slate-200">
            <Info className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-gray-900">
              Know Before You Go
            </h3>
            <p className="text-sm text-gray-500">
              Practical tips for your visit
            </p>
          </div>
        </div>
      )}

      {/* Content sections */}
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {/* Parking */}
        {parking && (
          <LogisticsSection
            icon={Car}
            title="Parking"
            color="blue"
            delay={delay + 0.1}
            compact={compact}
          >
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
              {parking}
            </p>
          </LogisticsSection>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <LogisticsSection
            icon={Lightbulb}
            title="Tips"
            color="amber"
            delay={delay + 0.15}
            compact={compact}
          >
            <ul className="space-y-1.5">
              {tips.map((tip, idx) => (
                <TipItem key={idx} text={tip} index={idx} compact={compact} />
              ))}
            </ul>
          </LogisticsSection>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <LogisticsSection
            icon={AlertTriangle}
            title="Heads Up"
            color="orange"
            delay={delay + 0.2}
            compact={compact}
            highlight
          >
            <ul className="space-y-1.5">
              {warnings.map((warning, idx) => (
                <WarningItem key={idx} text={warning} index={idx} compact={compact} />
              ))}
            </ul>
          </LogisticsSection>
        )}

        {/* Best Times */}
        {bestTimes && bestTimes.length > 0 && (
          <LogisticsSection
            icon={Clock}
            title="Best Times"
            color="emerald"
            delay={delay + 0.25}
            compact={compact}
          >
            <div className="space-y-1.5">
              {bestTimes.map((time, idx) => (
                <TimeItem key={idx} text={time} compact={compact} />
              ))}
            </div>
          </LogisticsSection>
        )}

        {/* Market Days */}
        {marketDays && marketDays.length > 0 && (
          <LogisticsSection
            icon={Calendar}
            title="Market Days"
            color="violet"
            delay={delay + 0.3}
            compact={compact}
          >
            <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-1'}`}>
              {marketDays.map((market, idx) => (
                <MarketBadge key={idx} text={market} compact={compact} />
              ))}
            </div>
          </LogisticsSection>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Section Wrapper
// =============================================================================

interface LogisticsSectionProps {
  icon: React.ElementType;
  title: string;
  color: 'blue' | 'amber' | 'orange' | 'emerald' | 'violet';
  delay: number;
  compact: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}

const COLOR_CONFIG = {
  blue: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    border: 'border-blue-100',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
  },
  orange: {
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    border: 'border-orange-100',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    border: 'border-violet-100',
  },
};

function LogisticsSection({
  icon: Icon,
  title,
  color,
  delay,
  compact,
  highlight = false,
  children,
}: LogisticsSectionProps) {
  const config = COLOR_CONFIG[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        rounded-xl border
        ${highlight ? 'bg-orange-50/50 border-orange-200' : `bg-white ${config.border}`}
        ${compact ? 'p-2.5' : 'p-3.5'}
      `}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`
            ${compact ? 'w-6 h-6' : 'w-7 h-7'}
            rounded-lg ${config.iconBg}
            flex items-center justify-center
          `}
        >
          <Icon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${config.iconColor}`} />
        </div>
        <span
          className={`
            font-semibold ${config.iconColor}
            ${compact ? 'text-xs' : 'text-sm'}
          `}
        >
          {title}
        </span>
      </div>

      {/* Section content */}
      {children}
    </motion.div>
  );
}

// =============================================================================
// Item Components
// =============================================================================

interface ItemProps {
  text: string;
  index?: number;
  compact: boolean;
}

function TipItem({ text, compact }: ItemProps) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2
        className={`
          flex-shrink-0 text-amber-500 mt-0.5
          ${compact ? 'w-3 h-3' : 'w-4 h-4'}
        `}
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
        {text}
      </span>
    </li>
  );
}

function WarningItem({ text, compact }: ItemProps) {
  return (
    <li className="flex items-start gap-2">
      <Ban
        className={`
          flex-shrink-0 text-orange-500 mt-0.5
          ${compact ? 'w-3 h-3' : 'w-4 h-4'}
        `}
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
        {text}
      </span>
    </li>
  );
}

function TimeItem({ text, compact }: { text: string; compact: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <MapPin
        className={`
          flex-shrink-0 text-emerald-500 mt-0.5
          ${compact ? 'w-3 h-3' : 'w-4 h-4'}
        `}
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
        {text}
      </span>
    </div>
  );
}

function MarketBadge({ text, compact }: { text: string; compact: boolean }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
        rounded-full font-medium
        bg-violet-100 text-violet-700
        border border-violet-200
      `}
    >
      <Calendar className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {text}
    </span>
  );
}

// =============================================================================
// Compact Summary View
// =============================================================================

interface LogisticsSummaryProps {
  logistics: LogisticsOutput;
}

export function LogisticsSummary({ logistics }: LogisticsSummaryProps) {
  const counts = {
    tips: logistics.tips?.length || 0,
    warnings: logistics.warnings?.length || 0,
    markets: logistics.marketDays?.length || 0,
  };

  const hasParking = !!logistics.parking;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasParking && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
          <Car className="w-3 h-3" />
          Parking info
        </span>
      )}
      {counts.tips > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100">
          <Lightbulb className="w-3 h-3" />
          {counts.tips} tips
        </span>
      )}
      {counts.warnings > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-100">
          <AlertTriangle className="w-3 h-3" />
          {counts.warnings} heads up
        </span>
      )}
      {counts.markets > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-100">
          <Calendar className="w-3 h-3" />
          {counts.markets} market days
        </span>
      )}
    </div>
  );
}

export default LogisticsPanel;
