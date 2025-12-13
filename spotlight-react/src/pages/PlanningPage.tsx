/**
 * PlanningPage
 *
 * Main page for the Planning phase - where users build their trip itinerary
 * using proximity-based clusters and an AI companion.
 *
 * Route: /plan/:routeId
 *
 * Design: Wanderlust Editorial - warm earth tones, refined typography, magazine feel
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Save,
  Share2,
  Check,
  Play,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePlanningStore } from '../stores/planningStore';
import { useCompanionTriggers } from '../hooks/useCompanionTriggers';
import { PlanningLayout } from '../components/planning/PlanningLayout';
import { CityTabs } from '../components/planning/CityTabs';
import { YourPlan } from '../components/planning/plan/YourPlan';
import { DiscoverPanel } from '../components/planning/discover/DiscoverPanel';
import { CompanionPanel } from '../components/planning/companion/CompanionPanel';
import {
  PlanningErrorBoundary,
  PlanningPageSkeleton,
  NotFoundError,
  PlanningOnboarding,
} from '../components/planning/shared';

export default function PlanningPage() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check if user has seen onboarding before
    return !localStorage.getItem('planning_onboarding_seen');
  });

  // Planning store
  const {
    tripPlan,
    currentCityId,
    cityPlans,
    isLoading,
    error,
    isInitialized,
    routeId: storeRouteId,
    setCurrentCity,
    loadPlan,
    savePlan,
    getTotalItemCount,
    reset,
  } = usePlanningStore();

  // Reactive companion triggers - watches for user actions and triggers companion responses
  // This enables automatic companion reactions when users add items, create clusters, etc.
  useCompanionTriggers(currentCityId || '', {
    enabled: isInitialized && !!currentCityId && storeRouteId === routeId,
  });

  // Load planning data on mount - handles both fresh loads and route changes
  useEffect(() => {
    if (!routeId) return;

    // If store has data for a DIFFERENT route, reset first
    if (isInitialized && storeRouteId && storeRouteId !== routeId) {
      console.log('[PlanningPage] Route changed, resetting store');
      reset();
    }

    // Load if not initialized OR if this is a different route
    if (!isInitialized || storeRouteId !== routeId) {
      loadPlan(routeId, token || undefined);
    }
  }, [routeId, token, isInitialized, storeRouteId, loadPlan, reset]);

  // Auto-save debounce (save 2 seconds after last change)
  useEffect(() => {
    // Only auto-save when properly initialized with matching route
    if (!isInitialized || !routeId || storeRouteId !== routeId) return;
    // Skip if there are no city plans (store was just reset)
    if (Object.keys(cityPlans).length === 0) return;

    const timeoutId = setTimeout(() => {
      handleSave(true); // Silent save
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [cityPlans, isInitialized, routeId, storeRouteId]);

  const handleSave = async (silent = false) => {
    if (!routeId) return;

    if (!silent) setSaveStatus('saving');

    try {
      await savePlan(routeId, token || undefined);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('[PlanningPage] Save error:', err);
      if (!silent) setSaveStatus('error');
    }
  };

  const handleBack = () => {
    navigate('/discover');
  };

  const handleStartTrip = () => {
    navigate('/today');
  };

  // Get current city data
  const currentCityPlan = currentCityId ? cityPlans[currentCityId] : null;

  // Build cities for tabs
  const citiesForTabs = tripPlan?.cities.map((cityPlan) => ({
    id: cityPlan.cityId,
    name: cityPlan.city.name,
    nights: cityPlan.city.nights || 1,
    isOrigin: cityPlan.city.isOrigin,
    isDestination: cityPlan.city.isDestination,
    itemCount: getTotalItemCount(cityPlan.cityId),
    isComplete: false,
  })) || [];

  // Error boundary reset handler
  const handleErrorReset = useCallback(() => {
    if (routeId) {
      loadPlan(routeId, token || undefined);
    }
  }, [routeId, token, loadPlan]);

  const handleNavigateHome = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('planning_onboarding_seen', 'true');
    setShowOnboarding(false);
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem('planning_onboarding_seen', 'true');
    setShowOnboarding(false);
  }, []);

  // Loading state - use skeleton
  if (isLoading) {
    return <PlanningPageSkeleton />;
  }

  // Error state - use NotFoundError for 404s, custom UI for other errors
  if (error || !tripPlan) {
    // Check if it's a not found error
    const isNotFound = error?.toLowerCase().includes('not found') ||
                       error?.toLowerCase().includes('404');

    if (isNotFound) {
      return <NotFoundError type="plan" onGoHome={handleNavigateHome} />;
    }

    // Generic error with retry option
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE] flex items-center justify-center"
          >
            <AlertCircle className="w-10 h-10 text-[#C45830]" strokeWidth={1.5} />
          </motion.div>

          <h2 className="font-['Fraunces',serif] text-2xl text-[#2C2417] font-semibold mb-3">
            Couldn't Load Plan
          </h2>
          <p className="text-[#8B7355] font-['Satoshi',sans-serif] leading-relaxed mb-8">
            {error || 'Something went wrong loading your trip plan. Your data is safe.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleErrorReset}
              className="
                flex items-center gap-2 px-6 py-3
                bg-gradient-to-r from-[#C45830] to-[#D4724A]
                text-white font-['Satoshi',sans-serif] font-semibold
                rounded-xl shadow-lg shadow-[#C45830]/20
                hover:shadow-xl hover:shadow-[#C45830]/30
                transition-shadow
              "
            >
              <Loader2 className="w-4 h-4" />
              Try Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNavigateHome}
              className="
                flex items-center gap-2 px-6 py-3
                bg-[#FFFBF5] border border-[#E5DDD0]
                text-[#2C2417] font-['Satoshi',sans-serif] font-medium
                rounded-xl hover:bg-[#F5F0E8]
                transition-colors
              "
            >
              Back to Discovery
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <PlanningErrorBoundary
      onReset={handleErrorReset}
      onNavigateHome={handleNavigateHome}
    >
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
        {/* Header */}
        <header className="
          sticky top-0 z-50
          bg-[#FFFBF5]/95 backdrop-blur-sm
          border-b border-[#E5DDD0]
          shadow-sm
        ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="
                flex items-center gap-2
                text-[#8B7355] hover:text-[#2C2417]
                transition-colors group
              "
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline font-['Satoshi',sans-serif] text-sm">
                Back to Discovery
              </span>
            </button>

            {/* Title */}
            <div className="text-center">
              <h1 className="font-['Fraunces',serif] text-base sm:text-lg text-[#2C2417] font-semibold">
                Plan Your Trip
              </h1>
              <p className="text-xs text-[#8B7355] font-['Satoshi',sans-serif] hidden sm:block">
                Build your itinerary by area
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Save status indicator */}
              <AnimatePresence mode="wait">
                {saveStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 text-xs font-['Satoshi',sans-serif]"
                  >
                    {saveStatus === 'saving' && (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-[#8B7355]" />
                        <span className="text-[#8B7355] hidden sm:inline">Saving...</span>
                      </>
                    )}
                    {saveStatus === 'saved' && (
                      <>
                        <Check className="h-3 w-3 text-[#4A7C59]" />
                        <span className="text-[#4A7C59] hidden sm:inline">Saved</span>
                      </>
                    )}
                    {saveStatus === 'error' && (
                      <>
                        <AlertCircle className="h-3 w-3 text-[#C45830]" />
                        <span className="text-[#C45830] hidden sm:inline">Error saving</span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save button */}
              <button
                onClick={() => handleSave(false)}
                disabled={saveStatus === 'saving'}
                className="
                  flex items-center gap-2 px-3 py-2
                  text-[#8B7355] hover:text-[#2C2417] hover:bg-[#F5F0E8]
                  rounded-lg transition-colors
                  font-['Satoshi',sans-serif] text-sm
                  disabled:opacity-50
                "
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </button>

              {/* Share button */}
              <button
                className="
                  flex items-center gap-2 px-3 py-2
                  text-[#8B7355] hover:text-[#2C2417] hover:bg-[#F5F0E8]
                  rounded-lg transition-colors
                  font-['Satoshi',sans-serif] text-sm
                "
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* Start Trip button (desktop) */}
              <button
                onClick={handleStartTrip}
                className="
                  hidden sm:flex items-center gap-2 px-4 py-2
                  bg-gradient-to-r from-[#C45830] to-[#D4724A]
                  text-white rounded-xl
                  font-['Satoshi',sans-serif] font-semibold text-sm
                  shadow-md shadow-[#C45830]/20
                  hover:shadow-lg hover:shadow-[#C45830]/30
                  transition-all
                "
              >
                <Play className="h-4 w-4" />
                Start Trip
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* City Tabs */}
      <CityTabs
        cities={citiesForTabs}
        currentCityId={currentCityId || ''}
        onCityChange={setCurrentCity}
      />

      {/* Main Content */}
      <PlanningLayout
        leftPanel={
          currentCityPlan && (
            <YourPlan
              cityId={currentCityPlan.cityId}
              clusters={currentCityPlan.clusters}
              unclustered={currentCityPlan.unclustered}
              suggestedClusters={currentCityPlan.suggestedClusters}
            />
          )
        }
        rightPanel={
          currentCityPlan && (
            <DiscoverPanel
              cityId={currentCityPlan.cityId}
              cityName={currentCityPlan.city.name}
              clusters={currentCityPlan.clusters}
            />
          )
        }
        companionPanel={
          currentCityPlan && (
            <CompanionPanel
              cityId={currentCityPlan.cityId}
              cityName={currentCityPlan.city.name}
              cityCenter={currentCityPlan.city.coordinates}
              currentPlan={currentCityPlan}
            />
          )
        }
      />

      {/* Mobile Start Trip button */}
      <div className="
        sm:hidden fixed bottom-0 left-0 right-0
        p-4 bg-[#FFFBF5]/95 backdrop-blur-sm
        border-t border-[#E5DDD0]
        safe-area-bottom
      ">
          <button
            onClick={handleStartTrip}
            className="
              w-full py-4
              bg-gradient-to-r from-[#C45830] to-[#D4724A]
              text-white rounded-xl
              font-['Satoshi',sans-serif] font-semibold
              shadow-lg shadow-[#C45830]/20
              flex items-center justify-center gap-2
            "
          >
            <Play className="h-5 w-5" />
            Start Trip
          </button>
        </div>

        {/* Onboarding overlay for first-time users */}
        <AnimatePresence>
          {showOnboarding && isInitialized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#2C2417]/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-full max-w-lg"
              >
                <PlanningOnboarding
                  cityName={currentCityPlan?.city.name || 'your destination'}
                  onGetStarted={handleOnboardingComplete}
                  onSkip={handleOnboardingSkip}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PlanningErrorBoundary>
  );
}
