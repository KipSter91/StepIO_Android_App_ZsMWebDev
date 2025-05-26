import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { COLORS } from "../../styles/theme"; // Import COLORS
import { useRef } from "react";

export default function OnboardingLayout() {
  // Track previous navigation index
  const prevIndexRef = useRef<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.darkBackground }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={({ route, navigation }) => {
          // Get current navigation index
          const state = navigation.getState();
          const currentIndex = state?.index ?? 0;
          let animation: "slide_from_right" | "slide_from_left" =
            "slide_from_right";

          // Try to read animationDirection param safely
          const params = (route as any)?.params as
            | { animationDirection?: string }
            | undefined;
          if (params?.animationDirection === "back") {
            animation = "slide_from_left";
          } else if (prevIndexRef.current !== null) {
            if (currentIndex < prevIndexRef.current) {
              animation = "slide_from_left";
            } else {
              animation = "slide_from_right";
            }
          }
          // Update ref for next render
          prevIndexRef.current = currentIndex;

          return {
            headerShown: false,
            animation,
            contentStyle: {
              backgroundColor: COLORS.darkBackground,
            },
          };
        }}
      />
    </View>
  );
}
