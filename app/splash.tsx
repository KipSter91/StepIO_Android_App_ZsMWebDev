import { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Canvas, Circle, Paint, Group } from "@shopify/react-native-skia";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import useStepStore from "../src/store/useStepStore";

// Keep splash screen visible while we check onboarding status
SplashScreen.preventAutoHideAsync();

export default function Splash() {
  const { userProfile } = useStepStore();

  // Animation values
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Check if onboarding is complete and navigate accordingly
  const checkOnboardingStatus = async () => {
    try {
      // Wait a little to show the splash animation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate based on onboarding status
      if (userProfile.onboardingComplete) {
        router.replace("/");
      } else {
        router.replace("/(onboarding)/welcome");
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
      router.replace("/(onboarding)/welcome");
    } finally {
      // Hide splash screen once we've decided where to navigate
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    // Animate elements
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 10 }, () => {
      // When animation is done, check onboarding
      runOnJS(checkOnboardingStatus)();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        {/* Logo circle */}
        <View style={styles.logo}>
          {" "}
          <Canvas style={styles.canvas}>
            <Circle
              cx={75}
              cy={75}
              r={65}
              color="#3498db"
            />
          </Canvas>
          <View style={styles.logoText}>
            <Text style={styles.logoTextStyle}>SI</Text>
          </View>
        </View>

        {/* App name */}
        <Text style={styles.appName}>StepIO</Text>
        <Text style={styles.tagline}>Track every step that matters</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  canvas: {
    width: 150,
    height: 150,
  },
  logoText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 150,
  },
  logoTextStyle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#666",
  },
});
