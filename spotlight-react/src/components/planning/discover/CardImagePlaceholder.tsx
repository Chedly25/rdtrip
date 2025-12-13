/**
 * CardImagePlaceholder
 *
 * Beautiful type-specific placeholder designs for when images can't be loaded.
 * Each type has a unique atmospheric design that feels intentional, not broken.
 *
 * Design philosophy: Vintage travel poster meets modern editorial
 * - Warm gradients that evoke the feeling of the place type
 * - Geometric patterns and decorative elements
 * - Subtle texture overlays for depth
 */

import { memo } from 'react';
import {
  Utensils,
  Camera,
  Sparkles,
  Wine,
  Coffee,
  Building2,
  Landmark,
  TreePine,
  Compass,
} from 'lucide-react';
import type { PlanCardType } from '../../../types/planning';

interface CardImagePlaceholderProps {
  type: PlanCardType;
  area?: string;
}

// Type-specific design configurations
const typeDesigns: Record<PlanCardType, {
  gradient: string;
  pattern: 'dots' | 'lines' | 'circles' | 'diamonds' | 'waves' | 'grid';
  icon: React.ElementType;
  accentColor: string;
  secondaryIcon?: React.ElementType;
}> = {
  restaurant: {
    gradient: 'from-[#2C1810] via-[#4A2C1C] to-[#6B3A24]',
    pattern: 'dots',
    icon: Utensils,
    accentColor: '#E8B89D',
  },
  activity: {
    gradient: 'from-[#1A2942] via-[#2D4A6B] to-[#3D5A7A]',
    pattern: 'circles',
    icon: Landmark,
    accentColor: '#A8C5E2',
    secondaryIcon: Compass,
  },
  photo_spot: {
    gradient: 'from-[#2D1F3D] via-[#4A3562] to-[#5D4275]',
    pattern: 'diamonds',
    icon: Camera,
    accentColor: '#C9B3E5',
  },
  hotel: {
    gradient: 'from-[#1F2937] via-[#374151] to-[#4B5563]',
    pattern: 'lines',
    icon: Building2,
    accentColor: '#D1C4B8',
  },
  bar: {
    gradient: 'from-[#3D1F2D] via-[#5C2D42] to-[#7A3D5A]',
    pattern: 'waves',
    icon: Wine,
    accentColor: '#E8B8C8',
  },
  cafe: {
    gradient: 'from-[#1F3D2D] via-[#2D5A42] to-[#3D7A5A]',
    pattern: 'grid',
    icon: Coffee,
    accentColor: '#B8E8C8',
  },
  experience: {
    gradient: 'from-[#3D2D1F] via-[#5A422D] to-[#7A5A3D]',
    pattern: 'dots',
    icon: Sparkles,
    accentColor: '#E8D4B8',
    secondaryIcon: TreePine,
  },
};

// SVG pattern definitions
const PatternDefs = () => (
  <defs>
    {/* Dots pattern */}
    <pattern id="pattern-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.15" />
    </pattern>

    {/* Lines pattern */}
    <pattern id="pattern-lines" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <line x1="0" y1="20" x2="20" y2="0" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    </pattern>

    {/* Circles pattern */}
    <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
      <circle cx="20" cy="20" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
    </pattern>

    {/* Diamonds pattern */}
    <pattern id="pattern-diamonds" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M12 0L24 12L12 24L0 12Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    </pattern>

    {/* Waves pattern */}
    <pattern id="pattern-waves" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
      <path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    </pattern>

    {/* Grid pattern */}
    <pattern id="pattern-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20 0L0 0L0 20" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
    </pattern>

    {/* Noise texture */}
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  </defs>
);

export function CardImagePlaceholder({ type, area }: CardImagePlaceholderProps) {
  const design = typeDesigns[type] || typeDesigns.activity;
  const Icon = design.icon;
  const SecondaryIcon = design.secondaryIcon;

  return (
    <div className={`
      absolute inset-0 overflow-hidden
      bg-gradient-to-br ${design.gradient}
    `}>
      {/* SVG patterns */}
      <svg className="absolute inset-0 w-full h-full" style={{ color: design.accentColor }}>
        <PatternDefs />
        <rect width="100%" height="100%" fill={`url(#pattern-${design.pattern})`} />
      </svg>

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circles */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10"
        style={{ backgroundColor: design.accentColor }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
        style={{ backgroundColor: design.accentColor }}
      />

      {/* Diagonal accent line */}
      <div
        className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none"
      >
        <div
          className="absolute -right-20 top-1/2 w-80 h-px rotate-45 opacity-20"
          style={{ backgroundColor: design.accentColor }}
        />
      </div>

      {/* Main icon container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Glow effect */}
          <div
            className="absolute inset-0 blur-2xl opacity-30 scale-150"
            style={{ backgroundColor: design.accentColor }}
          />

          {/* Icon circle background */}
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
            style={{
              backgroundColor: `${design.accentColor}15`,
              border: `1px solid ${design.accentColor}30`,
            }}
          >
            <Icon
              className="w-10 h-10"
              style={{ color: design.accentColor }}
              strokeWidth={1.5}
            />
          </div>

          {/* Secondary icon (smaller, offset) */}
          {SecondaryIcon && (
            <div
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
              style={{
                backgroundColor: `${design.accentColor}20`,
                border: `1px solid ${design.accentColor}25`,
              }}
            >
              <SecondaryIcon
                className="w-4 h-4"
                style={{ color: design.accentColor }}
                strokeWidth={1.5}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div
          className="px-3 py-1.5 rounded-full inline-flex items-center gap-2 backdrop-blur-md"
          style={{
            backgroundColor: `${design.accentColor}10`,
            border: `1px solid ${design.accentColor}20`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: design.accentColor }}
          />
          <span
            className="text-xs font-medium tracking-wide uppercase"
            style={{ color: design.accentColor }}
          >
            {area || 'Discover'}
          </span>
        </div>
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
    </div>
  );
}

export default memo(CardImagePlaceholder);
