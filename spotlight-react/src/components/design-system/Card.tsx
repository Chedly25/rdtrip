/**
 * Card - Standard and Glass Card Variants
 * Phase 0: Design System Foundation
 */

import React from 'react';
import { colors, shadows, borderRadius, spacing } from '../../design-tokens';
import { GlassCard as GlassCardBase } from './GlassPanel';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'standard' | 'glass';
  padding?: keyof typeof spacing;
  style?: React.CSSProperties;
}

export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  variant = 'standard',
  padding = 4,
  style = {},
}: CardProps) {
  if (variant === 'glass') {
    return (
      <GlassCardBase className={className} onClick={onClick} hoverable={hoverable} style={style}>
        {children}
      </GlassCardBase>
    );
  }

  const [isHovered, setIsHovered] = React.useState(false);

  const cardStyles: React.CSSProperties = {
    background: colors.white,
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: borderRadius.xl,
    padding: spacing[padding],
    boxShadow: hoverable && isHovered ? shadows.lg : shadows.sm,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: hoverable && isHovered ? 'translateY(-4px)' : 'translateY(0)',
    ...style,
  };

  return (
    <div
      className={`card ${className}`}
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}
