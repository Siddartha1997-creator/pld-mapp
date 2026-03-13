export const colors = {
  primary: '#1a73e8',
  primaryDark: '#1558b0',
  background: '#f5f7fa',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#5f6368',
  placeholder: '#9aa0a6',
  border: '#dadce0',
  error: '#d93025',
  success: '#1e8e3e',
  white: '#ffffff',
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.3 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 999,
};
