/**
 * Button - Apple-Style Button Component
 * Phase 0: Design System Foundation
 *
 * Three variants: primary, secondary, ghost
 * Smooth hover/active states with spring animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { colors, typography, borderRadius, shadows, spacing } from '../../design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  // Base styles
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    lineHeight: '1',
    borderRadius: borderRadius.lg,
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    position: 'relative',
    overflow: 'hidden',

    // Performance optimization
    willChange: 'transform',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
  };

  // Size-specific styles
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      fontSize: typography.fontSize.sm,
      padding: `${spacing[2]} ${spacing[3]}`,
      minHeight: '32px',
    },
    md: {
      fontSize: typography.fontSize.base,
      padding: `${spacing[3]} ${spacing[4]}`,
      minHeight: '40px',
    },
    lg: {
      fontSize: typography.fontSize.lg,
      padding: `${spacing[4]} ${spacing[6]}`,
      minHeight: '48px',
    },
  };

  // Variant-specific styles
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: disabled ? colors.gray[300] : colors.primary[500],
      color: colors.white,
      boxShadow: disabled ? 'none' : shadows.sm,
    },
    secondary: {
      background: disabled ? colors.gray[100] : colors.gray[200],
      color: disabled ? colors.gray[400] : colors.gray[700],
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: disabled ? colors.gray[400] : colors.gray[700],
      boxShadow: 'none',
    },
  };

  const mergedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  // Extract onClick and other HTML button attributes
  const { onClick, onFocus, onBlur, type, name, value, form, formAction, formMethod, formTarget, formNoValidate, formEncType } = props;

  return (
    <motion.button
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      type={type}
      name={name}
      value={value}
      form={form}
      formAction={formAction}
      formMethod={formMethod}
      formTarget={formTarget}
      formNoValidate={formNoValidate}
      formEncType={formEncType}
      disabled={disabled || loading}
      className={`button button--${variant} button--${size} ${className}`}
      style={mergedStyles}
      whileHover={
        disabled || loading
          ? undefined
          : {
              scale: 1.02,
              y: -1,
            }
      }
      whileTap={
        disabled || loading
          ? undefined
          : {
              scale: 0.98,
              y: 0,
            }
      }
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8,
      }}
    >
      {loading && (
        <span
          className="button__spinner"
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}

      {!loading && icon && iconPosition === 'left' && (
        <span className="button__icon button__icon--left">{icon}</span>
      )}

      <span className="button__text">{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span className="button__icon button__icon--right">{icon}</span>
      )}
    </motion.button>
  );
}

// Icon-only button variant
export function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  ...props
}: Omit<ButtonProps, 'children'> & { icon: React.ReactNode }) {
  const iconSizes: Record<ButtonSize, string> = {
    sm: '32px',
    md: '40px',
    lg: '48px',
  };

  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      style={{
        padding: 0,
        width: iconSizes[size],
        height: iconSizes[size],
        minHeight: iconSizes[size],
        borderRadius: borderRadius.md,
      }}
    >
      {icon}
    </Button>
  );
}

// Add spinner keyframes to global styles (inject once)
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;
  if (!document.querySelector('style[data-button-animations]')) {
    styleEl.setAttribute('data-button-animations', 'true');
    document.head.appendChild(styleEl);
  }
}
