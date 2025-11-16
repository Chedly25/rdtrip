/**
 * FlyingCardAnimation - Card Clone Animation
 * Phase 2: Animates card from suggestions panel to itinerary sidebar
 *
 * Uses framer-motion for smooth GPU-accelerated animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { AGENT_COLORS } from '../../../stores/spotlightStoreV2';
import type { AgentCity } from '../../../stores/agentSuggestionsStore';

interface FlyingCardAnimationProps {
  city: AgentCity | null;
  startRect: DOMRect | null;
  targetRect: DOMRect | null;
  onComplete: () => void;
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

export function FlyingCardAnimation({ city, startRect, targetRect, onComplete }: FlyingCardAnimationProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (city && startRect && targetRect) {
      setShouldRender(true);

      // Auto-complete after animation duration
      const timer = setTimeout(() => {
        setShouldRender(false);
        onComplete();
      }, 800); // 0.8s animation duration

      return () => clearTimeout(timer);
    }
  }, [city, startRect, targetRect, onComplete]);

  if (!city || !startRect || !targetRect) return null;

  const agentInfo = AGENT_LABELS[city.agentType] || { label: city.agentType, emoji: '🗺️' };
  const agentColor = AGENT_COLORS[city.agentType] || AGENT_COLORS['best-overall'];

  // Calculate transform values
  const startX = startRect.left;
  const startY = startRect.top;
  const endX = targetRect.left + (targetRect.width / 2) - (startRect.width / 2);
  const endY = targetRect.top + (targetRect.height / 2) - (startRect.height / 2);

  return createPortal(
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{
            position: 'fixed',
            left: startX,
            top: startY,
            width: startRect.width,
            height: startRect.height,
            zIndex: 9999,
            opacity: 1,
            scale: 1
          }}
          animate={{
            left: endX,
            top: endY,
            opacity: 0,
            scale: 0.5
          }}
          exit={{
            opacity: 0,
            scale: 0
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.8
          }}
          className="pointer-events-none"
          style={{
            willChange: 'transform, opacity', // GPU acceleration
            transform: 'translateZ(0)' // Force GPU layer
          }}
        >
          {/* Clone of CityCard */}
          <div
            className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
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
              <div className="flex items-start gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{city.name}</h3>
                  <p className="text-sm text-gray-500">{city.country}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
