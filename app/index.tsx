import { useEffect } from "react";
import { router } from "expo-router";
import { useStepStore } from "@/src/store/useStepStore";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { userProfile } = useStepStore();

  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.onboardingComplete) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/(onboarding)/welcome");
    }
  }, [userProfile]);

  // Amíg nincs userProfile, mutatunk egy töltést
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}