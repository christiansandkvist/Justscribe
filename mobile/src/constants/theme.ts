export const Colors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  primary: '#1A1A1A',
  secondary: '#666666',
  accent: '#FF3B30',        // red for record button
  accentLight: '#FFF0EF',
  success: '#34C759',
  warning: '#FF9500',
  border: '#E5E5E5',
  white: '#FFFFFF',
  balanceBg: '#F0F9F0',
  balanceText: '#1A7A1A',
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: Colors.primary },
  h2: { fontSize: 24, fontWeight: '700' as const, color: Colors.primary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.primary },
  body: { fontSize: 16, fontWeight: '400' as const, color: Colors.primary },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: Colors.secondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: Colors.secondary },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};
