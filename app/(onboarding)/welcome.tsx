import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme"; // Corrected path

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          style={styles.contentContainer}
          entering={FadeIn.duration(800).delay(300)}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/stepio-logo.webp")} // Adjusted path
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome to StepIO</Text>

          <Text style={styles.description}>
            Track your steps, monitor your activity, and achieve your fitness
            goals with StepIO.
          </Text>

          <View style={styles.featuresContainer}>
            <FeatureItem
              iconName="stats-chart" // Using Ionicons name
              text="Track and visualize your daily activity"
            />
            <FeatureItem
              iconName="map-outline" // Using Ionicons name
              text="Map your walking routes and save them for later"
            />
            <FeatureItem
              iconName="trophy-outline" // Using Ionicons name
              text="Set goals and celebrate achievements"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(onboarding)/user-info")}>
            <LinearGradient
              colors={GRADIENTS.primaryToSecondary}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={COLORS.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({
  iconName,
  text,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Ionicons
        name={iconName}
        size={24}
        color={COLORS.primary}
        style={styles.featureIcon}
      />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 180,
    height: 70,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkMuted, // Changed from #666 to COLORS.darkMuted
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 24, // Adjusted for better readability
  },
  featuresContainer: {
    width: "100%",
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    backgroundColor: COLORS.darkCard, // Changed to COLORS.darkCard
    padding: SPACING.md,
    borderRadius: 12,
  },
  featureIcon: {
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    flex: 1,
  },
  button: {
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
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
