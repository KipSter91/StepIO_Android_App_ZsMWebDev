import { Platform } from "react-native";
import * as Location from "expo-location";

export async function requestAllPermissions() {
  try {
    // Request location permissions
    const locationPermission =
      await Location.requestForegroundPermissionsAsync();
    console.log("Location permission:", locationPermission.status);

    if (Platform.OS === "android") {
      // Dynamically require PermissionsAndroid only on Android
      const { PermissionsAndroid } = require("react-native");
      try {
        const activityRecognitionPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: "Physical Activity Permission",
            message:
              "StepIO needs access to your physical activity to count steps.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        console.log(
          "Activity recognition permission:",
          activityRecognitionPermission
        );

        // Request background location permission if needed for tracking
        if (locationPermission.status === "granted") {
          const backgroundLocationPermission =
            await Location.requestBackgroundPermissionsAsync();
          console.log(
            "Background location permission:",
            backgroundLocationPermission.status
          );
        }
      } catch (err) {
        console.warn("Error requesting Android permissions:", err);
      }
    }
  } catch (err) {
    console.warn("Error requesting permissions:", err);
  }
}
