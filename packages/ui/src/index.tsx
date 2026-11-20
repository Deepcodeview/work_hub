import React from 'react';
import { colors, borderRadius, spacing } from '@workhub/design-tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    borderRadius: borderRadius.md,
    border: '1px solid transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease-in-out',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: `${spacing[1]} ${spacing[2]}`, fontSize: '0.875rem' },
    md: { padding: `${spacing[2]} ${spacing[4]}`, fontSize: '1rem' },
    lg: { padding: `${spacing[3]} ${spacing[6]}`, fontSize: '1.125rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.primary.DEFAULT,
      color: colors.text.inverse,
    },
    secondary: {
      backgroundColor: colors.primary.subtle,
      color: colors.primary.DEFAULT,
    },
    outline: {
      backgroundColor: colors.surface,
      borderColor: colors.border.DEFAULT,
      color: colors.text.primary,
    },
    danger: {
      backgroundColor: colors.status.danger,
      color: colors.text.inverse,
    },
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 4,
  style,
  ...props
}) => {
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border.DEFAULT}`,
        padding: spacing[padding],
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`mb-3 ${className}`} {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-base font-semibold text-[#1F2937] ${className}`} {...props}>{children}</h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00] transition-colors ${className}`}
    {...props}
  />
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'success' | 'warning' | 'danger' | 'info';
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'error' | string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status = 'info',
  variant,
  style,
  ...props
}) => {
  const effectiveStatus = (variant === 'error' ? 'danger' : variant === 'secondary' ? 'info' : variant || status) as 'success' | 'warning' | 'danger' | 'info';
  const statusColors = {
    success: { bg: '#DCFCE7', text: colors.status.success },
    warning: { bg: '#FEF3C7', text: colors.status.warning },
    danger: { bg: '#FEE2E2', text: colors.status.danger },
    info: { bg: colors.primary.subtle, text: colors.primary.DEFAULT },
  };

  const currentColors = statusColors[effectiveStatus] || statusColors.info;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.5rem',
        borderRadius: borderRadius.full,
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: currentColors.bg,
        color: currentColors.text,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
