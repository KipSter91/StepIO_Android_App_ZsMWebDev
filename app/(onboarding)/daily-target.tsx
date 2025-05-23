import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import useStepStore from "../../src/store/useStepStore";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";

const STEP_GOALS = [5000, 7500, 10000, 12000, 15000, 20000];

export default function DailyTargetScreen() {
  const { updateUserProfile, completeOnboarding } = useStepStore();
  const [selectedGoal, setSelectedGoal] = useState<number>(10000); // Default to 10000

  const handleComplete = () => {
    updateUserProfile({ dailyStepGoal: selectedGoal });
    completeOnboarding();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.centeredContent}>
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.replace({
                  pathname: "./user-info",
                  params: { animationDirection: "back" },
                })
              }>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.progressContainer}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === 1 ? styles.activeProgressDot : null,
                ]}
              />
            ))}
          </View>
          <Text style={styles.title}>Set your daily step goal</Text>
          <Text style={styles.subtitle}>
            Choose a target that challenges you but is achievable with your
            daily routine
          </Text>
          <View style={styles.goalsContainer}>
            {STEP_GOALS.map((goal, _unused) => (
              <Animated.View
                key={goal}
                // entering={SlideInRight.delay(index * 100).duration(400)} // Animation can be added back if desired
              >
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
                  {selectedGoal === goal && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          <View style={styles.goalDescriptionContainer}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.darkMuted}
            />
            <Text style={styles.goalDescriptionText}>
              You can always change this later in settings
            </Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleComplete}>
            <LinearGradient
              colors={GRADIENTS.primaryToSecondary}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Text style={styles.buttonText}>Complete Setup</Text>
              <Ionicons
                name="checkmark"
                size={20}
                color={COLORS.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  content: {
    flex: 1,
    alignItems: "center", // Center content
  },
  backButtonContainer: {
    position: "absolute",
    top: SPACING.xl * 1.2, // Még lejjebb, kb. 36-40px, platformfüggetlenül
    left: SPACING.md,
    zIndex: 1,
  },
  backButton: {
    padding: SPACING.sm,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.darkBorder,
    marginHorizontal: SPACING.xs / 2,
  },
  activeProgressDot: {
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
    marginBottom: SPACING.xl,
    textAlign: "center",
    lineHeight: 22,
  },
  goalsContainer: {
    width: "100%",
    marginBottom: SPACING.lg,
  },
  goalItem: {
    flexDirection: "row", // Align text and checkmark
    justifyContent: "space-between", // Space out text and checkmark
    alignItems: "center",
    paddingVertical: SPACING.lg, // Increased padding
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  selectedGoal: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(0, 255, 204, 0.1)", // Accent color with opacity
  },
  goalText: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.white,
  },
  selectedGoalText: {
    color: COLORS.primary,
  },
  checkIcon: {
    // Styles for the check icon if needed, already positioned by flexbox
  },
  goalDescriptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  goalDescriptionText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkMuted,
    marginLeft: SPACING.xs,
  },
  button: {
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    width: "100%",
    maxWidth: 300, // Consistent button width
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    marginRight: SPACING.xs,
  },
});
