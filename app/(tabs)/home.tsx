import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import useStepStore from "../../src/store/useStepStore";
import { StatusBar } from "expo-status-bar";
import { nativeStepCounterService } from "../../src/services/nativeStepCounterService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useSharedValue,
  withTiming,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";
import { WeatherWidget } from "../../components/WeatherWidget";
import { MOTIVATION_TIPS } from "../../src/constants/motivationTips";

export default function HomeScreen() {
  const { userProfile, initializationStatus } = useStepStore();
  const [todaySteps, setTodaySteps] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedSteps, setDisplayedSteps] = useState(0);

  // Animation value for step count
  const animatedSteps = useSharedValue(0);

  useEffect(() => {
    // Only proceed if app is properly initialized
    if (
      !initializationStatus?.isInitialized ||
      !initializationStatus?.hasPermissions
    ) {
      return;
    }

    // Fetch initial step count
    nativeStepCounterService.getTodaySteps().then(setTodaySteps);

    // Subscribe to live step updates
    const stepUpdateHandler = (steps: number) => {
      setTodaySteps(steps);
    };
    nativeStepCounterService.onStepUpdate(stepUpdateHandler);
    return () => {
      nativeStepCounterService.removeStepUpdateListener(stepUpdateHandler);
    };
  }, [initializationStatus]);

  // Animated step count logic
  useEffect(() => {
    // Cancel any previous animation
    cancelAnimation(animatedSteps);
    // Animate and update JS state on every frame
    animatedSteps.value = withTiming(
      todaySteps,
      { duration: 600 },
      (finished) => {
        if (finished) runOnJS(setDisplayedSteps)(todaySteps);
      }
    );
    // Animation frame update
    const frame = () => {
      runOnJS(setDisplayedSteps)(Math.round(animatedSteps.value));
      if (Math.round(animatedSteps.value) !== todaySteps) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [todaySteps]);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const goalProgress = Math.min(
    todaySteps / (userProfile?.dailyStepGoal || 10000),
    1
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      const steps = await nativeStepCounterService.getTodaySteps();
      setTodaySteps(steps);
    } catch (error) {
      console.error("Failed to refresh step data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Daily motivation logic (random but deterministic per day, leak-proof)
  const dailyMotivation = useMemo(() => {
    // YYYY-MM-DD string for today using local date to avoid timezone issues
    const today = new Date();
    const dateString = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < dateString.length; i++) {
      hash = (hash << 5) + hash + dateString.charCodeAt(i);
      hash = hash & 0xffffffff; // Ensure 32-bit integer
    }
    const index = Math.abs(hash) % MOTIVATION_TIPS.length;
    return MOTIVATION_TIPS[index];
  }, []);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    if (hour >= 18 && hour < 22) return "Good evening";
    return "Good night";
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background with logo */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require("@/assets/images/stepio-background.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.darkCard}
          />
        }>
        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            {greeting}, {userProfile?.firstName || "there"}
          </Text>
          <Text style={styles.welcomeSubtitle}>You step, we sync.</Text>
        </View>

        {/* Weather widget */}
        <View style={styles.weatherSpacing}>
          <WeatherWidget />
        </View>

        {/* Today's stats card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={GRADIENTS.storyCard}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.statsHeader}>
              <View>
                <Text style={styles.statsLabel}>TODAY</Text>
                <Text style={styles.stepsCount}>
                  {formatNumber(displayedSteps)}
                </Text>
              </View>
              <View style={styles.statsIcon}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.iconBackground}>
                  <Ionicons
                    name="footsteps"
                    size={28}
                    color={COLORS.white}
                  />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(goalProgress * 100, 100)}%`,
                      backgroundColor:
                        goalProgress >= 1 ? COLORS.success : COLORS.primary,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.statsDetails}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userProfile?.dailyStepGoal
                    ? formatNumber(userProfile.dailyStepGoal)
                    : "-"}
                </Text>
                <Text style={styles.statLabel}>goal</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(goalProgress * 100).toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>of goal</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(todaySteps * 0.0008).toFixed(1)}km
                </Text>
                <Text style={styles.statLabel}>distance</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(todaySteps * 0.04)}
                </Text>
                <Text style={styles.statLabel}>calories</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Motivation card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={GRADIENTS.storyCard}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text style={styles.motivationTitle}>TODAY'S MOTIVATION:</Text>
            <Text style={styles.motivationText}>{`"${dailyMotivation}"`}</Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },

  // Background elements
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },

  // Scroll view content
  scrollContent: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Welcome section
  welcomeSection: {
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: FONTS.sizes.xxl,
    color: COLORS.white,
    fontFamily: FONTS.cyber.fontFamily,
  },
  welcomeSubtitle: {
    color: COLORS.darkMuted,
    marginTop: SPACING.xs,
    fontFamily: FONTS.regular.fontFamily,
  },

  // Stats card
  statsCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  cardGradient: {
    padding: SPACING.lg,
    borderRadius: 16,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  statsLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: "600",
  },
  stepsCount: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.white,
  },
  statsIcon: {
    width: 48,
    height: 48,
  },
  iconBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // Progress bar
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.xpBackground,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Stats details
  statsDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkMuted,
  },
  //Motivatiion card title
  motivationTitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: SPACING.sm,
  },

  // Motivation text
  motivationText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: SPACING.sm,
  },
  weatherSpacing: {
    marginBottom: SPACING.md,
  },
});
