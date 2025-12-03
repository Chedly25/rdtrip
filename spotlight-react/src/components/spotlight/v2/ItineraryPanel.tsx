/**
 * Itinerary Generation Panel
 * Modal interface for generating detailed day-by-day itineraries using 9 AI agents
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, Sparkles, CheckCircle2, AlertCircle, MapPin, Landmark, Star, Car, Gem } from 'lucide-react';
import { useItineraryGeneration } from '../../../hooks/useItineraryGeneration';
import { AgentOrchestrationVisualizerV5 } from '../../itinerary/AgentOrchestrationVisualizerV5';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { PersonalizationSummary } from './PersonalizationSummary';

interface ItineraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItineraryPanel = ({ isOpen, onClose }: ItineraryPanelProps) => {
  const navigate = useNavigate();
  const { route } = useSpotlightStoreV2();
  const {
    agentNodes,
    partialResults,
    itinerary,
    error,
    isGenerating,
    generate
  } = useItineraryGeneration();

  const [hasStarted, setHasStarted] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time display
  useEffect(() => {
    if (isGenerating && generationStartTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - generationStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, generationStartTime]);

  const handleGenerate = async () => {
    if (!route) {
      console.error('❌ No route data available');
      return;
    }

    // Validate route.cities exists and is an array
    if (!route.cities || !Array.isArray(route.cities)) {
      console.error('❌ Route cities is not an array:', route.cities);
      return;
    }

    setHasStarted(true);
    setGenerationStartTime(Date.now());
    setElapsedTime(0);

    // Helper to safely extract city name and country
    const getCityInfo = (cityData: string | { name: string; country?: string }) => {
      if (typeof cityData === 'string') {
        return { name: cityData, country: '' };
      }
      return { name: cityData.name, country: cityData.country || '' };
    };

    // Build routeData from spotlight route with safe array access
    const routeData = {
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      waypoints: (route.cities || []).map(city => {
        const cityInfo = getCityInfo(city.city);
        return {
          city: cityInfo.name,
          name: cityInfo.name,
          country: cityInfo.country,
          coordinates: city.coordinates ? [city.coordinates.lat, city.coordinates.lng] : [0, 0],
          nights: city.nights || 0
        };
      }),
      agent: route.agent,
      nightAllocations: route.nightAllocations || {}
    };

    const preferences = {
      travelStyle: route.agent,
      budget: route.budget,
      agentType: route.agent,
      // Pass personalization data to backend for AI-powered customization
      personalization: route.personalization || null
    };

    console.log('🚀 Starting itinerary generation with:', { routeData, preferences });

    await generate(routeData, preferences);
  };

  const handleClose = () => {
    // Allow closing only when not generating or when completed/errored
    if (!isGenerating) {
      onClose();
      // Reset state after close animation
      setTimeout(() => {
        setHasStarted(false);
        setGenerationStartTime(null);
        setElapsedTime(0);
      }, 300);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedAgents = agentNodes.filter(node => node.status === 'completed').length;
  const totalAgents = agentNodes.length;
  const progressPercentage = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Editorial style when personalized */}
            <div
              className="border-b p-6 flex justify-between items-center flex-shrink-0"
              style={{
                background: route?.personalization
                  ? 'linear-gradient(145deg, #FFFDF9 0%, #FFF8ED 100%)'
                  : 'white',
                borderColor: route?.personalization
                  ? 'rgba(196, 88, 48, 0.1)'
                  : '#e5e7eb',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: route?.personalization
                      ? 'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)'
                      : 'rgb(239 246 255)',
                  }}
                >
                  {route?.personalization ? (
                    <Gem className="w-6 h-6" style={{ color: '#C45830' }} />
                  ) : (
                    <Calendar className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h2
                    className="text-2xl font-bold"
                    style={{
                      color: route?.personalization ? '#2C2417' : '#111827',
                      fontFamily: route?.personalization ? "'Fraunces', Georgia, serif" : 'inherit',
                    }}
                  >
                    {route?.personalization ? 'Create Your Perfect Itinerary' : 'Detailed Itinerary Generator'}
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: route?.personalization ? '#8B7355' : '#6b7280' }}
                  >
                    {route?.personalization
                      ? 'AI-powered planning tailored to your preferences'
                      : 'AI-powered day-by-day planning with 9 specialized agents'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = route?.personalization
                    ? 'rgba(196, 88, 48, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                disabled={isGenerating}
                title={isGenerating ? "Please wait for generation to complete" : "Close"}
              >
                <X className="w-6 h-6" style={{ color: route?.personalization ? '#8B7355' : '#374151' }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Initial State - Not Started */}
              {!hasStarted && !itinerary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-8 px-6"
                >
                  {/* Personalized Header - if personalization exists */}
                  {route?.personalization?.tripStory || route?.personalization?.occasion || route?.personalization?.interests?.length ? (
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-3 rounded-2xl mb-4"
                        style={{
                          background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.1) 100%)',
                        }}
                      >
                        <Gem className="w-10 h-10" style={{ color: '#C45830' }} />
                      </motion.div>
                      <h3
                        className="text-2xl font-bold mb-2"
                        style={{
                          color: '#2C2417',
                          fontFamily: "'Fraunces', Georgia, serif",
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {route.personalization?.occasion === 'honeymoon'
                          ? 'Ready to Plan Your Honeymoon?'
                          : route.personalization?.occasion === 'anniversary'
                          ? 'Ready to Plan Your Anniversary Escape?'
                          : route.personalization?.occasion === 'birthday'
                          ? 'Ready to Plan Your Birthday Adventure?'
                          : 'Ready to Create Your Personalized Itinerary?'}
                      </h3>
                      <p className="text-gray-600 max-w-lg mx-auto">
                        Our AI will craft a day-by-day journey tailored to your preferences
                      </p>
                    </div>
                  ) : (
                    <div className="text-center mb-6">
                      <div className="inline-flex p-4 bg-blue-50 border-2 border-blue-100 rounded-xl mb-4">
                        <Calendar className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Ready to Generate Your Itinerary?
                      </h3>
                      <p className="text-gray-600 max-w-lg mx-auto">
                        Our AI will create a comprehensive day-by-day plan with activities, restaurants, and accommodations
                      </p>
                    </div>
                  )}

                  {/* Personalization Summary Card - if personalization exists */}
                  {route?.personalization && (
                    <div className="mb-6 max-w-xl mx-auto">
                      <PersonalizationSummary
                        personalization={route.personalization}
                        variant="full"
                      />
                    </div>
                  )}

                  {/* Feature highlights - refined styling */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-xl p-4 transition-all hover:shadow-md"
                      style={{
                        background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF8ED 100%)',
                        border: '1px solid rgba(196, 88, 48, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                          style={{ background: 'rgba(196, 88, 48, 0.1)', color: '#C45830' }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-semibold text-sm" style={{ color: '#2C2417' }}>Smart Planning</span>
                      </div>
                      <div className="text-xs" style={{ color: '#8B7355' }}>
                        Optimized day structure based on your preferences
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-xl p-4 transition-all hover:shadow-md"
                      style={{
                        background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF8ED 100%)',
                        border: '1px solid rgba(196, 88, 48, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                          style={{ background: 'rgba(212, 168, 83, 0.15)', color: '#8B6914' }}
                        >
                          9
                        </span>
                        <span className="font-semibold text-sm" style={{ color: '#2C2417' }}>AI Agents</span>
                      </div>
                      <div className="text-xs" style={{ color: '#8B7355' }}>
                        Parallel processing for comprehensive results
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-xl p-4 transition-all hover:shadow-md"
                      style={{
                        background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF8ED 100%)',
                        border: '1px solid rgba(196, 88, 48, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                          style={{ background: 'rgba(74, 124, 89, 0.1)', color: '#4A7C59' }}
                        >
                          <Car className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-semibold text-sm" style={{ color: '#2C2417' }}>Fast Generation</span>
                      </div>
                      <div className="text-xs" style={{ color: '#8B7355' }}>
                        Typically completes in 30-90 seconds
                      </div>
                    </motion.div>
                  </div>

                  {/* CTA Button - styled to match editorial theme when personalized */}
                  <div className="text-center">
                    {route?.personalization ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerate}
                        className="px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center gap-3 transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                          color: '#FFFDF9',
                          boxShadow: '0 4px 14px rgba(196, 88, 48, 0.3)',
                        }}
                      >
                        <Sparkles className="w-5 h-5" />
                        Create My Personalized Itinerary
                      </motion.button>
                    ) : (
                      <button
                        onClick={handleGenerate}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all inline-flex items-center gap-3"
                      >
                        <Sparkles className="w-5 h-5" />
                        Start Generation
                        <span className="text-sm font-normal opacity-90">(30-90 seconds)</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Generating State */}
              {isGenerating && (
                <div className="space-y-6">
                  {/* Status Banner - Editorial style when personalized */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-6"
                    style={{
                      background: route?.personalization
                        ? 'linear-gradient(145deg, #FFFDF9 0%, #FFF8ED 100%)'
                        : 'rgb(239 246 255)',
                      border: route?.personalization
                        ? '1px solid rgba(196, 88, 48, 0.15)'
                        : '2px solid rgb(191 219 254)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          {route?.personalization ? (
                            <Sparkles className="w-6 h-6" style={{ color: '#C45830' }} />
                          ) : (
                            <Loader2 className="w-6 h-6 text-blue-600" />
                          )}
                        </motion.div>
                        <div>
                          <p
                            className="font-semibold text-lg"
                            style={{
                              color: route?.personalization ? '#2C2417' : '#111827',
                              fontFamily: route?.personalization ? "'Fraunces', Georgia, serif" : 'inherit',
                            }}
                          >
                            {route?.personalization
                              ? 'Crafting your personalized journey...'
                              : 'Generating your itinerary...'}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: route?.personalization ? '#8B7355' : '#6b7280' }}
                          >
                            {completedAgents} of {totalAgents} agents completed • {formatTime(elapsedTime)} elapsed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-3xl font-bold"
                          style={{ color: route?.personalization ? '#C45830' : '#2563eb' }}
                        >
                          {progressPercentage}%
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: route?.personalization ? '#8B7355' : '#6b7280' }}
                        >
                          Complete
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{
                        background: route?.personalization ? 'rgba(44, 36, 23, 0.08)' : 'white',
                        border: route?.personalization ? 'none' : '1px solid rgb(219 234 254)',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: route?.personalization
                            ? 'linear-gradient(90deg, #C45830 0%, #D4A853 100%)'
                            : '#2563eb',
                        }}
                      />
                    </div>

                    {/* Personalization reminder during generation */}
                    {route?.personalization?.tripStory && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4 pt-4 border-t"
                        style={{ borderColor: 'rgba(139, 115, 85, 0.15)' }}
                      >
                        <p
                          className="text-xs uppercase tracking-wider mb-1"
                          style={{ color: '#8B7355' }}
                        >
                          Tailoring to your preferences
                        </p>
                        <p
                          className="text-sm italic"
                          style={{ color: '#5C4D3D' }}
                        >
                          "{route.personalization.tripStory.slice(0, 80)}..."
                        </p>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Agent Visualizer */}
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: route?.personalization
                        ? '1px solid rgba(196, 88, 48, 0.1)'
                        : '2px solid #e5e7eb',
                    }}
                  >
                    <AgentOrchestrationVisualizerV5
                      agents={agentNodes}
                      partialResults={partialResults}
                    />
                  </div>

                  {/* Helpful tip - Editorial style when personalized */}
                  <div
                    className="rounded-lg p-4 text-sm"
                    style={{
                      background: route?.personalization
                        ? 'linear-gradient(145deg, rgba(212, 168, 83, 0.08) 0%, rgba(212, 168, 83, 0.04) 100%)'
                        : 'rgb(254 252 232)',
                      border: route?.personalization
                        ? '1px solid rgba(212, 168, 83, 0.2)'
                        : '1px solid rgb(253 230 138)',
                      color: route?.personalization ? '#8B6914' : '#92400e',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Pro Tip:</strong> The agents work in phases. Day planning happens first,
                        then activities/restaurants/hotels discover content in parallel, followed by
                        weather/events/info, and finally budget optimization.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="font-semibold text-red-900 text-lg mb-2">Generation Failed</p>
                  <p className="text-red-700 mb-6">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}

              {/* Success State */}
              {itinerary && !isGenerating && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Success Banner - Personalized or default */}
                  {itinerary.personalizedIntro ? (
                    <div
                      className="rounded-xl p-6 relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF8ED 100%)',
                        border: '1px solid rgba(196, 88, 48, 0.15)',
                      }}
                    >
                      {/* Decorative accent */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{
                          background: 'linear-gradient(90deg, #C45830 0%, #D4A853 50%, #4A7C59 100%)',
                        }}
                      />
                      <div className="flex items-start gap-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.2 }}
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, rgba(74, 124, 89, 0.15) 0%, rgba(212, 168, 83, 0.15) 100%)',
                          }}
                        >
                          <CheckCircle2 className="w-6 h-6" style={{ color: '#4A7C59' }} />
                        </motion.div>
                        <div className="flex-1">
                          <h3
                            className="text-xl font-bold mb-1"
                            style={{
                              color: '#2C2417',
                              fontFamily: "'Fraunces', Georgia, serif",
                            }}
                          >
                            {itinerary.personalizedIntro.headline || 'Your Personalized Itinerary is Ready!'}
                          </h3>
                          <p className="text-sm mb-3" style={{ color: '#8B7355' }}>
                            Completed in {formatTime(elapsedTime)} • Tailored to your preferences
                          </p>
                          {itinerary.personalizedIntro.summary && (
                            <p className="text-sm italic" style={{ color: '#5C4D3D' }}>
                              "{itinerary.personalizedIntro.summary}"
                            </p>
                          )}
                          {itinerary.personalizedIntro.highlightedFactors && itinerary.personalizedIntro.highlightedFactors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {itinerary.personalizedIntro.highlightedFactors.slice(0, 4).map((factor: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    background: 'rgba(212, 168, 83, 0.12)',
                                    color: '#8B6914',
                                  }}
                                >
                                  <Sparkles className="w-3 h-3" style={{ color: '#D4A853' }} />
                                  {factor}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-gray-900 font-bold text-xl">
                            Itinerary Generated Successfully!
                          </p>
                          <p className="text-gray-600 text-sm">
                            Completed in {formatTime(elapsedTime)} • All 9 agents finished
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Itinerary Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Your Itinerary Summary
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {Array.isArray(itinerary.dayStructure) ? itinerary.dayStructure.length : (itinerary.dayStructure && typeof itinerary.dayStructure === 'object' && 'days' in itinerary.dayStructure && Array.isArray((itinerary.dayStructure as any).days) ? (itinerary.dayStructure as any).days.length : 0)}
                        </div>
                        <div className="text-sm text-gray-600">Days Planned</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {Array.isArray(itinerary.activities) ? itinerary.activities.reduce((sum, dayObj) => sum + (Array.isArray(dayObj?.activities) ? dayObj.activities.length : 0), 0) : 0}
                        </div>
                        <div className="text-sm text-gray-600">Activities</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {Array.isArray(itinerary.restaurants) ? itinerary.restaurants.reduce((sum, dayObj) => {
                            const meals = dayObj?.meals;
                            let count = 0;
                            if (meals?.breakfast) count++;
                            if (meals?.lunch) count++;
                            if (meals?.dinner) count++;
                            return sum + count;
                          }, 0) : 0}
                        </div>
                        <div className="text-sm text-gray-600">Restaurants</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {Array.isArray(itinerary.accommodations) ? itinerary.accommodations.length : 0}
                        </div>
                        <div className="text-sm text-gray-600">Hotels</div>
                      </div>
                    </div>

                    {/* Itinerary Content Preview */}
                    <div className="space-y-6">
                      {/* Day Structure */}
                      {(() => {
                        const daysArray = Array.isArray(itinerary.dayStructure) ? itinerary.dayStructure : (itinerary.dayStructure && typeof itinerary.dayStructure === 'object' && 'days' in itinerary.dayStructure && Array.isArray((itinerary.dayStructure as any).days) ? (itinerary.dayStructure as any).days : []);
                        return daysArray.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              Day-by-Day Breakdown
                            </h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                              {daysArray.map((day: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="font-bold text-gray-900 text-lg">
                                      Day {day.day || index + 1}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                      <MapPin className="w-4 h-4" />
                                      {day.location || day.city || 'Unknown City'}
                                    </div>
                                  </div>
                                  {day.overnight && (
                                    <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                                      Overnight
                                    </div>
                                  )}
                                </div>
                                {day.description && (
                                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{day.description}</p>
                                )}
                                {day.driveSegments && day.driveSegments.length > 0 && (
                                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Car className="w-4 h-4" />
                                    {day.driveSegments[0].distance} km • {day.driveSegments[0].estimatedTime}
                                  </div>
                                )}
                              </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Activities Preview */}
                      {itinerary.activities && Array.isArray(itinerary.activities) && itinerary.activities.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-blue-600" />
                            Top Activities
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(Array.isArray(itinerary.activities) ? itinerary.activities.flatMap(dayObj => Array.isArray(dayObj?.activities) ? dayObj.activities : []) : []).slice(0, 4).map((activity: any, idx: number) => {
                              const photo = activity.photos?.[0];
                              const photoUrl = typeof photo === 'string' ? photo : photo?.url || photo?.thumbnail;

                              return (
                                <div
                                  key={idx}
                                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                  {photoUrl && (
                                    <div className="h-32 overflow-hidden bg-gray-100">
                                      <img
                                        src={photoUrl}
                                        alt={activity.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="p-3">
                                    <div className="font-semibold text-gray-900 mb-1 line-clamp-1">
                                      {activity.name || activity.title}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      {activity.rating && (
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                          <span className="font-medium">{activity.rating}</span>
                                        </div>
                                      )}
                                      {activity.city && (
                                        <span className="text-gray-500">{activity.city}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {(() => {
                            const totalActivities = Array.isArray(itinerary.activities) ? itinerary.activities.reduce((sum, dayObj) => sum + (Array.isArray(dayObj?.activities) ? dayObj.activities.length : 0), 0) : 0;
                            return totalActivities > 4 && (
                              <p className="text-sm text-gray-600 text-center">
                                +{totalActivities - 4} more activities
                              </p>
                            );
                          })()}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            // Copy itinerary ID to clipboard
                            navigator.clipboard.writeText(itinerary.id);
                            alert('Itinerary ID copied to clipboard!');
                          }}
                          className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                          📋 Copy Itinerary ID
                        </button>
                        <button
                          onClick={() => {
                            // Navigate to view full itinerary
                            navigate(`/?itinerary=${itinerary.id}`);
                          }}
                          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          👁️ View Full Itinerary
                        </button>
                      </div>

                      {/* Developer info */}
                      <details className="bg-gray-100 rounded-lg overflow-hidden">
                        <summary className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-sm font-medium text-gray-700">
                          🔧 Developer Info
                        </summary>
                        <div className="p-3 bg-white border-t border-gray-200 text-xs space-y-2">
                          <div>
                            <strong>Itinerary ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{itinerary.id}</code>
                          </div>
                          <div>
                            <strong>Database:</strong> Saved to <code>itineraries</code> table
                          </div>
                          <div>
                            <strong>API Endpoint:</strong> <code className="bg-gray-100 px-1 rounded">/api/itinerary/{itinerary.id}</code>
                          </div>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-700">View Raw JSON</summary>
                            <pre className="mt-2 text-xs overflow-auto max-h-64 bg-gray-50 p-2 rounded border border-gray-200">
                              {JSON.stringify(itinerary, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </details>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
