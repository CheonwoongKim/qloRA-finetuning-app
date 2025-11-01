// Color palette
export const COLORS = {
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    900: "#171717",
  },
  green: {
    50: "#f0fdf4",
    700: "#15803d",
  },
  red: {
    50: "#fef2f2",
    600: "#dc2626",
    700: "#b91c1c",
  },
  black: "#000000",
  white: "#ffffff",
} as const;

// Font sizes (in pixels)
export const FONT_SIZES = {
  xs: 12,    // text-xs
  sm: 14,    // text-sm
  base: 16,  // text-base
  lg: 18,    // text-lg
} as const;

// Spacing (in pixels)
export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  12: 48,
} as const;

// Border radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
} as const;

// Component heights
export const HEIGHTS = {
  input: 32,    // h-8
  button: {
    sm: 32,     // h-8
    md: 36,     // h-9
    lg: 40,     // h-10
  },
} as const;

// Transitions
export const TRANSITIONS = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
} as const;

// Z-index values
export const Z_INDEX = {
  dropdown: 50,
  modal: 100,
  toast: 200,
  tooltip: 300,
} as const;
