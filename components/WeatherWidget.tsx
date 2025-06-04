import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Location from "expo-location";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../styles/theme";
import Constants from "expo-constants";

// Type definitions for our weather data
export interface WeatherData {
  temperature: number;
  weatherCondition: string;
  description: string;
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  location: string;
  maxTemp: number;
  minTemp: number;
  iconUri?: string;
}

// Define a type for valid Ionicons names to be used in the weather map
type WeatherIconName =
  | "sunny"
  | "partly-sunny"
  | "cloudy"
  | "cloud"
  | "rainy"
  | "snow"
  | "thunderstorm"
  | "help-outline";

// Map of Google Weather API condition types to weather icons and descriptions
export const weatherConditionMap: Record<
  string,
  { icon: WeatherIconName; description: string }
> = {
  CLEAR: { icon: "sunny", description: "Clear sky" },
  MOSTLY_CLEAR: { icon: "partly-sunny", description: "Clear with periodic clouds" },
  PARTLY_CLOUDY: { icon: "partly-sunny", description: "Partly cloudy" },
  CLOUDY: { icon: "cloudy", description: "Cloudy" },
  FOG: { icon: "cloud", description: "Fog" },
  HAZE: { icon: "cloud", description: "Haze" },
  MIST: { icon: "cloud", description: "Mist" },
  DRIZZLE: { icon: "rainy", description: "Drizzle" },
  RAIN: { icon: "rainy", description: "Rain" },
  SHOWERS: { icon: "rainy", description: "Showers" },
  SNOW: { icon: "snow", description: "Snow" },
  SLEET: { icon: "snow", description: "Sleet" },
  HAIL: { icon: "snow", description: "Hail" },
  THUNDERSTORM: { icon: "thunderstorm", description: "Thunderstorm" },
  TORNADO: { icon: "thunderstorm", description: "Tornado" },
  HURRICANE: { icon: "thunderstorm", description: "Hurricane" },
  TROPICAL_STORM: { icon: "thunderstorm", description: "Tropical storm" },
  WINDY: { icon: "cloudy", description: "Windy" },
  DUST: { icon: "cloud", description: "Dust" },
  SMOKE: { icon: "cloud", description: "Smoke" },
};

interface WeatherWidgetProps {
  onWeatherDataUpdate?: (data: WeatherData) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  onWeatherDataUpdate,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Animation value for shimmer effect
  const shimmerAnim = useSharedValue(0);

