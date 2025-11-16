/**
 * AgentSuggestionsPanel - Bottom Sliding Panel with Agent City Suggestions
 * Phase 2: Glassmorphic panel with city carousel and agent filters
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAgentSuggestionsStore, type AgentType } from '../../../stores/agentSuggestionsStore';
import { GlassPanel, Button } from '../../design-system';
import { CityCard } from './CityCard';
import { AGENT_COLORS } from '../../../stores/spotlightStoreV2';

interface AgentSuggestionsPanelProps {
  onAddCity: (city: any, day: number, cardElement: HTMLElement) => void;
}

const AGENT_FILTERS: Array<{ id: AgentType | 'all'; label: string; emoji: string }> = [
  { id: 'all', label: 'All', emoji: '🌍' },
  { id: 'best-overall', label: 'Best', emoji: '🎯' },
  { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { id: 'culture', label: 'Culture', emoji: '🎭' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'hidden-gems', label: 'Hidden Gems', emoji: '💎' },
];

export function AgentSuggestionsPanel({ onAddCity }: AgentSuggestionsPanelProps) {
  const {
    isPanelExpanded,
    selectedAgentFilter,
    togglePanel,
    setAgentFilter,
    getFilteredCities,
  } = useAgentSuggestionsStore();

  const filteredCities = getFilteredCities();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="pointer-events-auto">
        {/* Collapse/Expand Button */}
        {!isPanelExpanded && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-center pb-4"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={togglePanel}
              className="shadow-2xl"
            >
              <Sparkles className="h-5 w-5" />
              Browse Agent Suggestions
              <ChevronUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Expanded Panel */}
        <AnimatePresence>
          {isPanelExpanded && (
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: '100%', opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, duration: 0.3 }}
              style={{
                willChange: 'transform, opacity, filter', // GPU acceleration
                transform: 'translateZ(0)' // Force GPU layer
              }}
            >
              <GlassPanel
                blur="xl"
                opacity={0.95}
                noPadding
                className="border-t border-gray-200"
              >
                {/* Header with Filters */}
                <div className="p-4 border-b border-gray-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary-600" />
                      <h2 className="text-lg font-bold text-gray-900">
                        Discover More Cities
                      </h2>
                      <span className="text-sm text-gray-500">
                        ({filteredCities.length} suggestions)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePanel}
                    >
                      <ChevronDown className="h-5 w-5" />
                      Collapse
                    </Button>
                  </div>

                  {/* Agent Filter Buttons */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {AGENT_FILTERS.map((filter) => {
                      const isActive = selectedAgentFilter === filter.id;
                      const agentColor = filter.id !== 'all'
                        ? AGENT_COLORS[filter.id as AgentType]
                        : { primary: '#6366f1', secondary: '#818cf8' };

                      return (
                        <button
                          key={filter.id}
                          onClick={() => setAgentFilter(filter.id)}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                            transition-all duration-200 whitespace-nowrap
                            ${isActive
                              ? 'text-white shadow-lg transform scale-105'
                              : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md'
                            }
                          `}
                          style={{
                            backgroundColor: isActive ? agentColor.primary : undefined,
                          }}
                        >
                          <span>{filter.emoji}</span>
                          <span>{filter.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* City Cards Carousel */}
                <div className="p-4 overflow-x-auto">
                  {filteredCities.length > 0 ? (
                    <div className="flex gap-4 pb-2">
                      {filteredCities.map((city) => (
                        <CityCard
                          key={city.id}
                          city={city}
                          onAddToDay={onAddCity}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No suggestions available for this filter</p>
                    </div>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
