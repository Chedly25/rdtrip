/**
 * Itinerary Generation Panel
 * Modal interface for generating detailed day-by-day itineraries using 9 AI agents
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useItineraryGeneration } from '../../../hooks/useItineraryGeneration';
import { AgentOrchestrationVisualizerV5 } from '../../itinerary/AgentOrchestrationVisualizerV5';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';

interface ItineraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItineraryPanel = ({ isOpen, onClose }: ItineraryPanelProps) => {
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
    if (!route) return;

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

    // Build routeData from spotlight route
    const routeData = {
      id: route.id,
      origin: route.origin,
      destination: route.destination,
      waypoints: route.cities.map(city => {
        const cityInfo = getCityInfo(city.city);
        return {
          city: cityInfo.name,
          name: cityInfo.name,
          country: cityInfo.country,
          coordinates: [city.coordinates.lat, city.coordinates.lng],
          nights: city.nights
        };
      }),
      agent: route.agent,
      nightAllocations: route.nightAllocations || {}
    };

    const preferences = {
      travelStyle: route.agent,
      budget: route.budget,
      agentType: route.agent
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detailed Itinerary Generator</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    AI-powered day-by-day planning with 9 specialized agents
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGenerating}
                title={isGenerating ? "Please wait for generation to complete" : "Close"}
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Initial State - Not Started */}
              {!hasStarted && !itinerary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 px-6"
                >
                  <div className="inline-flex p-4 bg-blue-50 border-2 border-blue-100 rounded-xl mb-6">
                    <Calendar className="w-16 h-16 text-blue-600" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Ready to Generate Your Itinerary?
                  </h3>

                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Our AI will analyze your route and create a comprehensive day-by-day plan.
                    The system uses 9 specialized agents working in parallel to discover the best
                    activities, restaurants, accommodations, scenic stops, weather forecasts, local events,
                    and budget optimization for your trip.
                  </p>

                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                      <div className="text-gray-900 font-semibold mb-1 flex items-center gap-2">
                        <span className="text-blue-600">🎯</span> Smart Planning
                      </div>
                      <div className="text-sm text-gray-600">Optimized day structure based on your preferences</div>
                    </div>
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                      <div className="text-gray-900 font-semibold mb-1 flex items-center gap-2">
                        <span className="text-blue-600">🤖</span> 9 AI Agents
                      </div>
                      <div className="text-sm text-gray-600">Parallel processing for comprehensive results</div>
                    </div>
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                      <div className="text-gray-900 font-semibold mb-1 flex items-center gap-2">
                        <span className="text-blue-600">⚡</span> Fast Generation
                      </div>
                      <div className="text-sm text-gray-600">Typically completes in 30-90 seconds</div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all inline-flex items-center gap-3"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Generation
                    <span className="text-sm font-normal opacity-90">(30-90 seconds)</span>
                  </button>
                </motion.div>
              )}

              {/* Generating State */}
              {isGenerating && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <div>
                          <p className="text-gray-900 font-semibold text-lg">
                            Generating your itinerary...
                          </p>
                          <p className="text-gray-600 text-sm">
                            {completedAgents} of {totalAgents} agents completed • {formatTime(elapsedTime)} elapsed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{progressPercentage}%</div>
                        <div className="text-xs text-gray-600">Complete</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-blue-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-blue-600"
                      />
                    </div>
                  </motion.div>

                  {/* Agent Visualizer */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <AgentOrchestrationVisualizerV5
                      agents={agentNodes}
                      partialResults={partialResults}
                    />
                  </div>

                  {/* Helpful tip */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
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
                  {/* Success Banner */}
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

                  {/* Itinerary Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Your Itinerary Summary
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {itinerary.dayStructure?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Days Planned</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {itinerary.activities?.flat().length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Activities</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {itinerary.restaurants?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Restaurants</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="text-2xl font-bold text-gray-900">
                          {itinerary.accommodations?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Hotels</div>
                      </div>
                    </div>

                    {/* Data Preview - For now showing raw data, can be replaced with proper components later */}
                    <div className="space-y-4">
                      <details className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 font-semibold text-gray-900">
                          View Raw Data (Developer Mode)
                        </summary>
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <pre className="text-xs overflow-auto max-h-96 bg-white p-4 rounded border border-gray-200">
                            {JSON.stringify(itinerary, null, 2)}
                          </pre>
                        </div>
                      </details>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <strong>Next Steps:</strong> The itinerary has been saved to the database with ID: <code className="bg-blue-100 px-2 py-1 rounded">{itinerary.id}</code>.
                        You can now view it in the dedicated itinerary view or export it to various formats.
                      </div>
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
