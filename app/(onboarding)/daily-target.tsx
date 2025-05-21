import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import useStepStore from "../../src/store/useStepStore";

const STEP_GOALS = [5000, 7500, 10000, 12000, 15000, 20000];

export default function DailyTargetScreen() {
  const { updateUserProfile, completeOnboarding } = useStepStore();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(10000);

  const handleComplete = () => {
    if (!selectedGoal) {
      return;
    }

    // Save daily step goal
    updateUserProfile({ dailyStepGoal: selectedGoal });

    // Mark onboarding as complete
    completeOnboarding();

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate to home screen
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.content}
        entering={FadeIn.duration(600)}>
        <Text style={styles.title}>Set your daily step goal</Text>
        <Text style={styles.subtitle}>
          Choose a target that challenges you but is achievable with your daily
          routine
        </Text>

        <View style={styles.goalsContainer}>
          {STEP_GOALS.map((goal, index) => (
            <Animated.View
              key={goal}
              entering={SlideInRight.delay(index * 100).duration(400)}>
              <TouchableOpacity
                style={[
                  styles.goalItem,
                  selectedGoal === goal && styles.selectedGoal,
                ]}
                onPress={() => {
                  setSelectedGoal(goal);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}>
                <Text
                  style={[
                    styles.goalText,
                    selectedGoal === goal && styles.selectedGoalText,
                  ]}>
                  {goal.toLocaleString()} steps
                </Text>
                {getGoalDescription(goal)}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleComplete}>
          <Text style={styles.buttonText}>Complete Setup</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function getGoalDescription(goal: number) {
  let description = "";
  let icon = "";

  if (goal <= 5000) {
    description = "Gentle start";
    icon = "🚶";
  } else if (goal <= 7500) {
    description = "Moderate activity";
    icon = "🚶‍♂️";
  } else if (goal <= 10000) {
    description = "Recommended target";
    icon = "✨";
  } else if (goal <= 15000) {
    description = "Athletic lifestyle";
    icon = "🏃";
  } else {
    description = "Pro mover";
    icon = "🏆";
  }

  return (
    <Text style={styles.goalDescription}>
      {icon} {description}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    lineHeight: 22,
  },
  goalsContainer: {
    marginBottom: 40,
  },
  goalItem: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedGoal: {
    borderColor: "#3498db",
    backgroundColor: "#ebf5fb",
  },
  goalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 4,
  },
  selectedGoalText: {
    color: "#3498db",
  },
  goalDescription: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
