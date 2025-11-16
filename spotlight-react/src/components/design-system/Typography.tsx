/**
 * Typography - Text Components
 * Phase 0: Design System Foundation
 */

import React from 'react';
import { typography, colors } from '../../design-tokens';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type TextVariant = 'body' | 'caption' | 'label';

export interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Heading({ level, children, className = '', style = {} }: HeadingProps) {
  const headingSizes: Record<HeadingLevel, string> = {
    1: typography.fontSize['5xl'],
    2: typography.fontSize['4xl'],
    3: typography.fontSize['3xl'],
    4: typography.fontSize['2xl'],
    5: typography.fontSize.xl,
    6: typography.fontSize.lg,
  };

  const headingStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.sans,
    fontSize: headingSizes[level],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    color: colors.gray[900],
    margin: 0,
    ...style,
  };

  const props = {
    className: `heading heading--${level} ${className}`,
    style: headingStyles,
    children,
  };

  return React.createElement(`h${level}`, props);
}

export interface TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

export function Text({ variant = 'body', children, className = '', color, style = {} }: TextProps) {
  const textStyles: Record<TextVariant, React.CSSProperties> = {
    body: {
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
      fontWeight: typography.fontWeight.normal,
    },
    caption: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.normal,
      fontWeight: typography.fontWeight.normal,
    },
    label: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.tight,
      fontWeight: typography.fontWeight.medium,
    },
  };

  const mergedStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.sans,
    color: color || colors.gray[700],
    margin: 0,
    ...textStyles[variant],
    ...style,
  };

  return (
    <p className={`text text--${variant} ${className}`} style={mergedStyles}>
      {children}
    </p>
  );
}
