import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useStepStore from "../../src/store/useStepStore";
import TrackedMap from "../../components/TrackedMap";
import * as TaskManager from "expo-task-manager";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";
import { nativeStepCounterService } from "../../src/services/nativeStepCounterService";
import { Region } from "react-native-maps";

const LOCATION_TASK_NAME = "location-tracking";

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Background location tracking task
TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: TaskManager.TaskManagerTaskBody<any>) => {
    if (error) {
      console.error("[TaskManager] Location task error:", error);
      return;
    }
    if (data && data.locations) {
      const { locations } = data;
      console.log(
        "[TaskManager] Background location update received:",
        locations.length,
        "locations"
      );

      // Get current store state
      const store = useStepStore.getState();
      if (store.activeSession && store.isTracking) {
        for (const location of locations) {
          // Validate location data
          if (
            !location.coords.latitude ||
            !location.coords.longitude ||
            isNaN(location.coords.latitude) ||
            isNaN(location.coords.longitude) ||
            (location.coords.accuracy && location.coords.accuracy > 100)
          ) {
            console.log("[TaskManager] Skipping invalid background location");
            continue;
          }
          const newCoord = {
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            timestamp: location.timestamp,
          };

          // Check distance from last coordinate to avoid GPS noise
          const lastCoord =
            store.activeSession.coordinates?.[
              store.activeSession.coordinates.length - 1
            ];

          if (lastCoord) {
            const distance = calculateDistance(
              lastCoord.lat,
              lastCoord.lon,
              newCoord.lat,
              newCoord.lon
            );
            // Only add if moved at least 2 meters (for testing)
            if (distance < 0.002) {
              console.log(
                "[TaskManager] Skipping coordinate - too close to previous one:",
                distance * 1000,
                "m"
              );
              continue;
            }
          }

          console.log("[TaskManager] Adding background coordinate:", newCoord);

          // Update the active session with new coordinate
          store.updateActiveSession({
            coordinates: [...(store.activeSession.coordinates || []), newCoord],
          });
        }
      } else {
        console.log(
          "[TaskManager] No active session, ignoring background location"
        );
      }
    }
    return Promise.resolve();
  }
);

// Removed unused step tracking task to prevent memory leaks

