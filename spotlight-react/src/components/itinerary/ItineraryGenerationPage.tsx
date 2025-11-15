/**
 * Full-screen Itinerary Generation Experience
 * Modern, immersive design for AI-powered trip planning
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Calendar, MapPin, Landmark, Star, Car } from 'lucide-react';
import { useItineraryGeneration } from '../../hooks/useItineraryGeneration';
import { AgentOrchestrationVisualizerV5 } from './AgentOrchestrationVisualizerV5';
import { useSpotlightStoreV2 } from '../../stores/spotlightStoreV2';

export function ItineraryGenerationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');
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

  // Auto-navigate to full itinerary view when generation completes
  useEffect(() => {
    if (itinerary && !isGenerating && !error && itinerary.id) {
      console.log('✅ Generation complete! Auto-navigating to itinerary view:', itinerary.id);
      // Small delay to show success state briefly
      const timer = setTimeout(() => {
        navigate(`/?itinerary=${itinerary.id}`);
      }, 2000); // 2 second delay to show celebration
      return () => clearTimeout(timer);
    }
  }, [itinerary, isGenerating, error, navigate]);

  // Calculate progress
  const totalAgents = agentNodes.length;
  const completedAgents = agentNodes.filter(a => a.status === 'completed').length;
  const progressPercentage = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      agentType: route.agent
    };

    console.log('🚀 Starting itinerary generation with:', { routeData, preferences });

    await generate(routeData, preferences);
  };

  const handleBack = () => {
    if (routeId) {
      navigate(`/?routeId=${routeId}`);
    } else {
      navigate(-1);
    }
  };

  const handleViewItinerary = () => {
    if (itinerary?.id) {
      navigate(`/?itinerary=${itinerary.id}`);
    }
  };

  // Show error if route is not available
  if (!route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center p-8"
        >
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Route Data Missing</h3>
            <p className="text-gray-600 mb-6">
              Unable to load route data. Please return to the spotlight page and try again.
            </p>
            <button
              onClick={handleBack}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isGenerating}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Itinerary Generator</h1>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Initial State - Not Started */}
          {!hasStarted && !itinerary && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="max-w-4xl mx-auto"
            >
              {/* Hero Section */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-8 shadow-2xl"
                >
                  <Sparkles className="w-20 h-20 text-white" />
                </motion.div>

                <h2 className="text-5xl font-bold text-gray-900 mb-6">
                  Let's Plan Your Perfect Trip
                </h2>

                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  Our AI orchestrates 9 specialized agents working in parallel to craft
                  a comprehensive day-by-day plan tailored to your journey.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    icon: '🎯',
                    title: 'Smart Planning',
                    description: 'Optimized day structure based on your travel style and preferences',
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    icon: '🤖',
                    title: '9 AI Agents',
                    description: 'Parallel processing discovers activities, restaurants, hotels & more',
                    color: 'from-purple-500 to-purple-600'
                  },
                  {
                    icon: '⚡',
                    title: 'Fast Generation',
                    description: 'Complete itinerary ready in 30-90 seconds with real-time progress',
                    color: 'from-orange-500 to-orange-600'
                  }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
                  >
                    <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="text-4xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <button
                  onClick={handleGenerate}
                  className="px-12 py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-blue-500/50 transition-all inline-flex items-center gap-4 group"
                >
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  Start Generation
                  <span className="text-sm font-normal opacity-90">(30-90 sec)</span>
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Generating State */}
          {isGenerating && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              {/* Progress Header */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="p-3 bg-blue-100 rounded-2xl"
                    >
                      <Sparkles className="w-8 h-8 text-blue-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Crafting Your Itinerary
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {completedAgents} of {totalAgents} agents completed • {formatTime(elapsedTime)} elapsed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-blue-600">{progressPercentage}%</div>
                    <div className="text-sm text-gray-600">Complete</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>
              </div>

              {/* Agent Visualizer */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                <AgentOrchestrationVisualizerV5 agents={agentNodes} partialResults={partialResults} />
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {itinerary && !isGenerating && !error && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-6xl mx-auto"
            >
              {/* Success Banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-16 h-16" />
                  <div>
                    <h3 className="text-3xl font-bold mb-2">Itinerary Ready!</h3>
                    <p className="text-green-50 text-lg">
                      Completed in {formatTime(elapsedTime)} • All 9 agents finished successfully
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    label: 'Days',
                    value: Array.isArray(itinerary.dayStructure) ? itinerary.dayStructure.length : (itinerary.dayStructure && typeof itinerary.dayStructure === 'object' && 'days' in itinerary.dayStructure && Array.isArray((itinerary.dayStructure as any).days) ? (itinerary.dayStructure as any).days.length : 0),
                    icon: Calendar,
                    color: 'blue'
                  },
                  {
                    label: 'Activities',
                    value: Array.isArray(itinerary.activities) ? itinerary.activities.reduce((sum, dayObj) => sum + (Array.isArray(dayObj?.activities) ? dayObj.activities.length : 0), 0) : 0,
                    icon: Landmark,
                    color: 'purple'
                  },
                  {
                    label: 'Restaurants',
                    value: Array.isArray(itinerary.restaurants) ? itinerary.restaurants.reduce((sum, dayObj) => {
                      const meals = dayObj?.meals;
                      let count = 0;
                      if (meals?.breakfast) count++;
                      if (meals?.lunch) count++;
                      if (meals?.dinner) count++;
                      return sum + count;
                    }, 0) : 0,
                    icon: '🍽️',
                    color: 'orange'
                  },
                  { label: 'Hotels', value: (Array.isArray(itinerary.accommodations) ? itinerary.accommodations.length : 0), icon: '🏨', color: 'pink' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all"
                  >
                    {typeof stat.icon === 'string' ? (
                      <div className="text-4xl mb-2">{stat.icon}</div>
                    ) : (
                      <stat.icon className={`w-10 h-10 mx-auto mb-2 text-${stat.color}-600`} />
                    )}
                    <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Preview Section */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200">
                {/* Days Preview */}
                {(() => {
                  const daysArray = Array.isArray(itinerary.dayStructure) ? itinerary.dayStructure : (itinerary.dayStructure && typeof itinerary.dayStructure === 'object' && 'days' in itinerary.dayStructure && Array.isArray((itinerary.dayStructure as any).days) ? (itinerary.dayStructure as any).days : []);
                  return daysArray.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        Your Journey
                      </h4>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                        {daysArray.map((day: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl p-6 hover:shadow-lg transition-all border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1 bg-blue-600 text-white rounded-full font-bold text-sm">
                                  Day {day.day || index + 1}
                                </div>
                                {day.overnight && (
                                  <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                    Overnight
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg mb-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                {day.location || day.city || 'Unknown City'}
                              </div>
                              {day.description && (
                                <p className="text-gray-600 line-clamp-2">{day.description}</p>
                              )}
                              {day.driveSegments && day.driveSegments.length > 0 && (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm text-gray-600 border border-gray-200">
                                  <Car className="w-4 h-4" />
                                  {day.driveSegments[0].distance} km • {day.driveSegments[0].estimatedTime}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Activities Preview */}
                {itinerary.activities && Array.isArray(itinerary.activities) && itinerary.activities.length > 0 && (
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Landmark className="w-6 h-6 text-purple-600" />
                      Highlights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(Array.isArray(itinerary.activities) ? itinerary.activities.flatMap(dayObj => Array.isArray(dayObj?.activities) ? dayObj.activities : []) : []).slice(0, 6).map((activity: any, idx: number) => {
                        const photo = activity.photos?.[0];
                        const photoUrl = typeof photo === 'string' ? photo : photo?.url || photo?.thumbnail;

                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-gray-200 group"
                          >
                            {photoUrl && (
                              <div className="h-48 overflow-hidden bg-gray-100">
                                <img
                                  src={photoUrl}
                                  alt={activity.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <h5 className="font-bold text-gray-900 mb-2 line-clamp-2">{activity.name || activity.title}</h5>
                              <div className="flex items-center gap-3">
                                {activity.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-gray-900">{activity.rating}</span>
                                  </div>
                                )}
                                {activity.city && (
                                  <span className="text-sm text-gray-500">{activity.city}</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  onClick={handleViewItinerary}
                  className="px-12 py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-blue-500/50 transition-all inline-flex items-center gap-4"
                >
                  View Full Itinerary
                </button>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Generation Failed</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleGenerate}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
