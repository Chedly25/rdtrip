/**
 * TripOverviewHeader
 *
 * Elegant summary header showing the full trip at a glance.
 * Features city chips, progress indicators, and animated stats.
 *
 * Design: Warm Editorial with layered depth and scroll-responsive behavior.
 */

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Calendar,
  Footprints,
  Gem,
  ChevronRight,
  Sparkles,
  Clock,
  MapPin,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { haversineDistance } from '../../utils/planningEnrichment';
import type { Slot } from '../../types/planning';

// ============================================================================
// Constants
// ============================================================================

const SLOT_ORDER: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

// ============================================================================
// Props Interface
// ============================================================================

interface TripOverviewHeaderProps {
  onCityClick?: (cityIndex: number) => void;
  onExportClick?: () => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function TripOverviewHeader({
  onCityClick,
  onExportClick,
  className = '',
}: TripOverviewHeaderProps) {
  const { tripPlan, currentDayIndex, setCurrentDay } = usePlanningStore();
  const [isCompact, setIsCompact] = useState(false);

  // Scroll-based compaction
  useEffect(() => {
    const handleScroll = () => {
      setIsCompact(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate trip statistics
  const stats = useMemo(() => {
    if (!tripPlan) return null;

    let totalActivities = 0;
    let totalDurationMins = 0;
    let totalWalkingKm = 0;
    let hiddenGemsCount = 0;
    let plannedDays = 0;

    for (const day of tripPlan.days) {
      const dayItems: Array<{ place: { geometry: { location: { lat: number; lng: number } }; estimated_duration_mins: number; is_hidden_gem: boolean } }> = [];

      for (const slot of SLOT_ORDER) {
        dayItems.push(...day.slots[slot]);
      }

      if (dayItems.length > 0) {
        plannedDays++;
      }

      totalActivities += dayItems.length;
      totalDurationMins += dayItems.reduce(
        (sum, item) => sum + item.place.estimated_duration_mins,
        0
      );
      hiddenGemsCount += dayItems.filter((item) => item.place.is_hidden_gem).length;

      // Calculate walking distance for this day
      for (let i = 1; i < dayItems.length; i++) {
        const from = dayItems[i - 1].place.geometry.location;
        const to = dayItems[i].place.geometry.location;
        totalWalkingKm += haversineDistance(from.lat, from.lng, to.lat, to.lng);
      }
    }

    // Group cities with day counts
    const citiesWithDays: Array<{
      name: string;
      days: number[];
      totalDays: number;
    }> = [];

    let currentCity: typeof citiesWithDays[0] | null = null;

    tripPlan.days.forEach((day, index) => {
      if (!currentCity || currentCity.name !== day.city.name) {
        currentCity = {
          name: day.city.name,
          days: [index],
          totalDays: 1,
        };
        citiesWithDays.push(currentCity);
      } else {
        currentCity.days.push(index);
        currentCity.totalDays++;
      }
    });

    return {
      totalActivities,
      totalDurationHours: Math.round(totalDurationMins / 60),
      totalWalkingKm: Math.round(totalWalkingKm * 10) / 10,
      hiddenGemsCount,
      plannedDays,
      totalDays: tripPlan.days.length,
      citiesWithDays,
      completionPercent: Math.round((plannedDays / tripPlan.days.length) * 100),
    };
  }, [tripPlan]);

  if (!tripPlan || !stats) return null;

  return (
    <motion.div
      layout
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-rose-50/30" />

      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C45830' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative">
        <AnimatePresence mode="wait">
          {isCompact ? (
            <CompactHeader
              key="compact"
              stats={stats}
              currentDayIndex={currentDayIndex}
              onCityClick={onCityClick}
            />
          ) : (
            <ExpandedHeader
              key="expanded"
              stats={stats}
              currentDayIndex={currentDayIndex}
              setCurrentDay={setCurrentDay}
              onCityClick={onCityClick}
              onExportClick={onExportClick}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Expanded Header
// ============================================================================

interface ExpandedHeaderProps {
  stats: {
    totalActivities: number;
    totalDurationHours: number;
    totalWalkingKm: number;
    hiddenGemsCount: number;
    plannedDays: number;
    totalDays: number;
    citiesWithDays: Array<{ name: string; days: number[]; totalDays: number }>;
    completionPercent: number;
  };
  currentDayIndex: number;
  setCurrentDay: (index: number) => void;
  onCityClick?: (cityIndex: number) => void;
  onExportClick?: () => void;
}

function ExpandedHeader({
  stats,
  currentDayIndex,
  setCurrentDay,
  onCityClick,
  onExportClick: _onExportClick,
}: ExpandedHeaderProps) {
  void _onExportClick; // Reserved for future export button integration
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-6 py-5"
    >
      {/* Title Row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rui-accent to-orange-500 flex items-center justify-center shadow-lg shadow-rui-accent/20">
            <Map className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl text-rui-black">
              Your Trip Overview
            </h2>
            <p className="text-body-3 text-rui-grey-50">
              {stats.totalDays} days · {stats.citiesWithDays.length} {stats.citiesWithDays.length === 1 ? 'city' : 'cities'}
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-body-3 text-rui-grey-50">Planning progress</p>
            <p className="font-display text-lg text-rui-black">
              {stats.plannedDays} of {stats.totalDays} days
            </p>
          </div>
          <ProgressRing
            percentage={stats.completionPercent}
            size={56}
            strokeWidth={4}
          >
            <span className="font-display text-sm text-rui-accent">
              {stats.completionPercent}%
            </span>
          </ProgressRing>
        </div>
      </div>

      {/* City chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {stats.citiesWithDays.map((city, cityIndex) => {
          const isCurrentCity = city.days.includes(currentDayIndex);

          return (
            <motion.button
              key={city.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Navigate to first day of this city
                setCurrentDay(city.days[0]);
                onCityClick?.(cityIndex);
              }}
              className={`
                group flex items-center gap-2 px-4 py-2.5 rounded-xl
                border-2 transition-all
                ${isCurrentCity
                  ? 'border-rui-accent bg-rui-accent/10 shadow-md'
                  : 'border-rui-grey-10 bg-white/80 hover:border-rui-grey-30 hover:shadow-sm'
                }
              `}
            >
              <MapPin className={`w-4 h-4 ${isCurrentCity ? 'text-rui-accent' : 'text-rui-grey-40 group-hover:text-rui-grey-60'}`} />
              <span className={`font-medium text-body-2 ${isCurrentCity ? 'text-rui-accent' : 'text-rui-grey-70'}`}>
                {city.name}
              </span>
              <span className={`px-1.5 py-0.5 rounded-md text-body-3 ${isCurrentCity ? 'bg-rui-accent/20 text-rui-accent' : 'bg-rui-grey-10 text-rui-grey-50'}`}>
                {city.totalDays} {city.totalDays === 1 ? 'day' : 'days'}
              </span>
              <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isCurrentCity ? 'text-rui-accent' : 'text-rui-grey-40'}`} />
            </motion.button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          label="Activities"
          value={stats.totalActivities.toString()}
          color="amber"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Total Time"
          value={`${stats.totalDurationHours}h`}
          color="orange"
        />
        <StatCard
          icon={<Footprints className="w-4 h-4" />}
          label="Walking"
          value={`${stats.totalWalkingKm} km`}
          color="rose"
        />
        <StatCard
          icon={<Gem className="w-4 h-4" />}
          label="Hidden Gems"
          value={stats.hiddenGemsCount.toString()}
          color="purple"
          highlight={stats.hiddenGemsCount > 0}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// Compact Header (when scrolled)
// ============================================================================

interface CompactHeaderProps {
  stats: {
    totalActivities: number;
    plannedDays: number;
    totalDays: number;
    citiesWithDays: Array<{ name: string; days: number[]; totalDays: number }>;
    completionPercent: number;
  };
  currentDayIndex: number;
  onCityClick?: (cityIndex: number) => void;
}

function CompactHeader({ stats, currentDayIndex, onCityClick: _onCityClick }: CompactHeaderProps) {
  void _onCityClick; // Reserved for future city click handling
  // Find current city
  const currentCity = stats.citiesWithDays.find((city) =>
    city.days.includes(currentDayIndex)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-4 py-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rui-accent to-orange-500 flex items-center justify-center">
          <Map className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          {currentCity && (
            <span className="px-2.5 py-1 rounded-lg bg-rui-accent/10 text-body-3 font-medium text-rui-accent">
              {currentCity.name}
            </span>
          )}
          <span className="text-body-3 text-rui-grey-50">
            {stats.totalActivities} activities · {stats.plannedDays}/{stats.totalDays} days
          </span>
        </div>
      </div>

      {/* Mini progress */}
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-rui-grey-10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionPercent}%` }}
            className="h-full bg-rui-accent rounded-full"
          />
        </div>
        <span className="text-body-3 text-rui-grey-50 font-medium">
          {stats.completionPercent}%
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'amber' | 'orange' | 'rose' | 'purple';
  highlight?: boolean;
}

const COLOR_CLASSES: Record<string, { bg: string; text: string; icon: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
};

function StatCard({ icon, label, value, color, highlight }: StatCardProps) {
  const colors = COLOR_CLASSES[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative p-3 rounded-xl border transition-shadow
        ${highlight
          ? `${colors.bg} border-${color}-200 shadow-sm`
          : 'bg-white/80 border-rui-grey-10 hover:shadow-sm'
        }
      `}
    >
      {highlight && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
        </motion.div>
      )}

      <div className="flex items-center gap-2 mb-1">
        <span className={highlight ? colors.icon : 'text-rui-grey-40'}>
          {icon}
        </span>
        <span className="text-body-3 text-rui-grey-50">{label}</span>
      </div>
      <p className={`font-display text-lg ${highlight ? colors.text : 'text-rui-black'}`}>
        {value}
      </p>
    </motion.div>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

function ProgressRing({
  percentage,
  size = 56,
  strokeWidth = 4,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5DDD0"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#C45830"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default TripOverviewHeader;
