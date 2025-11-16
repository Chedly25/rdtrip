/**
 * GlassPanel - Glassmorphism Component
 * Phase 0: Design System Foundation
 *
 * Apple Big Sur / Monterey style frosted glass effect
 * Uses backdrop-filter with blur and saturation
 */

import React from 'react';
import { colors, shadows, borderRadius, blur } from '../../design-tokens';

export interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  blur?: keyof typeof blur;
  opacity?: number;
  dark?: boolean;
  noBorder?: boolean;
  noPadding?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function GlassPanel({
  children,
  className = '',
  blur: blurAmount = 'lg',
  opacity = 0.7,
  dark = false,
  noBorder = false,
  noPadding = false,
  style = {},
  onClick,
  onMouseEnter,
  onMouseLeave,
}: GlassPanelProps) {
  const glassStyles: React.CSSProperties = {
    // Background with transparency
    background: dark
      ? `rgba(0, 0, 0, ${opacity * 0.3})`
      : `rgba(255, 255, 255, ${opacity})`,

    // Frosted glass effect (key to Apple look)
    backdropFilter: `blur(${blur[blurAmount]}) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur[blurAmount]}) saturate(180%)`, // Safari support

    // Border (subtle, semi-transparent)
    border: noBorder
      ? 'none'
      : dark
      ? '1px solid rgba(255, 255, 255, 0.1)'
      : '1px solid rgba(255, 255, 255, 0.3)',

    // Border radius
    borderRadius: borderRadius.xl,

    // Shadow with inner highlight (Apple signature)
    boxShadow: shadows.glass,

    // Padding
    padding: noPadding ? 0 : '1.5rem',

    // Performance optimization
    willChange: 'transform, opacity',
    transform: 'translateZ(0)', // Create GPU layer
    backfaceVisibility: 'hidden', // Prevent flickering

    // Merge custom styles
    ...style,
  };

  return (
    <div
      className={`glass-panel ${className}`}
      style={glassStyles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

// Variant: Glass Card (panel with hover effect)
export function GlassCard({
  children,
  onClick,
  className = '',
  hoverable = true,
  ...props
}: GlassPanelProps & { onClick?: () => void; hoverable?: boolean }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const cardStyles: React.CSSProperties = {
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: hoverable && isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
    boxShadow: hoverable && isHovered ? shadows.xl : shadows.glass,
  };

  return (
    <GlassPanel
      {...props}
      className={`glass-card ${className}`}
      style={cardStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </GlassPanel>
  );
}

// Check browser support for backdrop-filter
export function supportsGlassmorphism(): boolean {
  if (typeof window === 'undefined') return false;
  return CSS.supports('backdrop-filter', 'blur(10px)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
}

// Fallback wrapper (solid background if glassmorphism not supported)
export function GlassPanelWithFallback(props: GlassPanelProps) {
  const supported = supportsGlassmorphism();

  if (!supported) {
    // Fallback: solid background with subtle shadow
    const fallbackStyle: React.CSSProperties = {
      background: props.dark ? colors.gray[800] : colors.white,
      border: `1px solid ${props.dark ? colors.gray[700] : colors.gray[200]}`,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.md,
      padding: props.noPadding ? 0 : '1.5rem',
      ...props.style,
    };

    return (
      <div className={`glass-panel-fallback ${props.className || ''}`} style={fallbackStyle}>
        {props.children}
      </div>
    );
  }

  return <GlassPanel {...props} />;
}
