import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useStepStore } from "@/src/store/useStepStore";
import { View, ActivityIndicator, Text } from "react-native";

export default function Index() {
  const { userProfile, isAppReady, initializationStatus, initializeApp } =
    useStepStore();
  const [isMounted, setIsMounted] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [initStarted, setInitStarted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Start app initialization when component mounts
  useEffect(() => {
    if (!isMounted || initStarted) return;

    setInitStarted(true);
    initializeApp().catch((error) => {
      console.error("[Index] Failed to initialize app:", error);
    });
  }, [isMounted, initStarted, initializeApp]);

  // Navigate when both app is ready and user profile is available
  useEffect(() => {
    if (!isMounted || !isAppReady || !userProfile || hasNavigated) return;

    // Small delay to ensure navigation stack is ready
    const timer = setTimeout(() => {
      setHasNavigated(true);
      if (userProfile.onboardingComplete) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(onboarding)/welcome");
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [userProfile, isMounted, hasNavigated, isAppReady]);

  // Show loading screen during initialization
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16, textAlign: "center", color: "#666" }}>
        {!initStarted
          ? "Starting up..."
          : !isAppReady
          ? "Initializing step tracking..."
          : "Loading your profile..."}
      </Text>
      {initializationStatus?.error && (
        <Text
          style={{
            marginTop: 8,
            textAlign: "center",
            color: "#ff6b6b",
            fontSize: 12,
          }}>
          {initializationStatus.error}
        </Text>
      )}
    </View>
  );
}
