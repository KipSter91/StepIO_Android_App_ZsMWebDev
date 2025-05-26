import { useColorScheme as _useColorScheme } from "react-native";

export function useColorScheme() {
  // Always return 'dark' for our cyberpunk app
  return "dark";
}

// Export the original hook if needed elsewhere
export { useColorScheme as _useColorScheme } from "react-native";
