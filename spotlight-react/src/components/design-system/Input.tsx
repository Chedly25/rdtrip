/**
 * Input - Form Input Components
 * Phase 0: Design System Foundation
 */

import React from 'react';
import { colors, typography, borderRadius, spacing } from '../../design-tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className = '',
  ...props
}: InputProps) {
  const hasError = !!error;

  const inputStyles: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    padding: `${spacing[3]} ${spacing[4]}`,
    paddingLeft: icon ? spacing[10] : spacing[4],
    border: `1px solid ${hasError ? colors.error : colors.gray[300]}`,
    borderRadius: borderRadius.md,
    background: colors.white,
    color: colors.gray[900],
    outline: 'none',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div className={`input-wrapper ${className}`} style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: spacing[2],
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.gray[700],
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.gray[400],
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}

        <input
          {...props}
          style={inputStyles}
          onFocus={(e) => {
            e.target.style.borderColor = hasError ? colors.error : colors.primary[500];
            e.target.style.boxShadow = `0 0 0 3px ${
              hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(20, 184, 166, 0.1)'
            }`;
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = hasError ? colors.error : colors.gray[300];
            e.target.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
        />
      </div>

      {(error || helperText) && (
        <p
          style={{
            marginTop: spacing[2],
            fontSize: typography.fontSize.sm,
            color: error ? colors.error : colors.gray[600],
          }}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
