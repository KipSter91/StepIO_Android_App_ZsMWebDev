export const COLORS = {
  primary: "#00FFCC",
  secondary: "#B45FFF",
  accent: "#FFD700",
  white: "#FFFFFF",
  black: "#000000",
  darkBackground: "#0F1420",
  darkForeground: "#f8f9fa",
  darkCard: "#131824",
  darkBorder: "#2B3044",
  darkMuted: "#8A94A6",
  darkHighlight: "#1D2235",
  neonBlue: "#5499FF",
  neonPink: "#FF0099",
  neonPurple: "#B45FFF",
  neonGreen: "#00FF66",
  success: "#4ADE80",
  warning: "#FF9F0A",
  danger: "#FF3366",
  info: "#42A5F5",
  destructive: "#FF3366",
  border: "#2B3044",
  error: "#FF4A6F",
  storyUnlocked: "#00FFCC",
  storyLocked: "#333344",
  xpPrimary: "#FF00FF",
  xpBackground: "#1D2235",
  transparent: "transparent",
  overlay: "rgba(15, 20, 32, 0.9)",
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
