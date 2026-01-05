/**
 * PlanningMode - Premium Travel Journal Edition
 *
 * A refined, tactile planning experience inspired by vintage travel journals.
 * Warm earth tones, elegant typography, and thoughtful micro-interactions.
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
  Compass,
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

  // Modal States
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

  // Initialize plan from discovery data
  useEffect(() => {
    if (tripPlan) return;

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

        let startDate: Date;
        if (tripSummary.startDate instanceof Date) {
          startDate = tripSummary.startDate;
        } else if (typeof tripSummary.startDate === 'string') {
          startDate = new Date(tripSummary.startDate);
        } else {
          startDate = new Date();
        }

        if (!isNaN(startDate.getTime())) {
          initializePlan(routeId, cities, startDate);
        } else {
          console.error('[PlanningMode] Invalid start date, using today');
          initializePlan(routeId, cities, new Date());
        }
      }
    }
  }, [route, tripSummary, tripPlan, getSelectedCities, initializePlan, searchParams]);

  const handleBack = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  useEffect(() => {
    if (lastToast) {
      const timer = setTimeout(clearToast, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastToast, clearToast]);

  useEffect(() => {
    if (!tripPlan && !route) {
      console.warn('[PlanningMode] No plan or discovery data, redirecting to /discover');
      navigate('/discover');
    }
  }, [tripPlan, route, navigate]);

  if (!tripPlan) {
    return <PlanningLoadingState />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative flex flex-col bg-gradient-to-br from-[#FAF8F3] via-[#FBF9F6] to-[#F5F0E8]">
      {/* Subtle paper texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')]" />

      {/* Header - Premium Travel Journal Style */}
      <header className="relative flex-shrink-0 bg-gradient-to-b from-rui-white/95 to-rui-white/80 backdrop-blur-md border-b-2 border-rui-accent/20 z-20">
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rui-accent/30 to-transparent" />

        <div className="flex items-center justify-between px-6 lg:px-8 py-4">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleBack}
              className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-rui-grey-5 border border-rui-grey-10 hover:border-rui-accent/30 transition-all duration-300"
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-rui-grey-60 group-hover:text-rui-accent transition-colors" />
            </motion.button>

            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-rui-accent opacity-60" />
                <h1 className="font-display text-2xl lg:text-3xl font-semibold text-rui-black tracking-tight">
                  Your Journey
                </h1>
              </div>
              <p className="text-body-2 text-rui-grey-50 mt-0.5 hidden sm:block">
                {tripPlan.days.length} {tripPlan.days.length === 1 ? 'day' : 'days'} · {route?.origin.name} to {route?.destination.name}
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
            <div className="hidden sm:flex items-center gap-1 mr-2 bg-rui-grey-2/50 rounded-xl p-1">
              <motion.button
                onClick={undo}
                disabled={!canUndo()}
                className={`
                  p-2.5 rounded-lg transition-all duration-200
                  ${canUndo()
                    ? 'text-rui-grey-60 hover:bg-rui-white hover:text-rui-accent hover:shadow-sm'
                    : 'text-rui-grey-30 cursor-not-allowed opacity-50'
                  }
                `}
                title="Undo (⌘+Z)"
                whileHover={canUndo() ? { scale: 1.05 } : {}}
                whileTap={canUndo() ? { scale: 0.95 } : {}}
              >
                <Undo2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={redo}
                disabled={!canRedo()}
                className={`
                  p-2.5 rounded-lg transition-all duration-200
                  ${canRedo()
                    ? 'text-rui-grey-60 hover:bg-rui-white hover:text-rui-accent hover:shadow-sm'
                    : 'text-rui-grey-30 cursor-not-allowed opacity-50'
                  }
                `}
                title="Redo (⌘+Shift+Z)"
                whileHover={canRedo() ? { scale: 1.05 } : {}}
                whileTap={canRedo() ? { scale: 0.95 } : {}}
              >
                <Redo2 className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Map Toggle */}
            {isDesktop && (
              <motion.button
                onClick={() => setShowMap(!showMap)}
                className="p-2.5 rounded-xl bg-rui-grey-2/50 border border-rui-grey-10 text-rui-grey-60 hover:bg-rui-white hover:border-rui-accent/30 hover:text-rui-accent transition-all duration-200"
                title={showMap ? 'Hide map' : 'Show map'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showMap ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              </motion.button>
            )}

            {/* Overview Toggle */}
            <motion.button
              onClick={() => setShowOverview(!showOverview)}
              className={`
                p-2.5 rounded-xl border transition-all duration-200
                ${showOverview
                  ? 'bg-rui-accent text-white border-rui-accent shadow-accent/20 shadow-md'
                  : 'bg-rui-grey-2/50 border-rui-grey-10 text-rui-grey-60 hover:bg-rui-white hover:border-rui-accent/30 hover:text-rui-accent'
                }
              `}
              title="Trip overview"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </motion.button>

            {/* Companion */}
            <motion.button
              onClick={() => setShowCompanion(!showCompanion)}
              className={`
                relative p-2.5 rounded-xl border transition-all duration-200
                ${showCompanion
                  ? 'bg-rui-accent text-white border-rui-accent shadow-accent/20 shadow-md'
                  : 'bg-rui-grey-2/50 border-rui-grey-10 text-rui-grey-60 hover:bg-rui-white hover:border-rui-accent/30 hover:text-rui-accent'
                }
              `}
              title="AI Companion"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-4 h-4" />
              <motion.span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-orange-400 to-rui-accent shadow-sm"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>

            {/* Compare */}
            <motion.button
              onClick={() => setShowComparisonView(true)}
              className="hidden sm:flex p-2.5 rounded-xl bg-rui-grey-2/50 border border-rui-grey-10 text-rui-grey-60 hover:bg-rui-white hover:border-rui-accent/30 hover:text-rui-accent transition-all duration-200"
              title="Compare days"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GitCompare className="w-4 h-4" />
            </motion.button>

            {/* Export */}
            <motion.button
              onClick={() => setShowExportModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rui-accent text-white border-2 border-rui-accent hover:bg-rui-accent/90 hover:shadow-accent/30 hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              <span className="text-body-2 font-medium">Export</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Day Navigator */}
        <div className="lg:hidden border-t border-rui-grey-10/50">
          <DayNavigator />
        </div>

        {/* Decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rui-accent/20 to-transparent" />
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Map Panel (Desktop) */}
        {isDesktop && showMap && (
          <motion.div
            className="w-[55%] h-full relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 border-r-2 border-rui-accent/10 bg-gradient-to-br from-rui-grey-2/30 to-transparent">
              <PlanningMap />
            </div>
          </motion.div>
        )}

        {/* Day View / Overview Panel */}
        <div
          className={`
            flex-1 h-full overflow-y-auto relative
            ${isDesktop && showMap ? '' : 'max-w-4xl mx-auto'}
          `}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#C45830 transparent'
          }}
        >
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {showOverview ? (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-8"
                >
                  <TripOverviewHeader
                    onCityClick={(cityIndex) => {
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
                    className="rounded-2xl border-2 border-rui-accent/20 overflow-hidden shadow-rui-3"
                  />
                  <AllDaysOverview />
                </motion.div>
              ) : (
                <motion.div
                  key="dayview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-6"
                >
                  <FlowScoreCard />
                  <ConflictWarnings />
                  <DayView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Companion Panel (Desktop) */}
        <AnimatePresence>
          {isDesktop && showCompanion && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="h-full border-l-2 border-rui-accent/10 overflow-hidden bg-gradient-to-bl from-rui-grey-2/30 to-transparent"
            >
              <PlanningCompanion onClose={() => setShowCompanion(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Companion Panel (Mobile) */}
      <AnimatePresence>
        {!isDesktop && showCompanion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rui-black/40 backdrop-blur-sm"
              onClick={() => setShowCompanion(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 h-[85vh] bg-rui-white rounded-t-3xl overflow-hidden shadow-rui-4"
            >
              <PlanningCompanion onClose={() => setShowCompanion(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Panel */}
      <AnimatePresence>
        {addPanelState.isOpen && <AddPanel />}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {lastToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-br from-rui-black to-rui-grey-70 text-white rounded-2xl shadow-rui-4 border border-rui-grey-60/30 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-body-2 font-medium">{lastToast.message}</span>
              {lastToast.action && (
                <button
                  onClick={() => {
                    undo();
                    clearToast();
                  }}
                  className="text-body-2 font-semibold text-rui-accent hover:text-orange-300 transition-colors"
                >
                  Undo
                </button>
              )}
              <button
                onClick={clearToast}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <DayComparisonView
        isOpen={showComparisonView}
        onClose={() => setShowComparisonView(false)}
        initialLeftDay={currentDayIndex}
        initialRightDay={Math.min(currentDayIndex + 1, (tripPlan?.days.length ?? 1) - 1)}
      />

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
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#FAF8F3] via-[#FBF9F6] to-[#F5F0E8]">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="relative w-16 h-16 mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full border-3 border-rui-grey-10" />
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-rui-accent" />
          <Compass className="absolute inset-0 m-auto w-6 h-6 text-rui-accent opacity-60" />
        </motion.div>
        <motion.p
          className="font-display text-2xl text-rui-black mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Preparing your journey
        </motion.p>
        <motion.p
          className="text-body-2 text-rui-grey-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Crafting the perfect itinerary...
        </motion.p>
      </motion.div>
    </div>
  );
}

export default PlanningMode;
