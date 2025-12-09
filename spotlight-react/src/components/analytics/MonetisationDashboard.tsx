/**
 * MonetisationDashboard
 *
 * WI-10.7: Analytics dashboard for monetisation metrics
 * WI-11.1: Updated to use RUI design system tokens
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
    <div className="flex items-center gap-1 bg-rui-grey-8 rounded-rui-12 p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`
            px-3 py-1.5 text-body-2 font-medium rounded-rui-8 transition-all duration-rui-sm
            ${value === period.value
              ? 'bg-rui-white text-rui-black shadow-rui-1'
              : 'text-rui-grey-50 hover:text-rui-black'
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
  color = 'neutral',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'neutral' | 'warning' | 'success' | 'danger';
}) {
  const colorClasses = {
    neutral: 'bg-rui-grey-5 text-rui-grey-50',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
  };

  const trendIcon = trend === 'up'
    ? <ArrowUpRight className="w-4 h-4 text-success" />
    : trend === 'down'
    ? <ArrowDownRight className="w-4 h-4 text-danger" />
    : null;

  return (
    <div className="bg-rui-white rounded-rui-16 border border-rui-grey-10 p-rui-16 shadow-rui-1 hover:shadow-rui-2 transition-shadow duration-rui-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-rui-12 flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trendIcon}
      </div>
      <p className="text-heading-2 text-rui-black">{value}</p>
      <p className="text-body-2 text-rui-grey-50">{title}</p>
      {subtitle && (
        <p className="text-body-3 text-rui-grey-20 mt-1">{subtitle}</p>
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
      <div className="flex items-center justify-center text-rui-grey-20 text-body-2" style={{ height }}>
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
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.15, 0.5, 0.5, 1] }}
              className="w-full bg-warning rounded-t-sm"
            />
            <span className="text-[10px] text-rui-grey-50 truncate w-full text-center">
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
  color = '#D4A853', // warning color
}: {
  data: number[];
  height?: number;
  color?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-rui-grey-20 text-body-3" style={{ height }}>
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
      <div className="bg-rui-white rounded-rui-16 border border-rui-grey-10 p-rui-16 shadow-rui-1">
        <h3 className="text-emphasis-2 text-rui-black mb-3">{title}</h3>
        <p className="text-body-2 text-rui-grey-20">No data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-rui-white rounded-rui-16 border border-rui-grey-10 p-rui-16 shadow-rui-1">
      <h3 className="text-emphasis-2 text-rui-black mb-3">{title}</h3>
      <div className="space-y-2">
        {entries.slice(0, 5).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-body-2 text-rui-grey-50 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-body-2 font-medium text-rui-black">{formatNumber(value)}</span>
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
    <div className={`min-h-screen bg-rui-grey-2 ${className}`}>
      {/* Header */}
      <div className="bg-rui-white border-b border-rui-grey-10 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-heading-2 text-rui-black">
              Monetisation Analytics
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-rui-8 hover:bg-rui-grey-5 text-rui-grey-50 transition-colors duration-rui-sm"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-rui-12 bg-rui-grey-5 hover:bg-rui-grey-8 text-rui-black text-body-2 font-medium transition-colors duration-rui-sm"
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
          <h2 className="text-emphasis-3 text-rui-grey-50 uppercase tracking-wide mb-3">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(data.subscription.totalRevenueCents)}
              icon={CreditCard}
              color="success"
            />
            <MetricCard
              title="Premium Subscribers"
              value={data.subscription.currentPremium}
              subtitle={`MRR: ${formatCurrency(data.subscription.mrrCents)}`}
              icon={Crown}
              color="warning"
            />
            <MetricCard
              title="Affiliate Clicks"
              value={formatNumber(data.booking.totalClicks)}
              icon={MousePointerClick}
              color="neutral"
            />
            <MetricCard
              title="Trial Conversion"
              value={formatPercent(data.subscription.trialConversionRate)}
              subtitle={`${data.subscription.trialsConverted}/${data.subscription.trialsStarted}`}
              icon={TrendingUp}
              color={data.subscription.trialConversionRate > 0.3 ? 'success' : 'danger'}
            />
          </div>
        </section>

        {/* Subscription Metrics */}
        <section>
          <h2 className="text-emphasis-3 text-rui-grey-50 uppercase tracking-wide mb-3">
            Subscription
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Trials Started"
              value={data.subscription.trialsStarted}
              icon={Users}
              color="neutral"
            />
            <MetricCard
              title="Trials Converted"
              value={data.subscription.trialsConverted}
              icon={TrendingUp}
              color="success"
            />
            <MetricCard
              title="Canceled"
              value={data.subscription.canceled}
              icon={TrendingDown}
              color="danger"
            />
            <MetricCard
              title="Churn Rate"
              value={formatPercent(data.subscription.churnRate)}
              icon={BarChart3}
              color={data.subscription.churnRate < 0.1 ? 'success' : 'danger'}
            />
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid md:grid-cols-2 gap-4">
          {/* Revenue Trend */}
          <div className="bg-rui-white rounded-rui-16 border border-rui-grey-10 p-rui-16 shadow-rui-1">
            <h3 className="text-emphasis-2 text-rui-black mb-4">Revenue Trend</h3>
            <MiniLineChart data={revenueData} height={80} color="#4A7C59" />
            <div className="flex items-center justify-between mt-2 text-body-3 text-rui-grey-50">
              <span>{data.timeSeries[0]?.date || '-'}</span>
              <span>{data.timeSeries[data.timeSeries.length - 1]?.date || '-'}</span>
            </div>
          </div>

          {/* Clicks Trend */}
          <div className="bg-rui-white rounded-rui-16 border border-rui-grey-10 p-rui-16 shadow-rui-1">
            <h3 className="text-emphasis-2 text-rui-black mb-4">Affiliate Clicks</h3>
            <MiniLineChart data={clicksData} height={80} color="#D4A853" />
            <div className="flex items-center justify-between mt-2 text-body-3 text-rui-grey-50">
              <span>{data.timeSeries[0]?.date || '-'}</span>
              <span>{data.timeSeries[data.timeSeries.length - 1]?.date || '-'}</span>
            </div>
          </div>
        </section>

        {/* Partner Breakdown */}
        <section>
          <h2 className="text-emphasis-3 text-rui-grey-50 uppercase tracking-wide mb-3">
            Clicks by Partner
          </h2>
          <div className="bg-rui-white rounded-rui-16 border border-rui-grey-10 p-rui-16 shadow-rui-1">
            {partnerData.length > 0 ? (
              <BarChart data={partnerData} height={120} />
            ) : (
              <p className="text-body-2 text-rui-grey-20 text-center py-8">No click data yet</p>
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
          <h2 className="text-emphasis-3 text-rui-grey-50 uppercase tracking-wide mb-3">
            Upgrade Prompts
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Prompts Shown"
              value={data.upgradePrompts.shown}
              icon={Users}
              color="neutral"
            />
            <MetricCard
              title="CTA Clicked"
              value={data.upgradePrompts.clicked}
              icon={MousePointerClick}
              color="success"
            />
            <MetricCard
              title="Dismissed"
              value={data.upgradePrompts.dismissed}
              icon={TrendingDown}
              color="danger"
            />
            <MetricCard
              title="Click-through Rate"
              value={formatPercent(data.upgradePrompts.ctr)}
              icon={TrendingUp}
              color={data.upgradePrompts.ctr > 0.1 ? 'success' : 'neutral'}
            />
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-4 border-t border-rui-grey-10">
          <p className="text-body-3 text-rui-grey-20">
            Data stored locally. Export for detailed analysis.
          </p>
        </section>
      </div>
    </div>
  );
}

export default MonetisationDashboard;
