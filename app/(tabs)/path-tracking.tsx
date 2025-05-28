import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import useStepStore from "../../src/store/useStepStore";
import TrackedMap from "../../components/TrackedMap";
import * as TaskManager from "expo-task-manager";
import { COLORS, FONTS, SPACING } from "../../styles/theme";

const LOCATION_TASK_NAME = "location-tracking";

TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: TaskManager.TaskManagerTaskBody<any>) => {
    if (error) {
      // Error handling
      return;
    }
    if (data && data.locations) {
      const { locations } = data;
      // TODO: Optionally handle background locations here
      // You can update a store, send to server, or save to storage
    }
    return Promise.resolve();
  }
);

export default function PathTrackingScreen() {
  const {
    activeSession,
    isTracking,
    startTracking,
    stopTracking,
    updateActiveSession,
  } = useStepStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fade effect for info card
  const infoOpacity = useRef(new Animated.Value(1)).current;
  const [showTracking, setShowTracking] = useState(isTracking);

  useEffect(() => {
    // Fade out
    Animated.timing(infoOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowTracking(isTracking); // Switch content after fade out
      // Fade in
      Animated.timing(infoOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [isTracking]);

  // Request location permissions when component mounts
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      // If tracking is active, start location updates
      if (isTracking) {
        startLocationUpdates();
      }
    })();

    // Clean up when component unmounts
    return () => {
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    };
  }, []);

  // Start location tracking
  const startLocationUpdates = async () => {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 5000,
        distanceInterval: 5, // minimum distance in meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "StepIO is tracking your path",
          notificationBody: "Keep the app open for best results",
        },
      });

      // Subscribe to location updates
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 5000 },
        (location) => {
          if (activeSession) {
            const newCoord = {
              lat: location.coords.latitude,
              lon: location.coords.longitude,
              timestamp: location.timestamp,
            };

            // Update active session with new coordinate
            updateActiveSession({
              coordinates: [...(activeSession.coordinates || []), newCoord],
            });
          }
        }
      );
    } catch (err) {
      console.error("Failed to start location tracking", err);
      setErrorMsg("Failed to start location tracking");
    }
  };

  // Handle start tracking button press
  const handleStartTracking = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start tracking in our store
      startTracking();

      // Start location updates
      await startLocationUpdates();
    } catch (error) {
      console.error("Error starting tracking:", error);
      Alert.alert("Error", "Failed to start path tracking");
    }
  };

  // Handle stop tracking button press
  const handleStopTracking = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Stop tracking in our store
      stopTracking();

      // Stop location updates
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.error("Error stopping tracking:", error);
      Alert.alert("Error", "Failed to stop path tracking");
    }
  };

  // If there's an error with permissions
  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Background with logo */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require("../../assets/images/stepio-background.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>
      {/* Map background */}
      <View style={styles.mapContainer}>
        <TrackedMap
          coordinates={activeSession?.coordinates || []}
          autoCenter={isTracking}
          readOnly={false}
          followUser={isTracking}
        />
      </View>
      {/* Tracking info card */}
      <View style={styles.statsCard}>
        <View style={styles.cardGradient}>
          <Animated.View style={{ opacity: infoOpacity, width: "100%" }}>
            {showTracking ? (
              <View style={styles.trackingInfoRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>
                    {activeSession
                      ? formatDuration(
                          (Date.now() - activeSession.startTime) / 1000
                        )
                      : "00:00:00"}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Steps</Text>
                  <Text style={styles.statValue}>
                    {activeSession?.steps || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>
                    {(
                      (activeSession?.coordinates?.length || 0) * 0.005
                    ).toFixed(2)}{" "}
                    km
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>
                  Tap the start button to begin tracking your path
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
      {/* Start/Stop button */}
      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTracking}>
            <MaterialIcons
              name="play-arrow"
              size={28}
              color={"#fff"}
            />
            <Text style={styles.buttonText}>Start Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopTracking}>
            <MaterialIcons
              name="stop"
              size={28}
              color={"#fff"}
            />
            <Text style={styles.buttonText}>Stop Tracking</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");
}

const styles = StyleSheet.create({
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
    opacity: 0.3,
  },
  mapContainer: {
    flex: 1,
    top: 20,
  },
  statsCard: {
    borderRadius: 16, // nagyobb kerekítés
    overflow: "hidden",
    marginHorizontal: SPACING.lg,
    marginTop: -32,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.3)",
    backgroundColor: "rgba(19, 24, 36, 0.75)",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardGradient: {
    padding: SPACING.lg,
    backgroundColor: "rgba(29, 34, 53, 0.9)",
    borderRadius: 16, // egyezzen a statsCard-dal
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  trackingInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: "700",
  },
  buttonContainer: {
    padding: SPACING.lg,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    // shadowColor: COLORS.primary,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 6,
    // elevation: 3,
  },
  stopButton: {
    flexDirection: "row",
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    // shadowColor: COLORS.danger,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginLeft: 10,
  },
  emptyStateContainer: {
    padding: SPACING.lg,
    alignItems: "center",
  },
  emptyStateText: {
    color: COLORS.darkMuted,
    fontSize: FONTS.sizes.md,
    textAlign: "center",
  },
  errorText: {
    color: COLORS.warning,
    textAlign: "center",
    margin: 20,
  },
});
