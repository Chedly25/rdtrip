/**
 * CityCard - Agent Suggestion City Card
 * Phase 2: Beautiful card with image, highlights, and add/replace buttons
 * Phase 4: Memoized for performance (only re-renders when props change)
 *          + Lazy animations with Intersection Observer (only animates when visible)
 */

import { motion, useInView } from 'framer-motion';
import { Plus, Check, MapPin } from 'lucide-react';
import { Button } from '../../design-system';
import { AGENT_COLORS } from '../../../stores/spotlightStoreV2';
import type { AgentCity } from '../../../stores/agentSuggestionsStore';
import { useRef, memo } from 'react';

interface CityCardProps {
  city: AgentCity;
  onAddToDay?: (city: AgentCity, day: number, cardElement: HTMLElement) => void;
  onReplace?: (city: AgentCity, replaceIndex: number) => void;
}

const AGENT_LABELS: Record<string, { label: string; emoji: string }> = {
  'best-overall': { label: 'Best Overall', emoji: '🎯' },
  adventure: { label: 'Adventure', emoji: '🏔️' },
  culture: { label: 'Culture', emoji: '🎭' },
  food: { label: 'Food', emoji: '🍽️' },
  'hidden-gems': { label: 'Hidden Gems', emoji: '💎' },
  scenic: { label: 'Scenic', emoji: '🌄' },
  'photo-stops': { label: 'Photo Stops', emoji: '📸' }
};

const CityCardComponent = ({ city, onAddToDay, onReplace: _onReplace }: CityCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const agentInfo = AGENT_LABELS[city.agentType] || { label: city.agentType, emoji: '🗺️' };
  const agentColor = AGENT_COLORS[city.agentType] || AGENT_COLORS['best-overall'];

  // Intersection Observer - only animate when card enters viewport
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  const handleAddClick = () => {
    if (cardRef.current && onAddToDay) {
      onAddToDay(city, city.suggestedDay || 1, cardRef.current);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex-shrink-0 w-80 bg-white rounded-2xl overflow-hidden shadow-lg"
      style={{
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        willChange: 'transform, opacity', // GPU acceleration hint
        transform: 'translateZ(0)' // Force GPU layer
      }}
    >
      {/* City Image */}
      <div className="relative h-48 overflow-hidden">
        {city.image ? (
          <img
            src={city.image}
            alt={city.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, ${agentColor.primary}, ${agentColor.secondary})` }}
          >
            {agentInfo.emoji}
          </div>
        )}

        {/* Agent Badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-white text-sm font-semibold backdrop-blur-md"
          style={{
            backgroundColor: `${agentColor.primary}cc`
          }}
        >
          {agentInfo.emoji} {agentInfo.label}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* City Name */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{city.name}</h3>
            <p className="text-sm text-gray-500">{city.country}</p>
          </div>
        </div>

        {/* Highlights */}
        {city.highlights && city.highlights.length > 0 && (
          <div className="mb-4">
            <ul className="space-y-1.5">
              {city.highlights.slice(0, 4).map((highlight, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {city.isInItinerary ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled
            >
              <Check className="h-4 w-4" />
              Added
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleAddClick}
              >
                <Plus className="h-4 w-4" />
                Add to Day {city.suggestedDay || 1}
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-renders when city, onAddToDay, or onReplace props change
export const CityCard = memo(CityCardComponent);
