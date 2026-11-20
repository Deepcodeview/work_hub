/**
 * WorkHub Design Tokens
 * Direction: Warm ivory, white surfaces, orange accent, restrained shadows, premium minimalism.
 */

export const colors = {
  primary: {
    DEFAULT: '#FF8A00',
    hover: '#E67C00',
    light: '#FFE4CC',
    subtle: '#FFF3E8',
  },
  background: '#FFFAF5',
  surface: '#FFFFFF',
  text: {
    primary: '#1F2937',
    secondary: '#64748B',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
  border: {
    DEFAULT: '#F1E9E0',
    focus: '#FF8A00',
  },
  status: {
    success: '#16A34A',
    warning: '#EFA526',
    danger: '#DC4444',
    info: '#2563EB',
  },
} as const;

export const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem' // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const spacing = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
  12: '3rem',
  16: '4rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
} as const;

export const shadows = {
  subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
} as const;
