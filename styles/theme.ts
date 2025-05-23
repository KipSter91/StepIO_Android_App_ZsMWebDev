/**
 * StepIO mobile app color theme and style definitions
 */

export const COLORS = {
  // Base colors
  primary: "#00FFCC", // Main app color - bright teal
  secondary: "#B45FFF", // Secondary color - purple
  accent: "#FFD700", // cyber gold
  white: "#FFFFFF",
  black: "#000000",

  // Dark mode (primary theme for cyberpunk aesthetic)
  darkBackground: "#0F1420", // Primary dark background
  darkForeground: "#f8f9fa",
  darkCard: "#131824", // Slightly lighter dark background for cards
  darkBorder: "#2B3044",
  darkMuted: "#8A94A6", // Muted text on dark backgrounds
  darkHighlight: "#1D2235", // subtle highlight for selections

  // Neon accents
  neonBlue: "#5499FF", // Blue for accent
  neonPink: "#FF0099",
  neonPurple: "#B45FFF", // Purple for accent
  neonGreen: "#00FF66",

  // Functional colors
  success: "#4ADE80", // Green for success states
  warning: "#FF9F0A", // Orange for warning states
  danger: "#FF3366", // neon red
  info: "#42A5F5", // electric blue
  destructive: "#FF3366", // same as danger
  border: "#2B3044", // same as darkBorder for consistency
  error: "#FF4A6F", // Red for error states

  // Story progression colors
  storyUnlocked: "#00FFCC", // matching primary
  storyLocked: "#333344", // muted dark
  xpPrimary: "#FF00FF", // matching secondary
  xpBackground: "#1D2235", // dark background for XP bar

  // Additional colors
  transparent: "transparent",
  overlay: "rgba(15, 20, 32, 0.9)", // Overlay for modals
};

export const GRADIENTS = {
  primaryToSecondary: ["#00FFCC", "#FF00FF"] as const,
  darkGlass: ["rgba(19, 24, 36, 0.8)", "rgba(11, 15, 25, 0.8)"] as const,
  cyberpunkOverlay: [
    "rgba(0, 255, 204, 0.1)",
    "rgba(255, 0, 255, 0.05)",
  ] as const,
  storyCard: ["rgba(19, 24, 36, 0.9)", "rgba(29, 34, 53, 0.9)"] as const,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const FONTS = {
  regular: {
    fontFamily: "System",
    fontWeight: "400" as const,
  },
  medium: {
    fontFamily: "System",
    fontWeight: "500" as const,
  },
  semibold: {
    fontFamily: "System",
    fontWeight: "600" as const,
  },
  bold: {
    fontFamily: "System",
    fontWeight: "700" as const,
  },
  cyber: {
    fontFamily: "System",
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    title: 36,
  },
};
