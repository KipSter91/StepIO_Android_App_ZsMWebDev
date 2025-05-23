import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import useStepStore from "../../src/store/useStepStore";
import TrackedMap from "../../components/TrackedMap";
import * as TaskManager from "expo-task-manager";

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
      <StatusBar style="dark" />

      <View style={styles.mapContainer}>
        <TrackedMap
          coordinates={activeSession?.coordinates || []}
          autoCenter={isTracking}
          readOnly={false}
          followUser={isTracking}
        />
      </View>

      {isTracking ? (
        <View style={styles.trackingInfo}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {activeSession
                ? formatDuration((Date.now() - activeSession.startTime) / 1000)
                : "00:00:00"}
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>Steps</Text>
            <Text style={styles.statValue}>{activeSession?.steps || 0}</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>
              {((activeSession?.coordinates?.length || 0) * 0.005).toFixed(2)}{" "}
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

      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTracking}>
            <MaterialIcons
              name="play-arrow"
              size={32}
              color="#fff"
            />
            <Text style={styles.buttonText}>Start Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopTracking}>
            <MaterialIcons
              name="stop"
              size={32}
              color="#fff"
            />
            <Text style={styles.buttonText}>Stop Tracking</Text>
          </TouchableOpacity>
        )}
      </View>
      <View/>
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
    backgroundColor: "#fff",
  },
  mapContainer: {
    flex: 1,
  },
  trackingInfo: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    justifyContent: "space-between",
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stopButton: {
    flexDirection: "row",
    backgroundColor: "#F44336",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
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
    marginLeft: 8,
  },
  emptyStateContainer: {
    padding: 24,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#F44336",
    textAlign: "center",
    margin: 20,
  },
});
