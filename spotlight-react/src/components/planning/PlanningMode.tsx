/**
 * PlanningMode
 *
 * Main orchestrator for Planning Mode.
 * Transforms discovered activities into a coherent day-by-day trip plan.
 *
 * Layout:
 * - Desktop: Map (60%) | Day View (40%)
 * - Mobile: Full-height scrollable day view with floating header
 *
 * Philosophy: "Chill over precise" - slot-based, not time-based
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Map,
  List,
  Undo2,
  Redo2,
  Download,
  X,
  CheckCircle2,
  MessageCircle,
  GitCompare,
} from 'lucide-react';
import { usePlanningStore, usePlanningKeyboardShortcuts } from '../../stores/planningStore';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import { DayNavigator, CompactDayNavigator } from './DayNavigator';
import { DayView, AllDaysOverview } from './DayView';
import { AddPanel } from './AddPanel';
import { PlanningCompanion } from './PlanningCompanion';
import { PlanningMap } from './PlanningMap';
import { FlowScoreCard } from './FlowScoreCard';
import { ConflictWarnings } from './ConflictWarnings';
import { TripOverviewHeader } from './TripOverviewHeader';
import { ExportModal } from './ExportModal';
import { DayComparisonView } from './DayComparisonView';
import { CrossDayMoveModal } from './CrossDayMoveModal';
import type { PlannedItem } from '../../types/planning';

// ============================================================================
// Component
// ============================================================================

export function PlanningMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    tripPlan,
    currentDayIndex,
    addPanelState,
    canUndo,
    canRedo,
    undo,
    redo,
    lastToast,
    clearToast,
    initializePlan,
  } = usePlanningStore();

  const { route, tripSummary, getSelectedCities } = useDiscoveryStore();

  // UI State
  const [isDesktop, setIsDesktop] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [showOverview, setShowOverview] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);

  // Modal States (Phase 3-5)
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [crossDayMoveItem, setCrossDayMoveItem] = useState<PlannedItem | null>(null);

  // Initialize keyboard shortcuts
  usePlanningKeyboardShortcuts();

  // Check viewport size
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Initialize plan from discovery data if not already loaded
  useEffect(() => {
    if (tripPlan) return; // Already have a plan

    // Check if we have discovery data to build from
    if (route && tripSummary) {
      const selectedCities = getSelectedCities();
      if (selectedCities.length >= 2) {
        const cities = selectedCities.map((city) => ({
          id: city.id,
          name: city.name,
          country: city.country,
          coordinates: city.coordinates,
          nights: city.nights || city.suggestedNights || 1,
        }));

        const routeId = searchParams.get('routeId') || `plan-${Date.now()}`;
        
        // Ensure startDate is a proper Date object (may be string from localStorage)
        let startDate: Date;
        if (tripSummary.startDate instanceof Date) {
          startDate = tripSummary.startDate;
        } else if (typeof tripSummary.startDate === 'string') {
          startDate = new Date(tripSummary.startDate);
        } else {
          startDate = new Date(); // Fallback to today
        }
        
        // Only initialize if we have a valid date
        if (!isNaN(startDate.getTime())) {
          initializePlan(routeId, cities, startDate);
        } else {
          console.error('[PlanningMode] Invalid start date, using today');
          initializePlan(routeId, cities, new Date());
        }
      }
    }
  }, [route, tripSummary, tripPlan, getSelectedCities, initializePlan, searchParams]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (lastToast) {
      const timer = setTimeout(clearToast, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastToast, clearToast]);

  // If no trip plan and no discovery data to build from, redirect to discover
  useEffect(() => {
    if (!tripPlan && !route) {
      // No plan and no discovery data - redirect back to discover
      console.warn('[PlanningMode] No plan or discovery data, redirecting to /discover');
      navigate('/discover');
    }
  }, [tripPlan, route, navigate]);

  // Loading state
  if (!tripPlan) {
    return <PlanningLoadingState />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-rui-cream relative flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-rui-white border-b border-rui-grey-10 z-20">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="touch-target flex items-center justify-center text-rui-grey-60 hover:text-rui-black transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-xl text-rui-black">
                Plan Your Days
              </h1>
              <p className="text-body-3 text-rui-grey-50 hidden sm:block">
                {tripPlan.days.length} days · {route?.origin.name} to {route?.destination.name}
              </p>
            </div>
          </div>

          {/* Center: Day Navigator (Desktop) */}
          <div className="hidden lg:block">
            <CompactDayNavigator />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <button
                onClick={undo}
                disabled={!canUndo()}
                className={`
                  p-2 rounded-lg transition-colors
                  ${canUndo()
                    ? 'text-rui-grey-60 hover:bg-rui-grey-5 hover:text-rui-black'
                    : 'text-rui-grey-30 cursor-not-allowed'
                  }
                `}
                title="Undo (Cmd+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo()}
                className={`
                  p-2 rounded-lg transition-colors
                  ${canRedo()
                    ? 'text-rui-grey-60 hover:bg-rui-grey-5 hover:text-rui-black'
                    : 'text-rui-grey-30 cursor-not-allowed'
                  }
                `}
                title="Redo (Cmd+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Map/List Toggle (Desktop) */}
            {isDesktop && (
              <button
                onClick={() => setShowMap(!showMap)}
                className="p-2 rounded-lg text-rui-grey-60 hover:bg-rui-grey-5 hover:text-rui-black transition-colors"
                title={showMap ? 'Hide map' : 'Show map'}
              >
                {showMap ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              </button>
            )}

            {/* Overview Toggle */}
            <button
              onClick={() => setShowOverview(!showOverview)}
              className={`
                p-2 rounded-lg transition-colors
                ${showOverview
                  ? 'bg-rui-accent/10 text-rui-accent'
                  : 'text-rui-grey-60 hover:bg-rui-grey-5 hover:text-rui-black'
                }
              `}
              title="Trip overview"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {/* Companion Toggle */}
            <button
              onClick={() => setShowCompanion(!showCompanion)}
              className={`
                p-2 rounded-lg transition-colors relative
                ${showCompanion
                  ? 'bg-rui-accent/10 text-rui-accent'
                  : 'text-rui-grey-60 hover:bg-rui-grey-5 hover:text-rui-black'
                }
              `}
              title="AI Companion"
            >
              <MessageCircle className="w-4 h-4" />
              {/* Notification dot for proactive suggestions */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rui-accent" />
            </button>

            {/* Compare Days */}
            <button
              onClick={() => setShowComparisonView(true)}
              className="hidden sm:flex p-2 rounded-lg text-rui-grey-60 hover:bg-rui-grey-5 hover:text-rui-black transition-colors"
              title="Compare days"
            >
              <GitCompare className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              onClick={() => setShowExportModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-rui-grey-5 text-rui-grey-60 hover:bg-rui-grey-10 hover:text-rui-black transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-body-2">Export</span>
            </button>
          </div>
        </div>

        {/* Mobile Day Navigator */}
        <div className="lg:hidden">
          <DayNavigator />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Map Panel (Desktop) */}
        {isDesktop && showMap && (
          <div className="w-[55%] h-full border-r border-rui-grey-10 relative">
            <PlanningMap />
          </div>
        )}

        {/* Day View / Overview Panel */}
        <div
          className={`
            flex-1 h-full overflow-y-auto
            ${isDesktop && showMap ? '' : 'max-w-3xl mx-auto'}
          `}
        >
          <div className="p-4 lg:p-6">
            <AnimatePresence mode="wait">
              {showOverview ? (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Trip Overview Header */}
                  <TripOverviewHeader
                    onCityClick={(cityIndex) => {
                      // Navigate to the first day of the selected city
                      if (tripPlan && tripPlan.days.length > 0) {
                        const cities: string[] = [];
                        const cityDayMap: Record<string, number> = {};
                        tripPlan.days.forEach((day, index) => {
                          if (!cities.includes(day.city.name)) {
                            cities.push(day.city.name);
                            cityDayMap[day.city.name] = index;
                          }
                        });
                        const cityName = cities[cityIndex];
                        if (cityName && cityDayMap[cityName] !== undefined) {
                          usePlanningStore.getState().setCurrentDay(cityDayMap[cityName]);
                        }
                      }
                      setShowOverview(false);
                    }}
                    onExportClick={() => setShowExportModal(true)}
                    className="rounded-2xl border border-rui-grey-10 overflow-hidden"
                  />
                  <AllDaysOverview />
                </motion.div>
              ) : (
                <motion.div
                  key="dayview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Day Quality Indicator */}
                  <FlowScoreCard />

                  {/* Smart Warnings */}
                  <ConflictWarnings />

                  {/* Main Day View */}
                  <DayView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Companion Panel (Desktop Sidebar) */}
        <AnimatePresence>
          {isDesktop && showCompanion && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="h-full border-l border-rui-grey-10 overflow-hidden"
            >
              <PlanningCompanion onClose={() => setShowCompanion(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Companion Panel (Mobile Overlay) */}
      <AnimatePresence>
        {!isDesktop && showCompanion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCompanion(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 h-[85vh] bg-rui-white rounded-t-2xl overflow-hidden"
            >
              <PlanningCompanion onClose={() => setShowCompanion(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Panel Slide-out */}
      <AnimatePresence>
        {addPanelState.isOpen && (
          <AddPanel />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {lastToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-rui-black text-white rounded-xl shadow-rui-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-body-2">{lastToast.message}</span>
              {lastToast.action && (
                <button
                  onClick={() => {
                    undo();
                    clearToast();
                  }}
                  className="text-body-2 font-medium text-rui-accent hover:underline"
                >
                  Undo
                </button>
              )}
              <button
                onClick={clearToast}
                className="p-1 hover:bg-white/10 rounded transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================= */}
      {/* Phase 3-5 Modals */}
      {/* ============================================= */}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Day Comparison View */}
      <DayComparisonView
        isOpen={showComparisonView}
        onClose={() => setShowComparisonView(false)}
        initialLeftDay={currentDayIndex}
        initialRightDay={Math.min(currentDayIndex + 1, (tripPlan?.days.length ?? 1) - 1)}
      />

      {/* Cross-Day Move Modal */}
      {crossDayMoveItem && (
        <CrossDayMoveModal
          item={crossDayMoveItem}
          isOpen={!!crossDayMoveItem}
          onClose={() => setCrossDayMoveItem(null)}
        />
      )}

    </div>
  );
}

// ============================================================================
// Loading State
// ============================================================================

function PlanningLoadingState() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-rui-cream">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-rui-grey-20 border-t-rui-accent"
        />
        <p className="font-display text-xl text-rui-black mb-2">
          Preparing your planner
        </p>
        <p className="text-body-2 text-rui-grey-50">
          Getting everything ready...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default PlanningMode;
