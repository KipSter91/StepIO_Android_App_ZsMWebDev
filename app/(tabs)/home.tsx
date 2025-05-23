import React, { useEffect } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import useStepStore from "../../src/store/useStepStore";
import { requestAllPermissions } from "@/src/utils/permissions";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  const { userProfile } = useStepStore();

  useEffect(() => {
    // Request permissions when HomeScreen is mounted
    requestAllPermissions();
  }, []);

  // In a real app, this would come from a native step counter
  const todaySteps = 7823;
  const goalProgress = Math.min(
    todaySteps / (userProfile?.dailyStepGoal || 10000),
    1
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hey, {userProfile?.firstName || "there"}
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressCircle}>
          <View
            style={[styles.progressArc, { width: `${goalProgress * 100}%` }]}
          />

          <View style={styles.statsContainer}>
            <Text style={styles.stepsCount}>{todaySteps.toLocaleString()}</Text>
            <Text style={styles.stepsLabel}>steps</Text>
            <Text style={styles.goalText}>
              Goal: {userProfile.dailyStepGoal?.toLocaleString() || "10,000"}{" "}
              steps
            </Text>
            <Text style={styles.percentText}>
              {Math.round(goalProgress * 100)}% completed
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.additionalStats}>
        <StatBox
          title="Distance"
          value={(todaySteps * 0.0008).toFixed(2)}
          unit="km"
        />
        <StatBox
          title="Calories"
          value={(todaySteps * 0.04).toFixed(0)}
          unit="kcal"
        />
        <StatBox
          title="Duration"
          value={(todaySteps * 0.0011).toFixed(1)}
          unit="hrs"
        />
      </View>

      <View style={styles.motivationContainer}>
        <Text style={styles.motivationTitle}>Motivation</Text>
        <Text style={styles.motivationText}>
          "A journey of a thousand miles begins with a single step."
        </Text>
      </View>
    </ScrollView>
  );
}

function StatBox({
  title,
  value,
  unit,
}: {
  title: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  date: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  progressCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  progressArc: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#3498db",
    top: 0,
    left: 0,
  },
  statsContainer: {
    alignItems: "center",
    backgroundColor: "white",
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    zIndex: 1,
  },
  stepsCount: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
  },
  stepsLabel: {
    fontSize: 18,
    color: "#666",
    marginTop: -4,
  },
  goalText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  percentText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
    marginTop: 4,
  },
  additionalStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  statBox: {
    backgroundColor: "#f7f9fc",
    width: "30%",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
  },
  statContent: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginRight: 4,
  },
  statUnit: {
    fontSize: 14,
    color: "#666",
  },
  motivationContainer: {
    backgroundColor: "#f7f9fc",
    borderRadius: 12,
    padding: 20,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 16,
    color: "#444",
    fontStyle: "italic",
    lineHeight: 24,
  },
});
