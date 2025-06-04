// app.config.js
import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "StepIO",
  slug: "StepIO",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "android.permission.ACTIVITY_RECOGNITION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
    ],
    package: "com.kipster91.stepio",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0F1420",
        image: "./assets/images/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "5e9880ad-dc2f-477d-a29c-1f15d7158d81",
    },
    googleApiKey: process.env.GOOGLE_API_KEY,
  },
});
