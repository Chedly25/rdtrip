/**
 * IntelligenceCacheManager
 *
 * A sophisticated cache management interface for city intelligence data.
 * Shows cache status, allows clearing specific caches, and provides
 * insights into storage usage.
 *
 * Design Philosophy:
 * - Data visualization with warm, approachable aesthetics
 * - Clear visual hierarchy showing cache health
 * - Satisfying clear/refresh interactions
 * - Transparency about what's cached and why
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Trash2,
  RefreshCw,
  Clock,
  MapPin,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Zap,
  Archive,
  X,
  CloudOff,
} from 'lucide-react';
import { useCityIntelligenceStore } from '../../stores/cityIntelligenceStore';

// =============================================================================
// Types
// =============================================================================

interface CacheEntry {
  cityId: string;
  cityName: string;
  cachedAt: Date;
  size: number; // bytes
  quality: number;
  sections: string[];
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  averageQuality: number;
}

interface IntelligenceCacheManagerProps {
  /** Callback when cache is cleared */
  onCacheCleared?: () => void;
  /** Variant style */
  variant?: 'panel' | 'inline' | 'compact';
}

// =============================================================================
// Cache Utilities
// =============================================================================

const CACHE_KEY = 'waycraft-city-intelligence';

function getCacheEntries(): CacheEntry[] {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);
    const cityIntelligence = data?.state?.cityIntelligence || {};

    return Object.entries(cityIntelligence).map(([cityId, intel]: [string, any]) => ({
      cityId,
      cityName: intel.city?.name || cityId,
      cachedAt: new Date(intel.cachedAt || Date.now()),
      size: JSON.stringify(intel).length,
      quality: intel.quality || 0,
      sections: [
        intel.story && 'Story',
        intel.timeBlocks && 'Time',
        intel.clusters && 'Clusters',
        intel.matchScore && 'Match',
        intel.hiddenGems && 'Gems',
        intel.logistics && 'Logistics',
        intel.weather && 'Weather',
        intel.photoSpots && 'Photos',
      ].filter(Boolean) as string[],
    }));
  } catch {
    return [];
  }
}

function getCacheStats(entries: CacheEntry[]): CacheStats {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
      averageQuality: 0,
    };
  }

  const dates = entries.map(e => e.cachedAt.getTime());
  const qualities = entries.map(e => e.quality);

  return {
    totalEntries: entries.length,
    totalSize: entries.reduce((sum, e) => sum + e.size, 0),
    oldestEntry: new Date(Math.min(...dates)),
    newestEntry: new Date(Math.max(...dates)),
    averageQuality: Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length),
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// =============================================================================
// Main Component
// =============================================================================

