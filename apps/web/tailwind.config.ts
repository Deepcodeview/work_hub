import type { Config } from 'tailwindcss';
import { colors, borderRadius, spacing } from '@workhub/design-tokens';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        border: colors.border.DEFAULT,
        status: colors.status,
      },
      borderRadius: borderRadius,
      spacing: spacing,
    },
  },
  plugins: [],
};

export default config;
