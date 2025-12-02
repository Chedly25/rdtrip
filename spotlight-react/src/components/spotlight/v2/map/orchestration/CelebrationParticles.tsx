/**
 * Celebration Particles
 *
 * A burst of particles that celebrates adding a new destination.
 * Creates a moment of delight that makes the interaction feel special.
 *
 * Design: Warm terracotta and gold particles radiating outward
 * with physics-based motion and fade.
 */

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ORCHESTRATION, MAP_COLORS } from '../mapConstants';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

interface CelebrationParticlesProps {
  trigger: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

const CelebrationParticles = memo(({
  trigger,
  position = { x: 0, y: 0 },
  onComplete,
}: CelebrationParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Generate particles
      const { particleCount, spread } = ORCHESTRATION.celebration;
      const colors = [
        MAP_COLORS.journey.routeStart,
        MAP_COLORS.journey.routeEnd,
        MAP_COLORS.journey.routeStart,
        MAP_COLORS.journey.routeEnd,
        '#FFFFFF',
      ];

      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
        const distance = spread * (0.6 + Math.random() * 0.4);

        newParticles.push({
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          angle,
          distance,
          size: 4 + Math.random() * 6,
          color: colors[i % colors.length],
          delay: i * 0.02,
        });
      }

      setParticles(newParticles);
      setIsVisible(true);

      // Clean up after animation
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setParticles([]);
        onComplete?.();
      }, ORCHESTRATION.celebration.duration + 200);

      return () => clearTimeout(timeout);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size}px ${particle.color}`,
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: particle.x,
                y: particle.y,
                scale: [0, 1.2, 1, 0],
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: ORCHESTRATION.celebration.duration / 1000,
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
              }}
            />
          ))}

          {/* Central glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              left: -10,
              top: -10,
              background: `radial-gradient(circle, ${MAP_COLORS.journey.routeEnd}, transparent)`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 2, 0], opacity: [1, 0.5, 0] }}
            transition={{
              duration: ORCHESTRATION.celebration.duration / 1000,
              ease: 'easeOut',
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
});

CelebrationParticles.displayName = 'CelebrationParticles';

export default CelebrationParticles;
