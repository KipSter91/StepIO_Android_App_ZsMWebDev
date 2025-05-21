import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.contentContainer}
        entering={FadeIn.duration(800).delay(300)}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://img.icons8.com/fluency/344/walking.png" }}
            style={styles.image}
          />
        </View>

        <Text style={styles.title}>Welcome to StepIO</Text>

        <Text style={styles.description}>
          Track your steps, monitor your activity, and achieve your fitness
          goals with StepIO.
        </Text>

        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="📊"
            text="Track and visualize your daily activity"
          />
          <FeatureItem
            icon="🗺️"
            text="Map your walking and running routes"
          />
          <FeatureItem
            icon="🏆"
            text="Set goals and celebrate achievements"
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(onboarding)/user-info")}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    marginBottom: 30,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: "#444",
    flex: 1,
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    width: "100%",
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
