/**
 * MonetisationDashboard
 *
 * WI-10.7: Analytics dashboard for monetisation metrics
 *
 * Displays:
 * - Subscription metrics (trials, conversions, churn)
 * - Affiliate click metrics by partner/category
 * - Upgrade prompt effectiveness
 * - Time series visualization
 *
 * Design: Clean, data-focused, exportable
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MousePointerClick,
  CreditCard,
  Download,
  RefreshCw,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react';
import {
  type TimePeriod,
  getMonetisationDashboard,
  downloadAnalytics,
} from '../../services/analytics';

// ============================================================================
// Types
// ============================================================================

export interface MonetisationDashboardProps {
  /** Custom className */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

// ============================================================================
// Sub-components
// ============================================================================

function PeriodSelector({
  value,
  onChange,
}: {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: '7 days' },
    { value: 'month', label: '30 days' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-all
            ${value === period.value
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'stone',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'stone' | 'amber' | 'green' | 'rose';
}) {
  const colorClasses = {
    stone: 'bg-stone-50 text-stone-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  const trendIcon = trend === 'up'
    ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
    : trend === 'down'
    ? <ArrowDownRight className="w-4 h-4 text-rose-500" />
    : null;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trendIcon}
      </div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-sm text-stone-500">{title}</p>
      {subtitle && (
        <p className="text-xs text-stone-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function BarChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-stone-400 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * (height - 24);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: barHeight }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="w-full bg-amber-400 rounded-t-sm"
            />
            <span className="text-[10px] text-stone-500 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniLineChart({
  data,
  height = 60,
  color = '#F59E0B',
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-stone-400 text-xs" style={{ height }}>
        Not enough data
      </div>
    );
  }

  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((value - minValue) / range) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {data.map((value, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = height - ((value - minValue) / range) * (height - 10) - 5;
        return (
          <circle
            key={i}
            cx={`${x}%`}
            cy={y}
            r="3"
            fill={color}
          />
        );
      })}
    </svg>
  );
}

function DataTable({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">{title}</h3>
        <p className="text-sm text-stone-400">No data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <h3 className="text-sm font-semibold text-stone-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {entries.slice(0, 5).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-stone-600 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-sm font-medium text-stone-800">{formatNumber(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MonetisationDashboard({ className = '' }: MonetisationDashboardProps) {
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [refreshKey, setRefreshKey] = useState(0);

  // Get dashboard data
  const data = useMemo(() => {
    return getMonetisationDashboard(period);
  }, [period, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleExport = () => {
    downloadAnalytics();
  };

  // Time series data for charts
  const revenueData = data.timeSeries.map((ts) => ts.revenueCents / 100);
  const clicksData = data.timeSeries.map((ts) => ts.bookingClicks);

  // Partner breakdown for bar chart
  const partnerData = Object.entries(data.booking.clicksByPartner)
    .map(([label, value]) => ({ label, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className={`min-h-screen bg-stone-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-xl font-bold text-stone-900"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Monetisation Analytics
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(data.subscription.totalRevenueCents)}
              icon={CreditCard}
              color="green"
            />
            <MetricCard
              title="Premium Subscribers"
              value={data.subscription.currentPremium}
              subtitle={`MRR: ${formatCurrency(data.subscription.mrrCents)}`}
              icon={Crown}
              color="amber"
            />
            <MetricCard
              title="Affiliate Clicks"
              value={formatNumber(data.booking.totalClicks)}
              icon={MousePointerClick}
              color="stone"
            />
            <MetricCard
              title="Trial Conversion"
              value={formatPercent(data.subscription.trialConversionRate)}
              subtitle={`${data.subscription.trialsConverted}/${data.subscription.trialsStarted}`}
              icon={TrendingUp}
              color={data.subscription.trialConversionRate > 0.3 ? 'green' : 'rose'}
            />
          </div>
        </section>

        {/* Subscription Metrics */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Subscription
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Trials Started"
              value={data.subscription.trialsStarted}
              icon={Users}
              color="stone"
            />
            <MetricCard
              title="Trials Converted"
              value={data.subscription.trialsConverted}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Canceled"
              value={data.subscription.canceled}
              icon={TrendingDown}
              color="rose"
            />
            <MetricCard
              title="Churn Rate"
              value={formatPercent(data.subscription.churnRate)}
              icon={BarChart3}
              color={data.subscription.churnRate < 0.1 ? 'green' : 'rose'}
            />
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid md:grid-cols-2 gap-4">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Revenue Trend</h3>
            <MiniLineChart data={revenueData} height={80} color="#10B981" />
            <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
              <span>{data.timeSeries[0]?.date || '-'}</span>
              <span>{data.timeSeries[data.timeSeries.length - 1]?.date || '-'}</span>
            </div>
          </div>

          {/* Clicks Trend */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Affiliate Clicks</h3>
            <MiniLineChart data={clicksData} height={80} color="#F59E0B" />
            <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
              <span>{data.timeSeries[0]?.date || '-'}</span>
              <span>{data.timeSeries[data.timeSeries.length - 1]?.date || '-'}</span>
            </div>
          </div>
        </section>

        {/* Partner Breakdown */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Clicks by Partner
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            {partnerData.length > 0 ? (
              <BarChart data={partnerData} height={120} />
            ) : (
              <p className="text-sm text-stone-400 text-center py-8">No click data yet</p>
            )}
          </div>
        </section>

        {/* Breakdown Tables */}
        <section className="grid md:grid-cols-2 gap-4">
          <DataTable
            title="Clicks by Category"
            data={data.booking.clicksByCategory}
          />
          <DataTable
            title="Clicks by Source"
            data={data.booking.clicksBySource}
          />
        </section>

        {/* Upgrade Prompt Metrics */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Upgrade Prompts
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Prompts Shown"
              value={data.upgradePrompts.shown}
              icon={Users}
              color="stone"
            />
            <MetricCard
              title="CTA Clicked"
              value={data.upgradePrompts.clicked}
              icon={MousePointerClick}
              color="green"
            />
            <MetricCard
              title="Dismissed"
              value={data.upgradePrompts.dismissed}
              icon={TrendingDown}
              color="rose"
            />
            <MetricCard
              title="Click-through Rate"
              value={formatPercent(data.upgradePrompts.ctr)}
              icon={TrendingUp}
              color={data.upgradePrompts.ctr > 0.1 ? 'green' : 'stone'}
            />
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-4 border-t border-stone-200">
          <p className="text-xs text-stone-400">
            Data stored locally. Export for detailed analysis.
          </p>
        </section>
      </div>
    </div>
  );
}

export default MonetisationDashboard;
