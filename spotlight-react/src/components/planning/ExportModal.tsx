/**
 * ExportModal
 *
 * Beautiful export options panel with format selection,
 * preview, and delightful download animations.
 *
 * Design: Warm Editorial with clear hierarchy and tactile interactions.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  Calendar,
  Map,
  Share2,
  Check,
  MapPin,
  FileJson,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { exportTripPlan, type ExportFormat as ExportFormatType } from '../../utils/planningExport';
import type { Slot } from '../../types/planning';

// ============================================================================
// Export Format Configuration
// ============================================================================

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  fileExtension: string;
  features: string[];
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Itinerary',
    description: 'Printable day-by-day guide',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    fileExtension: 'pdf',
    features: ['Printable format', 'Maps included', 'All details'],
  },
  {
    id: 'calendar',
    name: 'Calendar Events',
    description: 'Import to Google/Apple Calendar',
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    fileExtension: 'ics',
    features: ['Time blocks', 'Location links', 'Reminders'],
  },
  {
    id: 'google-maps',
    name: 'Google Maps List',
    description: 'Save all places to a list',
    icon: <Map className="w-5 h-5" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    fileExtension: 'url',
    features: ['One-tap navigation', 'Offline maps', 'Share with group'],
  },
  {
    id: 'json',
    name: 'Data Export',
    description: 'Machine-readable format',
    icon: <FileJson className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    fileExtension: 'json',
    features: ['Full data', 'API compatible', 'Backup'],
  },
];

// ============================================================================
// Props Interface
// ============================================================================

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { tripPlan } = usePlanningStore();

  const [selectedFormat, setSelectedFormat] = useState<string>('calendar');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  // Calendar-specific options
  const [calendarOptions, setCalendarOptions] = useState({
    includeTravelTime: true,
    setReminders: true,
    reminderMinutes: 30,
  });

  // Calculate export preview stats
  const exportStats = useMemo(() => {
    if (!tripPlan) return null;

    let totalActivities = 0;
    let totalDays = tripPlan.days.length;
    const cities = new Set<string>();

    for (const day of tripPlan.days) {
      cities.add(day.city.name);
      const slots: Slot[] = ['morning', 'afternoon', 'evening', 'night'];
      for (const slot of slots) {
        totalActivities += day.slots[slot].length;
      }
    }

    return {
      totalActivities,
      totalDays,
      citiesCount: cities.size,
      cities: Array.from(cities),
    };
  }, [tripPlan]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!tripPlan) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    setExportedUrl(null);

    // Map UI format IDs to export format types
    const formatMap: Record<string, ExportFormatType> = {
      'pdf': 'pdf',
      'calendar': 'ics',
      'google-maps': 'google-maps',
      'json': 'json',
    };

    const exportFormat = formatMap[selectedFormat];

    // Animate progress
    const progressInterval = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + 15, 80));
    }, 150);

    try {
      const result = await exportTripPlan(tripPlan, exportFormat, {
        includeTravelTime: calendarOptions.includeTravelTime,
        setReminders: calendarOptions.setReminders,
        reminderMinutes: calendarOptions.reminderMinutes,
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (result.success) {
        setExportComplete(true);
        if (result.url) {
          setExportedUrl(result.url);
        }
      } else {
        setExportError(result.error || 'Export failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);

      // Reset success state after delay
      setTimeout(() => {
        setExportComplete(false);
        setExportProgress(0);
      }, 4000);
    }
  }, [tripPlan, selectedFormat, calendarOptions]);

  const selectedFormatConfig = EXPORT_FORMATS.find((f) => f.id === selectedFormat);

  if (!tripPlan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-rui-white rounded-2xl shadow-rui-4 overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-rui-grey-10">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-50/50 via-amber-50/30 to-emerald-50/50" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rui-accent to-orange-500 flex items-center justify-center shadow-lg shadow-rui-accent/20">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-rui-black">
                      Export Your Trip
                    </h2>
                    <p className="text-body-3 text-rui-grey-50">
                      Take your plans anywhere
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-rui-grey-40 hover:bg-rui-grey-5 hover:text-rui-grey-60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Export preview */}
              {exportStats && (
                <div className="mb-6 p-4 rounded-xl bg-rui-grey-5 border border-rui-grey-10">
                  <p className="text-body-3 text-rui-grey-50 mb-3">What you're exporting</p>
                  <div className="flex items-center gap-4 text-body-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rui-grey-40" />
                      <span className="text-rui-grey-70">{exportStats.totalDays} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rui-grey-40" />
                      <span className="text-rui-grey-70">{exportStats.totalActivities} activities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map className="w-4 h-4 text-rui-grey-40" />
                      <span className="text-rui-grey-70">{exportStats.cities.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Format selection */}
              <div className="mb-6">
                <p className="text-body-2 font-medium text-rui-black mb-3">
                  Choose format
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {EXPORT_FORMATS.map((format) => (
                    <FormatCard
                      key={format.id}
                      format={format}
                      isSelected={selectedFormat === format.id}
                      onSelect={() => setSelectedFormat(format.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Format-specific options */}
              <AnimatePresence mode="wait">
                {selectedFormat === 'calendar' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-body-2 font-medium text-blue-800 mb-3">
                        Calendar options
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={calendarOptions.includeTravelTime}
                            onChange={(e) =>
                              setCalendarOptions({
                                ...calendarOptions,
                                includeTravelTime: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-body-2 text-blue-800">
                            Include travel time between activities
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={calendarOptions.setReminders}
                            onChange={(e) =>
                              setCalendarOptions({
                                ...calendarOptions,
                                setReminders: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-body-2 text-blue-800">
                            Set {calendarOptions.reminderMinutes} min reminders
                          </span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Features list */}
              {selectedFormatConfig && (
                <div className="mb-6">
                  <p className="text-body-3 text-rui-grey-50 mb-2">Includes</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFormatConfig.features.map((feature) => (
                      <span
                        key={feature}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rui-grey-5 text-body-3 text-rui-grey-60"
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-rui-grey-10 bg-rui-grey-2">
              {/* Progress bar (visible during export) */}
              <AnimatePresence>
                {isExporting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body-3 text-rui-grey-50">
                        Preparing your export...
                      </span>
                      <span className="text-body-3 font-medium text-rui-accent">
                        {Math.round(exportProgress)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-rui-grey-10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${exportProgress}%` }}
                        className="h-full bg-gradient-to-r from-rui-accent to-orange-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              <AnimatePresence>
                {exportError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body-2 font-medium text-rose-800">
                        Export failed
                      </p>
                      <p className="text-body-3 text-rose-600">
                        {exportError}
                      </p>
                    </div>
                    <button
                      onClick={() => setExportError(null)}
                      className="p-1 rounded hover:bg-rose-100"
                    >
                      <X className="w-4 h-4 text-rose-500" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success message */}
              <AnimatePresence>
                {exportComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body-2 font-medium text-emerald-800">
                        Export ready!
                      </p>
                      <p className="text-body-3 text-emerald-600">
                        {exportedUrl
                          ? 'Google Maps opened in a new tab'
                          : 'Your download should start automatically'}
                      </p>
                    </div>
                    {exportedUrl && (
                      <a
                        href={exportedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-body-3 font-medium hover:bg-emerald-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Maps
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-body-2 font-medium text-rui-grey-60 hover:bg-rui-grey-10 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  {/* Share button */}
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-2 font-medium text-rui-grey-60 bg-white border border-rui-grey-10 hover:bg-rui-grey-5 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share Link
                  </button>

                  {/* Export button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    disabled={isExporting}
                    className={`
                      flex items-center gap-2 px-6 py-2.5 rounded-xl text-body-2 font-medium
                      transition-all shadow-md hover:shadow-lg
                      ${isExporting
                        ? 'bg-rui-grey-30 text-white cursor-wait'
                        : 'bg-rui-accent text-white hover:bg-rui-accent/90'
                      }
                    `}
                  >
                    {isExporting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Exporting...
                      </>
                    ) : exportComplete ? (
                      <>
                        <Check className="w-4 h-4" />
                        Done!
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export {selectedFormatConfig?.name.split(' ')[0]}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface FormatCardProps {
  format: ExportFormat;
  isSelected: boolean;
  onSelect: () => void;
}

function FormatCard({ format, isSelected, onSelect }: FormatCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative p-4 rounded-xl border-2 text-left transition-all
        ${isSelected
          ? 'border-rui-accent bg-rui-accent/5 shadow-md'
          : 'border-rui-grey-10 bg-white hover:border-rui-grey-30 hover:shadow-sm'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rui-accent flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${format.bgColor} flex items-center justify-center ${format.color}`}>
          {format.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-2 font-medium text-rui-black mb-0.5">
            {format.name}
          </p>
          <p className="text-body-3 text-rui-grey-50 line-clamp-1">
            {format.description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ExportModal;
