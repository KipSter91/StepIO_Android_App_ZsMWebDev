import { Platform, PermissionsAndroid } from "react-native";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";

export const requestAllPermissions = async (minimal = false) => {
  try {
    // 1. Location permission
    let locationGranted = false;
    const { status: locationStatus } =
      await Location.getForegroundPermissionsAsync();
    if (locationStatus !== "granted") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      locationGranted = status === "granted";
    } else {
      locationGranted = true;
    }

    // 2. Activity recognition (Android 10+)
    let activityGranted = true;
    if (Platform.OS === "android" && Platform.Version >= 29) {
      const activityStatus = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
      );
      if (!activityStatus) {
        if (minimal) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
          );
          activityGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
            {
              title: "Activity Recognition Permission",
              message:
                "StepIO needs activity recognition permission to count your steps.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK",
            }
          );
          activityGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        }
      }
    }

    // 3. Notification permission (Android 13+/iOS)
    let notificationGranted = true;
    if (
      (Platform.OS === "android" && Platform.Version >= 33) ||
      Platform.OS === "ios"
    ) {
      const notifStatus = await Notifications.getPermissionsAsync();
      if (notifStatus.status !== "granted" && notifStatus.granted !== true) {
        const notifReq = await Notifications.requestPermissionsAsync();
        notificationGranted =
          notifReq.status === "granted" || notifReq.granted === true;
      }
    }

    // Log results
    console.log(
      "[Permissions] Location:",
      locationGranted,
      "Activity:",
      activityGranted,
      "Notification:",
      notificationGranted
    );
    return locationGranted && activityGranted && notificationGranted;
  } catch (e) {
    console.warn("[Permissions] Error requesting permissions:", e);
    return false;
  }
};
