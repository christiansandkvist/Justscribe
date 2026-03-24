export const Colors = {
  background:  '#0a0a0a',
  surface:     '#111111',
  primary:     '#FFFFFF',
  onPrimary:   '#0a0a0a',
  secondary:   '#888888',
  accent:      '#1D9E75',
  accentLight: '#0d2b22',
  success:     '#1D9E75',
  warning:     '#FF9500',
  border:      '#2a2a2a',
  white:       '#FFFFFF',
  balanceBg:   '#0d2b22',
  balanceText: '#1D9E75',
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
