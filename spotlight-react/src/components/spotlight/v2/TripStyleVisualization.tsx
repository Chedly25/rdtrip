/**
 * Trip Style Visualization
 *
 * A beautiful radar/spider chart visualization showing the character
 * of the user's trip based on their preferences. Displays multiple
 * dimensions like Explorer↔Relaxer, Budget↔Luxury, etc.
 *
 * Design: Warm editorial aesthetic with terracotta/gold accents,
 * smooth animations, and a refined geometric presentation.
 * Inspired by vintage compass roses and travel magazine infographics.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronDown, Sparkles } from 'lucide-react';
import type { TripStyleProfile } from '../../../stores/spotlightStoreV2';

interface TripStyleVisualizationProps {
  profile: TripStyleProfile;
  variant?: 'radar' | 'bars' | 'compact';
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

// Style dimension configurations matching TripStyleProfile interface
const STYLE_DIMENSIONS: {
  key: keyof TripStyleProfile;
  label: string;
  color: string;
  icon: string;
  description: string;
}[] = [
  {
    key: 'cultural',
    label: 'Cultural',
    color: '#8B6914',
    icon: '🏛️',
    description: 'Museums, history & heritage',
  },
  {
    key: 'adventure',
    label: 'Adventure',
    color: '#3A6247',
    icon: '⛰️',
    description: 'Thrills & exploration',
  },
  {
    key: 'relaxation',
    label: 'Relaxation',
    color: '#4A90A4',
    icon: '🧘',
    description: 'Rest & rejuvenation',
  },
  {
    key: 'culinary',
    label: 'Culinary',
    color: '#8B3A3A',
    icon: '🍷',
    description: 'Food & dining experiences',
  },
  {
    key: 'nature',
    label: 'Nature',
    color: '#4A7C59',
    icon: '🌿',
    description: 'Outdoors & landscapes',
  },
];

// Calculate polygon points for radar chart
function calculatePolygonPoints(
  profile: TripStyleProfile,
  centerX: number,
  centerY: number,
  radius: number
): string {
  const dimensions = STYLE_DIMENSIONS;
  const angleStep = (2 * Math.PI) / dimensions.length;
  const startAngle = -Math.PI / 2; // Start from top

  const points = dimensions.map((dim, index) => {
    const value = profile[dim.key] ?? 50;
    const normalizedValue = value / 100;
    const angle = startAngle + index * angleStep;
    const x = centerX + normalizedValue * radius * Math.cos(angle);
    const y = centerY + normalizedValue * radius * Math.sin(angle);
    return `${x},${y}`;
  });

  return points.join(' ');
}

// Radar chart variant
function RadarChart({ profile, showLabels = true }: { profile: TripStyleProfile; showLabels?: boolean }) {
  const size = 220;
  const center = size / 2;
  const maxRadius = size / 2 - 40;

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dimensions = STYLE_DIMENSIONS;
  const angleStep = (2 * Math.PI) / dimensions.length;
  const startAngle = -Math.PI / 2;

  const polygonPoints = useMemo(
    () => calculatePolygonPoints(profile, center, center, maxRadius),
    [profile, center, maxRadius]
  );

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Background glow */}
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C45830" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#C45830" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C45830" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D4A853" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C45830" />
            <stop offset="100%" stopColor="#D4A853" />
          </linearGradient>
        </defs>

        {/* Background glow circle */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius + 10}
          fill="url(#radarGlow)"
        />

        {/* Grid circles */}
        {gridLevels.map((level, i) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={maxRadius * level}
            fill="none"
            stroke="rgba(139, 115, 85, 0.15)"
            strokeWidth={i === gridLevels.length - 1 ? 1.5 : 0.5}
            strokeDasharray={i < gridLevels.length - 1 ? '2,4' : 'none'}
          />
        ))}

        {/* Axis lines */}
        {dimensions.map((_, index) => {
          const angle = startAngle + index * angleStep;
          const x2 = center + maxRadius * Math.cos(angle);
          const y2 = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(139, 115, 85, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* Center decorative element */}
        <circle
          cx={center}
          cy={center}
          r="6"
          fill="#FFFBF5"
          stroke="url(#radarStroke)"
          strokeWidth="2"
        />

        {/* Data polygon with animation */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.15, 0.5, 0.5, 1], delay: 0.2 }}
          points={polygonPoints}
          fill="url(#radarFill)"
          stroke="url(#radarStroke)"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Data points */}
        {dimensions.map((dim, index) => {
          const value = profile[dim.key] ?? 50;
          const normalizedValue = value / 100;
          const angle = startAngle + index * angleStep;
          const x = center + normalizedValue * maxRadius * Math.cos(angle);
          const y = center + normalizedValue * maxRadius * Math.sin(angle);
          return (
            <motion.circle
              key={dim.key}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              cx={x}
              cy={y}
              r="5"
              fill="#FFFBF5"
              stroke={dim.color}
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Labels around the chart */}
      {showLabels && dimensions.map((dim, index) => {
        const angle = startAngle + index * angleStep;
        const labelRadius = maxRadius + 30;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);

        return (
          <motion.div
            key={dim.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="absolute flex flex-col items-center"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-lg">{dim.icon}</span>
            <span
              className="mt-0.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: dim.color }}
            >
              {dim.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// Horizontal bars variant - shows each dimension as a fill bar (0-100)
function BarsVisualization({ profile }: { profile: TripStyleProfile }) {
  return (
    <div className="space-y-4">
      {STYLE_DIMENSIONS.map((dim, index) => {
        const value = profile[dim.key] ?? 0;
        return (
          <motion.div
            key={dim.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{dim.icon}</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: '#5C4D3D' }}
                >
                  {dim.label}
                </span>
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: dim.color }}
              >
                {value}%
              </span>
            </div>
            <div
              className="relative h-2 overflow-hidden rounded-full"
              style={{ background: 'rgba(139, 115, 85, 0.1)' }}
            >
              {/* Value indicator */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: [0.15, 0.5, 0.5, 1] }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${dim.color}80, ${dim.color})`,
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Compact variant - simple pills showing strongest dimensions
function CompactVisualization({ profile }: { profile: TripStyleProfile }) {
  // Sort dimensions by value and show top ones
  const sortedDimensions = [...STYLE_DIMENSIONS].sort((a, b) => {
    const valueA = profile[a.key] ?? 0;
    const valueB = profile[b.key] ?? 0;
    return valueB - valueA;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {sortedDimensions.map((dim, index) => {
        const value = profile[dim.key] ?? 0;
        const isStrong = value >= 50;

        // Only show if value is meaningful (> 20)
        if (value < 20) return null;

        return (
          <motion.div
            key={dim.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{
              background: isStrong
                ? `${dim.color}15`
                : 'rgba(139, 115, 85, 0.08)',
              border: `1px solid ${isStrong ? `${dim.color}30` : 'rgba(139, 115, 85, 0.15)'}`,
            }}
          >
            <span className="text-sm">{dim.icon}</span>
            <span
              className="text-xs font-medium"
              style={{ color: isStrong ? dim.color : '#8B7355' }}
            >
              {dim.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function TripStyleVisualization({
  profile,
  variant = 'radar',
  showLabels = true,
  showLegend = true,
  className = '',
}: TripStyleVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(variant !== 'compact');

  // Calculate dominant style (highest value)
  const dominantStyle = useMemo(() => {
    let maxValue = 0;
    let dominant = STYLE_DIMENSIONS[0];

    STYLE_DIMENSIONS.forEach((dim) => {
      const value = profile[dim.key] ?? 0;
      if (value > maxValue) {
        maxValue = value;
        dominant = dim;
      }
    });

    return {
      ...dominant,
      value: maxValue,
    };
  }, [profile]);

  if (variant === 'compact') {
    return (
      <div className={className}>
        <CompactVisualization profile={profile} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
        border: '1px solid rgba(139, 115, 85, 0.12)',
      }}
    >
      {/* Decorative corner element */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(139, 115, 85, 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.1) 100%)',
            }}
          >
            <Compass className="h-5 w-5" style={{ color: '#C45830' }} />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{
                color: '#2C2417',
                fontFamily: "'Fraunces', Georgia, serif",
              }}
            >
              Your Travel Style
            </h3>
            <p className="text-xs text-[#8B7355]">
              Primarily {dominantStyle.icon} {dominantStyle.label}
            </p>
          </div>
        </div>

        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5"
          style={{ color: '#C45830' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.15, 0.5, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 py-6">
              {variant === 'radar' ? (
                <div className="flex flex-col items-center">
                  <RadarChart profile={profile} showLabels={showLabels} />

                  {/* Legend */}
                  {showLegend && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3"
                    >
                      {STYLE_DIMENSIONS.map((dim) => {
                        const value = profile[dim.key] ?? 0;
                        return (
                          <div
                            key={dim.key}
                            className="flex items-center gap-2 rounded-lg px-3 py-2"
                            style={{
                              background: 'rgba(139, 115, 85, 0.05)',
                            }}
                          >
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: dim.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className="truncate text-xs font-medium"
                                  style={{ color: '#5C4D3D' }}
                                >
                                  {dim.label}
                                </span>
                                <span
                                  className="text-[10px] font-semibold"
                                  style={{ color: dim.color }}
                                >
                                  {value}%
                                </span>
                              </div>
                              <div
                                className="text-[10px]"
                                style={{ color: '#8B7355' }}
                              >
                                {dim.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              ) : (
                <BarsVisualization profile={profile} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-4"
        >
          <CompactVisualization profile={profile} />
        </motion.div>
      )}

      {/* Personalization indicator */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{
          background: 'rgba(196, 88, 48, 0.03)',
          borderTop: '1px solid rgba(139, 115, 85, 0.08)',
        }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: '#D4A853' }} />
        <span
          className="text-xs"
          style={{
            color: '#8B7355',
            fontFamily: "'Satoshi', sans-serif",
          }}
        >
          Based on your preferences and trip story
        </span>
      </div>
    </motion.div>
  );
}

export default TripStyleVisualization;
