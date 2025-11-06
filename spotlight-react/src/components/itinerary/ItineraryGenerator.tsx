import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ItineraryTimeline } from './ItineraryTimeline';
import { AgentOrchestrationVisualizerV5 as AgentOrchestrationVisualizer } from './AgentOrchestrationVisualizerV5';
import { useItineraryGeneration } from '../../hooks/useItineraryGeneration';
import { getTheme } from '../../config/theme';

interface ItineraryGeneratorProps {
  routeData: any;
  agentType: string;
  preferences: any;
  onBack?: () => void;
}

export function ItineraryGenerator({
  routeData,
  agentType,
  preferences,
  onBack
}: ItineraryGeneratorProps) {
  const { agentNodes, partialResults, itinerary, error, isGenerating, generate, loadFromId } = useItineraryGeneration();
  const theme = getTheme(agentType as any);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Check if there's an itinerary ID in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const itineraryId = urlParams.get('itinerary');

    if (itineraryId && !hasStarted) {
      // Load existing itinerary from ID
      console.log(`📌 Loading itinerary from URL: ${itineraryId}`);
      setHasStarted(true);
      loadFromId(itineraryId);
    } else if (!hasStarted && routeData && !itineraryId) {
      // Generate new itinerary
      setHasStarted(true);
      generate(routeData, { ...preferences, agentType });
    }
  }, [routeData, preferences, agentType, hasStarted, generate, loadFromId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to route
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Error State */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center"
          >
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Generation Failed</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => {
                setHasStarted(false);
                setTimeout(() => setHasStarted(true), 100);
              }}
              className="mt-6 rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Generating State - Full Screen */}
        {isGenerating && !error && (
          <AgentOrchestrationVisualizer agents={agentNodes} partialResults={partialResults} />
        )}

        {/* Success State - Show Itinerary */}
        {!isGenerating && itinerary && !error && (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ItineraryTimeline itinerary={itinerary} agentType={agentType} />
          </motion.div>
        )}

        {/* Initial Loading State (before agents start) */}
        {!itinerary && !isGenerating && !error && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-[400px] items-center justify-center"
          >
            <div className="text-center">
              <div
                className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200"
                style={{ borderTopColor: theme.primary }}
              />
              <p className="text-gray-600">Initializing generation...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