export function IntelligenceCacheManager({
  onCacheCleared,
  variant = 'panel',
}: IntelligenceCacheManagerProps) {
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [clearingCityId, setClearingCityId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const reset = useCityIntelligenceStore(s => s.reset);

  // Load cache entries
  useEffect(() => {
    setEntries(getCacheEntries());
  }, []);

  const stats = useMemo(() => getCacheStats(entries), [entries]);

  // Clear all cache
  const handleClearAll = useCallback(async () => {
    setIsClearing(true);
    setShowConfirmClear(false);

    // Animate out
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear the store
    reset();

    // Also clear localStorage
    localStorage.removeItem(CACHE_KEY);

    setEntries([]);
    setIsClearing(false);
    onCacheCleared?.();
  }, [reset, onCacheCleared]);

  // Clear single entry
  const handleClearEntry = useCallback(async (cityId: string) => {
    setClearingCityId(cityId);

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data?.state?.cityIntelligence?.[cityId]) {
          delete data.state.cityIntelligence[cityId];
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error('Failed to clear cache entry:', e);
    }

    setEntries(prev => prev.filter(e => e.cityId !== cityId));
    setClearingCityId(null);
  }, []);

  // Refresh entries
  const handleRefresh = useCallback(() => {
    setEntries(getCacheEntries());
  }, []);

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
        <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
          <Database className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {stats.totalEntries} cities cached
          </p>
          <p className="text-xs text-gray-500">{formatBytes(stats.totalSize)}</p>
        </div>
        <button
          onClick={() => setShowConfirmClear(true)}
          disabled={stats.totalEntries === 0}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-2xl border border-gray-200 overflow-hidden
        ${variant === 'panel' ? 'shadow-xl' : ''}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Intelligence Cache</h3>
              <p className="text-xs text-gray-500">
                {stats.totalEntries} cities • {formatBytes(stats.totalSize)}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats.totalEntries > 0 && (
        <div className="grid grid-cols-3 gap-px bg-gray-100">
          <StatCard
            icon={Archive}
            value={stats.totalEntries.toString()}
            label="Cities"
            color="violet"
          />
          <StatCard
            icon={HardDrive}
            value={formatBytes(stats.totalSize)}
            label="Size"
            color="sky"
          />
          <StatCard
            icon={Sparkles}
            value={`${stats.averageQuality}%`}
            label="Avg Quality"
            color="amber"
          />
        </div>
      )}

      {/* Cache Entries */}
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <CloudOff className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No cached data</p>
              <p className="text-xs text-gray-500 mt-1">
                Intelligence data will be cached as you explore cities
              </p>
            </motion.div>
          ) : (
            entries.map((entry, idx) => (
              <motion.div
                key={entry.cityId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: clearingCityId === entry.cityId ? 0 : 1,
                  x: clearingCityId === entry.cityId ? 20 : 0,
                }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className={`
                  border-b border-gray-100 last:border-b-0
                  ${clearingCityId === entry.cityId ? 'pointer-events-none' : ''}
                `}
              >
                <button
                  onClick={() => setExpandedEntry(
                    expandedEntry === entry.cityId ? null : entry.cityId
                  )}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Quality indicator */}
                  <div className="relative">
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        ${entry.quality >= 85
                          ? 'bg-emerald-100'
                          : entry.quality >= 70
                            ? 'bg-amber-100'
                            : 'bg-gray-100'
                        }
                      `}
                    >
                      <MapPin
                        className={`w-5 h-5 ${
                          entry.quality >= 85
                            ? 'text-emerald-600'
                            : entry.quality >= 70
                              ? 'text-amber-600'
                              : 'text-gray-500'
                        }`}
                      />
                    </div>
                    {entry.quality >= 85 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 text-sm">{entry.cityName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {entry.quality}% quality
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(entry.cachedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <motion.div
                    animate={{ rotate: expandedEntry === entry.cityId ? 90 : 0 }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {expandedEntry === entry.cityId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50"
                    >
                      <div className="p-3 space-y-3">
                        {/* Sections */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Cached Sections
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {entry.sections.map(section => (
                              <span
                                key={section}
                                className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-600"
                              >
                                {section}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Size */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Storage used</span>
                          <span className="font-medium text-gray-700">{formatBytes(entry.size)}</span>
                        </div>

                        {/* Clear button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearEntry(entry.cityId);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove from cache
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {stats.totalEntries > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={isClearing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            {isClearing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Clear All Cache
          </button>
        </div>
      )}

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmClear(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  Clear All Cache?
                </h3>
                <p className="text-sm text-gray-500">
                  This will remove cached intelligence for {stats.totalEntries} cities.
                  You'll need to regenerate intelligence for these cities.
                </p>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// Stat Card
// =============================================================================

interface StatCardProps {
  icon: typeof Database;
  value: string;
  label: string;
  color: 'violet' | 'sky' | 'amber';
}

function StatCard({ icon: Icon, value, label, color }: StatCardProps) {
  const colorClasses = {
    violet: 'text-violet-600 bg-violet-50',
    sky: 'text-sky-600 bg-sky-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  return (
    <div className="bg-white p-3 text-center">
      <div className={`w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="font-bold text-gray-900 text-lg">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default IntelligenceCacheManager;
