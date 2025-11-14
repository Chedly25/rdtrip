/**
 * ArtifactsPanel - Right panel showing interactive artifacts
 *
 * Renders rich visual components based on artifact type:
 * - activity_grid: Grid of activity cards
 * - hotel_list: List of hotel cards
 * - weather_display: Weather card
 * - directions_map: Directions card
 * - city_info: City information card
 *
 * Shows empty state when no artifact is active
 */

import { motion } from 'framer-motion';
import { Sparkles, MapPin } from 'lucide-react';
import { useAgent } from '../../contexts/AgentProvider';
import { ArtifactRenderer } from './ArtifactRenderer';

export function ArtifactsPanel() {
  const { currentArtifact, artifactHistory, setCurrentArtifact } = useAgent();

  // Empty state when no artifact
  if (!currentArtifact) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Interactive Results
          </h3>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No Results Yet
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ask me to find activities, check weather, search hotels, or get directions to see interactive results here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render artifact using ArtifactRenderer
  const renderArtifact = () => {
    return <ArtifactRenderer artifact={currentArtifact} />;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with artifact info */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="truncate">{currentArtifact.title}</span>
            </h3>
            {currentArtifact.subtitle && (
              <p className="text-xs text-gray-600 mt-0.5 truncate">
                {currentArtifact.subtitle}
              </p>
            )}
          </div>

          {/* Artifact history indicator (if more than one) */}
          {artifactHistory.length > 1 && (
            <div className="flex-shrink-0">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {artifactHistory.findIndex(a => a.id === currentArtifact.id) + 1} / {artifactHistory.length}
              </span>
            </div>
          )}
        </div>

        {/* Artifact history navigation (if more than one) */}
        {artifactHistory.length > 1 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            {artifactHistory.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => setCurrentArtifact(artifact)}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${artifact.id === currentArtifact.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300'
                  }
                `}
              >
                {artifact.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Artifact content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          key={currentArtifact.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderArtifact()}
        </motion.div>
      </div>
    </div>
  );
}