  // Animated style for shimmer effect
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      opacity: shimmerAnim.value,
    };
  });
  // Function to get location and fetch weather data
  const getWeatherData = async () => {
    try {
      setLoading(true); // Get Google API key from environment
      const apiKey =
        Constants.expoConfig?.extra?.googleApiKey || process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        setError("Google API key not configured");
        setLoading(false);
        return;
      }

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission not granted");
        setLoading(false);
        return;
      }

      // Get current location with low accuracy and longer cache time
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });
      // Fetch weather data from Google Weather API
      const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${location.coords.latitude}&location.longitude=${location.coords.longitude}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }
      const data = await response.json();

      // Get city/location name using reverse geocoding
      const geocodeResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName =
        geocodeResponse[0]?.city ||
        geocodeResponse[0]?.district ||
        geocodeResponse[0]?.subregion ||
        "Unknown Location";

      if (data && data.temperature) {
        const weatherConditionType = data.weatherCondition?.type || "CLEAR";
        const weatherData: WeatherData = {
          temperature: Math.round(data.temperature.degrees),
          weatherCondition: weatherConditionType,
          description:
            data.weatherCondition?.description?.text ||
            weatherConditionMap[weatherConditionType]?.description ||
            "Unknown",
          feelsLike: Math.round(
            data.feelsLikeTemperature?.degrees || data.temperature.degrees
          ),
          windSpeed: Math.round(data.wind?.speed?.value || 0),
          humidity: data.relativeHumidity || 0,
          location: locationName,
          maxTemp: Math.round(
            data.currentConditionsHistory?.maxTemperature?.degrees ||
              data.temperature.degrees
          ),
          minTemp: Math.round(
            data.currentConditionsHistory?.minTemperature?.degrees ||
              data.temperature.degrees
          ),
          iconUri: data.weatherCondition?.iconBaseUri,
        };

        setWeather(weatherData);

        // Call the callback prop with the weather data
        if (onWeatherDataUpdate) {
          onWeatherDataUpdate(weatherData);
        }
      } else {
        setError("Could not fetch weather data");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Error fetching weather data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start shimmer animation when loading
    if (loading) {
      shimmerAnim.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [loading, shimmerAnim]);

  useEffect(() => {
    // Initial fetch of weather data
    getWeatherData();

    // Set interval to update weather data every 10 minutes
    intervalRef.current = setInterval(getWeatherData, 600000);

    // Clear interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  // Get weather icon and description based on weather condition
  const getWeatherIcon = (): WeatherIconName => {
    if (!weather) return "help-outline";
    return (
      weatherConditionMap[weather.weatherCondition]?.icon || "help-outline"
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="cloud-offline"
          size={20}
          color={COLORS.darkMuted}
        />
        <Text style={styles.errorText}>Weather unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.storyCard}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        {loading ? (
          // Shimmer effect while loading
          <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
            <LinearGradient
              colors={["rgba(30, 36, 50, 0.8)", "rgba(18, 21, 30, 0.6)"]}
              style={styles.shimmerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons
                name="cloudy-outline"
                size={24}
                color={COLORS.darkMuted}
                style={{ opacity: 0.5 }}
              />
              <Text style={styles.shimmerText}>Loading weather data...</Text>
            </LinearGradient>
          </Animated.View>
        ) : (
          // Weather content when loaded
          <View>
            {/* Header with location and current temperature */}
            <View style={styles.header}>
              <View style={styles.locationContainer}>
                <Ionicons
                  name="location"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.locationText}>{weather?.location}</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.temperature}>{weather?.temperature}°C</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => {
                    setLoading(true);
                    getWeatherData();
                  }}>
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Weather icon and description */}
            <View style={styles.mainContent}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.iconBackground}>
                  <Ionicons
                    name={getWeatherIcon()}
                    size={28}
                    color={COLORS.white}
                  />
                </LinearGradient>
              </View>

              <View style={styles.weatherTextInfo}>
                <Text style={styles.descriptionText}>
                  {weather?.description}
                </Text>
                <Text style={styles.feelsLike}>
                  Feels like {weather?.feelsLike}°C
                </Text>
                <View style={styles.highLowContainer}>
                  <Ionicons
                    name="arrow-up"
                    size={12}
                    color={COLORS.neonPink}
                  />
                  <Text style={styles.highLowText}>{weather?.maxTemp}°</Text>
                  <Ionicons
                    name="arrow-down"
                    size={12}
                    color={COLORS.neonBlue}
                  />
                  <Text style={styles.highLowText}>{weather?.minTemp}°</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Additional weather details */}
            <View style={styles.detailsContainer}>
              {/* Wind */}
              <View style={styles.detailItem}>
                <Ionicons
                  name="speedometer-outline"
                  size={20}
                  color={COLORS.accent}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>WIND</Text>
                  <Text style={styles.detailValue}>
                    {weather?.windSpeed} km/h
                  </Text>
                </View>
              </View>

              {/* Humidity */}
              <View style={styles.detailItem}>
                <Ionicons
                  name="water-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>HUMIDITY</Text>
                  <Text style={styles.detailValue}>{weather?.humidity}%</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  gradient: {
    padding: SPACING.md,
    borderRadius: 16,
  },
  // Header section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  temperature: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.white,
    marginRight: SPACING.sm,
  },
  refreshButton: {
    padding: SPACING.xs,
  },

  // Main content section
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    marginRight: SPACING.md,
  },
  iconBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  weatherTextInfo: {
    flex: 1,
  },
  descriptionText: {
    fontSize: FONTS.sizes.md,
    fontWeight: "500",
    color: COLORS.white,
  },
  feelsLike: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkMuted,
    marginTop: 2,
  },
  highLowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  highLowText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkMuted,
    marginLeft: 4,
    marginRight: SPACING.sm,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "rgba(156, 163, 175, 0.2)",
    marginVertical: SPACING.sm,
  },

  // Details section
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xs,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailTextContainer: {
    marginLeft: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkMuted,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: "500",
  },

  // Loading and error states
  shimmerContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  shimmerGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  shimmerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
    marginTop: SPACING.sm,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
    backgroundColor: "rgba(19, 24, 36, 0.5)",
    borderRadius: 16,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkMuted,
    marginLeft: SPACING.xs,
  },
});
