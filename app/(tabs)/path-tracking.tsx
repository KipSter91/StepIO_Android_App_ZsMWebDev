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
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useStepStore from "../../src/store/useStepStore";
import TrackedMap from "../../components/TrackedMap";
import * as TaskManager from "expo-task-manager";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";
import { nativeStepCounterService } from "../../src/services/nativeStepCounterService";
import { Region } from "react-native-maps";

const LOCATION_TASK_NAME = "location-tracking";

// Helper function to calculate distance between two coordinates (Haversine formula)
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

// Background location tracking task
TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: TaskManager.TaskManagerTaskBody<any>) => {
    if (error) {
      // Error in location task
      return;
    }
    if (data && data.locations) {
      const { locations } = data;
      // Background location update received

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
            // Skipping invalid background location
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
            // Only add if moved at least 3 meters
            if (distance < 0.003) {
              continue;
            }
          }
          // Limit coordinates to prevent memory issues
          const currentCoords = store.activeSession.coordinates || [];
          let updatedCoords = [...currentCoords, newCoord];

          // If we have too many coordinates, use intelligent sampling
          if (updatedCoords.length > 1000) {
            const first = updatedCoords[0];
            const recent = updatedCoords.slice(-400);
            const middle = updatedCoords.slice(1, -400);
            const sampled = middle.filter((_, index) => index % 3 === 0);
            updatedCoords = [first, ...sampled, ...recent];
          }

          // Update the active session with new coordinate
          store.updateActiveSession({
            coordinates: updatedCoords,
          });
        }
      } else {
        // No active session, ignoring background location
      }
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
  }, [isTracking]);

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
      // Starting step counter
      const initializeSessionSteps = async () => {
        try {
          const currentSteps = await nativeStepCounterService.getTodaySteps();
          const currentCalories =
            await nativeStepCounterService.getTodayCalories();
          setSessionStartSteps(currentSteps);
          setSessionSteps(0);
          // Update the active session with the baseline
          const currentState = useStepStore.getState();
          if (currentState.activeSession && currentState.isTracking) {
            currentState.updateActiveSession({
              sessionStartSteps: currentSteps,
              sessionStartCalories: currentCalories,
              steps: 0,
              calories: 0,
            });
          }
        } catch (error) {
          // Error initializing session steps
        }
      };
      // Create step update callback for real-time updates when app is active
      const handleStepUpdate = (
        steps: number,
        calories?: number,
        timestamp?: number
      ) => {
        // Step update received
        const currentState = useStepStore.getState();
        const currentStartSteps =
          currentState.activeSession?.sessionStartSteps || 0;
        const currentStartCalories =
          currentState.activeSession?.sessionStartCalories || 0;
        if (currentStartSteps > 0) {
          // Calculate session steps
          const currentSessionSteps = Math.max(0, steps - currentStartSteps);
          // Calculate session calories (if calories provided, otherwise estimate from steps)
          const currentSessionCalories = calories
            ? Math.max(0, calories - currentStartCalories)
            : currentSessionSteps * 0.04;
          setSessionSteps(currentSessionSteps);
          // Update active session with step data
          if (currentState.activeSession && currentState.isTracking) {
            currentState.updateActiveSession({
              steps: currentSessionSteps,
              calories: currentSessionCalories,
            });
          }
        }
      };
      stepUpdateCallback.current = handleStepUpdate;
      nativeStepCounterService.onStepUpdate(handleStepUpdate);
      nativeStepCounterService.startTracking();
      backgroundStepInterval = setInterval(async () => {
        try {
          // Background step monitoring
          const currentState = useStepStore.getState();
          if (currentState.activeSession && currentState.isTracking) {
            const currentSteps = await nativeStepCounterService.getTodaySteps();
            const currentCalories =
              await nativeStepCounterService.getTodayCalories();
            const sessionStartSteps =
              currentState.activeSession.sessionStartSteps || 0;
            const sessionStartCalories =
              currentState.activeSession.sessionStartCalories || 0;
            if (sessionStartSteps > 0) {
              const currentSessionSteps = Math.max(
                0,
                currentSteps - sessionStartSteps
              );
              const currentSessionCalories = Math.max(
                0,
                currentCalories - sessionStartCalories
              );
              setSessionSteps(currentSessionSteps);
              currentState.updateActiveSession({
                steps: currentSessionSteps,
                calories: currentSessionCalories,
              });
            }
          }
        } catch (error) {
          // Error in background step monitoring
        }
      }, 1000);
      initializeSessionSteps();
    } else {
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
      setSessionSteps(0);
      setSessionStartSteps(0);
    }
    return () => {
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
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 5000,
        distanceInterval: 3,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "StepIO is tracking your path",
          notificationBody: "Keep the app open for best results",
        },
      });
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
      locationWatcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000,
          distanceInterval: 3,
        },
        (location) => {
          // New location received
          if (
            !location.coords.latitude ||
            !location.coords.longitude ||
            isNaN(location.coords.latitude) ||
            isNaN(location.coords.longitude) ||
            (location.coords.accuracy && location.coords.accuracy > 100)
          ) {
            // Skip locations with poor accuracy (>100m)
            return;
          }
          const currentState = useStepStore.getState();
          const currentSession = currentState.activeSession;
          if (currentSession && currentState.isTracking) {
            const newCoord = {
              lat: location.coords.latitude,
              lon: location.coords.longitude,
              timestamp: location.timestamp,
            };
            const lastCoord =
              currentSession.coordinates?.[
                currentSession.coordinates.length - 1
              ];
            const now = Date.now();
            if (now - lastLocationUpdateRef.current < 3000) {
              // Throttling location update
              return;
            }
            if (lastCoord) {
              const distance = calculateDistance(
                lastCoord.lat,
                lastCoord.lon,
                newCoord.lat,
                newCoord.lon
              );
              if (distance < 0.003) {
                // Too close to previous coordinate
                return;
              }
            }
            lastLocationUpdateRef.current = now;
            // Limit coordinates to prevent memory issues (max 1000 points for better visual quality)
            const currentCoords = currentSession.coordinates || [];
            let updatedCoords = [...currentCoords, newCoord];

            // If we have too many coordinates, use intelligent sampling
            if (updatedCoords.length > 1000) {
              const first = updatedCoords[0];
              const recent = updatedCoords.slice(-400); // Keep last 400 points for smooth current tracking
              const middle = updatedCoords.slice(1, -400);

              // Sample middle section more intelligently - keep every 3rd point
              const sampled = middle.filter((_, index) => index % 3 === 0);

              updatedCoords = [first, ...sampled, ...recent];
            }

            // Add coordinate to session
            currentState.updateActiveSession({
              coordinates: updatedCoords,
            });
          } else {
            // No active session or not tracking, ignoring location update
          }
        }
      );
    } catch (err) {
      setErrorMsg("Failed to start location tracking");
    }
  };
  // Handle start tracking button press
  const handleStartTracking = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Reset throttling
      lastLocationUpdateRef.current = 0;
      startTracking();
      await startLocationUpdates();
    } catch (error) {
      Alert.alert("Error", "Failed to start path tracking");
    }
  };
  // State for save confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [pendingStop, setPendingStop] = useState(false);
  // Helper to check if session is too short/insignificant
  const isSessionTooShort = () => {
    if (!activeSession) return false;
    const steps = activeSession.steps || 0;
    const coords = activeSession.coordinates || [];
    const distance = calculateTotalDistance(coords);
    const duration = (Date.now() - activeSession.startTime) / 1000;
    return steps < 100 || distance < 0.1 || duration < 60 || coords.length < 5;
  };
  // Modified stop tracking handler
  const handleStopTracking = async () => {
    if (isSessionTooShort()) {
      setConfirmModalMessage(
        "This walk was very short. Do you want to save it, or would you rather delete it?"
      );
      setShowConfirmModal(true);
      setPendingStop(true);
      return;
    }
    await actuallyStopTracking();
  };

  // Actual stop logic
  const actuallyStopTracking = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const currentSession = activeSession;
      if (currentSession) {
        const actualDistance = calculateTotalDistance(
          currentSession.coordinates || []
        );
        updateActiveSession({ distance: actualDistance });
      }
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }
      stopTracking();
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsMapLoading(true);
      getUserLocation();
    } catch (error) {
      Alert.alert("Error", "Failed to stop path tracking");
    }
  };
  // Add this helper to discard session without saving
  const discardSession = async () => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove();
      locationWatcherRef.current = null;
    }
    // Clear active session and tracking state, do not save
    updateActiveSession({});
    // Also set activeSession to null and isTracking to false
    useStepStore.getState().updateActiveSession({});
    // Use stopTracking but prevent it from saving: manually clear state
    // (stopTracking in store saves, so we avoid calling it here)
    // Instead, clear activeSession and isTracking directly
    useStepStore.setState({ activeSession: null, isTracking: false });
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    setIsMapLoading(true);
    getUserLocation();
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
            isTrackingActive={isTracking}
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
                    ).toFixed(1)}{" "}
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
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.buttonGradient}>
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
              style={styles.buttonGradient}>
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
      {/* Confirm Save Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={styles.modalContent}>
                <Ionicons
                  name="warning"
                  size={48}
                  color={COLORS.danger}
                  style={styles.modalIcon}
                />
                <Text style={styles.modalTitle}>Are you sure?</Text>
                <Text style={styles.modalMessage}>{confirmModalMessage}</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={async () => {
                      setShowConfirmModal(false);
                      setPendingStop(false);
                      if (isTracking && activeSession) {
                        await actuallyStopTracking();
                      }
                    }}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.buttonGradient}>
                      <Text style={styles.modalButtonPrimaryText}>
                        Save Anyway
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={async () => {
                      setShowConfirmModal(false);
                      setPendingStop(false);
                      await discardSession();
                    }}>
                    <LinearGradient
                      colors={["#ff4757", "#ff3838"]}
                      style={styles.modalButtonPrimary}>
                      <Text style={styles.modalButtonPrimaryText}>
                        Delete Session
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setShowConfirmModal(false);
                      setPendingStop(false);
                    }}>
                    <View style={styles.modalButtonSecondary}>
                      <Text style={styles.modalButtonSecondaryText}>
                        Cancel
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
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
  },
  stopButton: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    overflow: "hidden",
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
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  modalGradient: {
    padding: SPACING.xl,
  },
  modalContent: {
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.darkMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  modalButtons: {
    flexDirection: "column",
    gap: SPACING.md,
    width: "100%",
  },
  modalButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  modalButtonSecondary: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  modalButtonPrimary: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    borderRadius: 12,
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});