export default function PathTrackingScreen() {
  const {
    activeSession,
    isTracking,
    startTracking,
    stopTracking,
    updateActiveSession,
  } = useStepStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationUpdateRef = useRef<number>(0);
  // Dummy state for timer re-render
  const [, setTick] = useState(0);
  // Timer and step counter states
  const [sessionSteps, setSessionSteps] = useState<number>(0);
  const [sessionStartSteps, setSessionStartSteps] = useState<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepUpdateCallback = useRef<
    ((steps: number, calories?: number, timestamp?: number) => void) | null
  >(null);

  // Fade effect for info card
  const infoOpacity = useRef(new Animated.Value(1)).current;
  const [showTracking, setShowTracking] = useState(isTracking);
  const [initialRegion, setInitialRegion] = useState<Region | undefined>(
    undefined
  );
  const [isMapLoading, setIsMapLoading] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  // Get the user's position when the component loads
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005, // Zoom in closer
          longitudeDelta: 0.005,
        });
      }
      setIsMapLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      setIsMapLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    // Fade out
    Animated.timing(infoOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowTracking(isTracking);
      // Fade in
      Animated.timing(infoOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [isTracking]); // Pulsing animation for the icon
  useEffect(() => {
    if (isMapLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shimmerAnim.setValue(0);
    }
  }, [isMapLoading]);

  // Calculate elapsed time for timer (drift-free)
  const elapsed =
    isTracking && activeSession
      ? Math.floor((Date.now() - activeSession.startTime) / 1000)
      : 0;
  // Real-time timer effect - drift-free
  useEffect(() => {
    if (isTracking && activeSession) {
      timerIntervalRef.current = setInterval(() => {
        setTick((t) => t + 1); // Just trigger re-render
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTracking, activeSession]);
  // Step counter effect with background monitoring
  useEffect(() => {
    let backgroundStepInterval: ReturnType<typeof setInterval> | null = null;

    if (isTracking) {
      console.log("[PathTracking] Starting step counter...");

      // Initialize session with current step count as baseline
      const initializeSessionSteps = async () => {
        try {
          const currentSteps = await nativeStepCounterService.getTodaySteps();
          console.log(
            "[PathTracking] Initializing session with current steps:",
            currentSteps
          );

          setSessionStartSteps(currentSteps);
          setSessionSteps(0);

          // Update the active session with the baseline
          const currentState = useStepStore.getState();
          if (currentState.activeSession && currentState.isTracking) {
            currentState.updateActiveSession({
              sessionStartSteps: currentSteps,
              steps: 0,
            });
          }
        } catch (error) {
          console.error(
            "[PathTracking] Error initializing session steps:",
            error
          );
        }
      }; // Create step update callback for real-time updates when app is active
      const handleStepUpdate = (
        steps: number,
        calories?: number,
        timestamp?: number
      ) => {
        console.log("[PathTracking] Step update received:", {
          steps,
          calories,
          timestamp,
        });

        // Get current sessionStartSteps from store instead of stale closure
        const currentState = useStepStore.getState();
        const currentStartSteps =
          currentState.activeSession?.sessionStartSteps || 0;

        if (currentStartSteps > 0) {
          // Calculate session steps
          const currentSessionSteps = Math.max(0, steps - currentStartSteps);
          setSessionSteps(currentSessionSteps);

          console.log("[PathTracking] Session steps calculated:", {
            totalSteps: steps,
            startSteps: currentStartSteps,
            sessionSteps: currentSessionSteps,
          });

          // Update active session with step data
          if (currentState.activeSession && currentState.isTracking) {
            currentState.updateActiveSession({
              steps: currentSessionSteps,
              calories: calories || 0,
            });
          }
        }
      };

      // Store callback reference
      stepUpdateCallback.current = handleStepUpdate;

      // Subscribe to step updates for real-time updates
      nativeStepCounterService.onStepUpdate(handleStepUpdate);

      // Start step tracking
      nativeStepCounterService.startTracking();

      // Background interval for step monitoring (works even when app is backgrounded)
      backgroundStepInterval = setInterval(async () => {
        try {
          console.log("[PathTracking] Background step monitoring...");

          // Get current store state
          const currentState = useStepStore.getState();

          if (currentState.activeSession && currentState.isTracking) {
            // Get current step count from native service
            const currentSteps = await nativeStepCounterService.getTodaySteps();
            const currentCalories =
              await nativeStepCounterService.getTodayCalories();

            const sessionStartSteps =
              currentState.activeSession.sessionStartSteps || 0;

            if (sessionStartSteps > 0) {
              const currentSessionSteps = Math.max(
                0,
                currentSteps - sessionStartSteps
              );

              console.log("[PathTracking] Background session steps update:", {
                currentSteps,
                sessionStartSteps,
                currentSessionSteps,
              });

              // Update local state
              setSessionSteps(currentSessionSteps);

              // Update active session with step data
              currentState.updateActiveSession({
                steps: currentSessionSteps,
                calories: currentCalories,
              });
            }
          }
        } catch (error) {
          console.error(
            "[PathTracking] Error in background step monitoring:",
            error
          );
        }
      }, 1000); // Update every 1 second

      // Initialize session baseline
      initializeSessionSteps();

      console.log(
        "[PathTracking] Step tracking and background monitoring started"
      );
    } else {
      // Stop step counting
      if (stepUpdateCallback.current) {
        nativeStepCounterService.removeStepUpdateListener(
          stepUpdateCallback.current
        );
        stepUpdateCallback.current = null;
      }

      // Clear background interval
      if (backgroundStepInterval) {
        clearInterval(backgroundStepInterval);
        backgroundStepInterval = null;
      }

      // Reset step states
      setSessionSteps(0);
      setSessionStartSteps(0);

      console.log("[PathTracking] Step tracking stopped");
    }

    return () => {
      // Cleanup on dependency change or unmount
      if (stepUpdateCallback.current) {
        nativeStepCounterService.removeStepUpdateListener(
          stepUpdateCallback.current
        );
        stepUpdateCallback.current = null;
      }

      if (backgroundStepInterval) {
        clearInterval(backgroundStepInterval);
        backgroundStepInterval = null;
      }
    };
  }, [isTracking]); // Removed sessionStartSteps from deps

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
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
    };
  }, []); // Start location tracking
  const startLocationUpdates = async () => {
    try {
      console.log("[PathTracking] Starting location updates...");
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 5000, // 5 seconds for testing
        distanceInterval: 2, // minimum distance in meters (for testing)
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "StepIO is tracking your path",
          notificationBody: "Keep the app open for best results",
        },
      });

      console.log("[PathTracking] TaskManager location updates started");

      // Subscribe to location updates with proper cleanup
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
      locationWatcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000, // 5 seconds for testing
          distanceInterval: 2, // 2 meters for testing
        },
        (location) => {
          console.log("[PathTracking] New location received:", {
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy,
          });

          // Validate location data
          if (
            !location.coords.latitude ||
            !location.coords.longitude ||
            isNaN(location.coords.latitude) ||
            isNaN(location.coords.longitude) ||
            (location.coords.accuracy && location.coords.accuracy > 100)
          ) {
            // Skip locations with poor accuracy (>100m)
            console.log(
              "[PathTracking] Skipping invalid or inaccurate location"
            );
            return;
          }

          // Get current session from store to avoid stale closure
          const currentState = useStepStore.getState();
          const currentSession = currentState.activeSession;

          if (currentSession && currentState.isTracking) {
            const newCoord = {
              lat: location.coords.latitude,
              lon: location.coords.longitude,
              timestamp: location.timestamp,
            };

            // Check if this coordinate is significantly different from the last one
            const lastCoord =
              currentSession.coordinates?.[
                currentSession.coordinates.length - 1
              ];
            const now = Date.now(); // Throttle updates to max once every 3 seconds for testing
            if (now - lastLocationUpdateRef.current < 3000) {
              console.log("[PathTracking] Throttling location update");
              return;
            }

            if (lastCoord) {
              const distance = calculateDistance(
                lastCoord.lat,
                lastCoord.lon,
                newCoord.lat,
                newCoord.lon
              );

              // Only add if moved at least 2 meters (for testing)
              if (distance < 0.002) {
                // 2 meters in km
                console.log(
                  "[PathTracking] Skipping coordinate - too close to previous one:",
                  distance * 1000,
                  "m"
                );
                return;
              }
            }

            lastLocationUpdateRef.current = now;

            console.log(
              "[PathTracking] Adding coordinate to session:",
              newCoord
            );
            console.log(
              "[PathTracking] Current coordinates count:",
              currentSession.coordinates?.length || 0
            );

            // Update active session with new coordinate
            currentState.updateActiveSession({
              coordinates: [...(currentSession.coordinates || []), newCoord],
            });
          } else {
            console.log(
              "[PathTracking] No active session or not tracking, ignoring location update"
            );
          }
        }
      );

      console.log("[PathTracking] Location watcher started successfully");
    } catch (err) {
      console.error("Failed to start location tracking", err);
      setErrorMsg("Failed to start location tracking");
    }
  };
  // Handle start tracking button press
  const handleStartTracking = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log("[PathTracking] Starting tracking...");

      // Reset throttling
      lastLocationUpdateRef.current = 0;

      // Start tracking in our store
      startTracking();

      // Start location updates
      await startLocationUpdates();
    } catch (error) {
      console.error("Error starting tracking:", error);
      Alert.alert("Error", "Failed to start path tracking");
    }
  }; // Handle stop tracking button press
  const handleStopTracking = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      console.log("[PathTracking] Stopping tracking...");
      // Get current session data before stopping
      const currentSession = activeSession;
      if (currentSession) {
        const sessionDuration = (Date.now() - currentSession.startTime) / 1000;
        const coordinatesCount = currentSession.coordinates?.length || 0;
        const actualDistance = calculateTotalDistance(
          currentSession.coordinates || []
        );

        console.log("=== SESSION COMPLETED ===");
        console.log("Session ID:", currentSession.id);
        console.log(
          "Start Time:",
          new Date(currentSession.startTime).toISOString()
        );
        console.log("End Time:", new Date().toISOString());
        console.log("Duration (seconds):", sessionDuration);
        console.log("Total Steps:", currentSession.steps);
        console.log("Coordinates Count:", coordinatesCount);
        console.log("Distance (calculated):", actualDistance.toFixed(3), "km");
        console.log("=== COORDINATES DATA ===");

        if (
          currentSession.coordinates &&
          currentSession.coordinates.length > 0
        ) {
          console.log("First coordinate:", currentSession.coordinates[0]);
          console.log(
            "Last coordinate:",
            currentSession.coordinates[coordinatesCount - 1]
          );
          console.log(
            "All coordinates:",
            JSON.stringify(currentSession.coordinates, null, 2)
          );
        } else {
          console.log("No coordinates collected during this session");
        }

        console.log("=== END SESSION DATA ===");
      }

      // Stop location watcher
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
        console.log("[PathTracking] Location watcher stopped");
      }

      // Stop tracking in our store (this will also log the completed session)
      stopTracking();

      // Stop location updates
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("[PathTracking] TaskManager location updates stopped"); // NEW: shimmer and reinitialization
      setIsMapLoading(true);
      getUserLocation();
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
        {isMapLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.iconWrapper}>
              <MaterialIcons
                name="explore"
                size={48}
                color={COLORS.primary}
              />
              <Animated.View
                style={[
                  styles.spinner,
                  {
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                    transform: [
                      {
                        scale: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
            <Text style={styles.loadingText}>Map is loading...</Text>
          </View>
        ) : (
          <TrackedMap
            coordinates={activeSession?.coordinates || []}
            autoCenter={isTracking}
            readOnly={false}
            followUser={isTracking}
            initialRegion={initialRegion}
          />
        )}
      </View>
      {/* Tracking info card */}
      <View style={styles.statsCard}>
        <LinearGradient
          colors={GRADIENTS.storyCard}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Animated.View style={{ opacity: infoOpacity, width: "100%" }}>
            {showTracking ? (
              <View style={styles.trackingInfoRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>
                    {formatDuration(elapsed)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Steps</Text>
                  <Text style={styles.statValue}>{sessionSteps}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>
                    {calculateTotalDistance(
                      activeSession?.coordinates || []
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
        </LinearGradient>
      </View>
      {/* Start/Stop button */}
      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTracking}>
            <LinearGradient
              colors={GRADIENTS.primaryToSecondary}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <MaterialIcons
                name="play-arrow"
                size={28}
                color={"#fff"}
              />
              <Text style={styles.buttonText}>Start Tracking</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopTracking}>
            <LinearGradient
              colors={["#ff4757", "#ff3838"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <MaterialIcons
                name="stop"
                size={28}
                color={"#fff"}
              />
              <Text style={styles.buttonText}>Stop Tracking</Text>
            </LinearGradient>
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

// Helper function to calculate total distance from coordinates array
function calculateTotalDistance(
  coordinates: { lat: number; lon: number; timestamp: number }[]
): number {
  if (!coordinates || coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    totalDistance += calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
  }

  return totalDistance;
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
    opacity: 0.6,
  },
  mapContainer: {
    flex: 1,
    top: 20,
  },
  statsCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: SPACING.lg,
    marginTop: -32,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    position: "relative",
    minHeight: 140,
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
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
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    overflow: "hidden",
    // Removed shadow and elevation for a cleaner look
  },
  stopButton: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    overflow: "hidden",
    // Removed shadow and elevation for a cleaner look
  },
  buttonGradient: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
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
  }, // Loading effect styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(29, 34, 53, 0.9)",
    margin: SPACING.lg,
    borderRadius: 16,
    gap: SPACING.md,
  },
  iconWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: `${COLORS.primary}20`,
    borderTopColor: COLORS.primary,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.darkMuted,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
});
