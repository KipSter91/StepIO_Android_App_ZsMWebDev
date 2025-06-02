import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  Circle,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { COLORS } from "../styles/theme";

// Custom dark map style for cyberpunk aesthetic
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#0F1420",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#00FFCC",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#0F1420",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8A94A6",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#131824",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#B45FFF",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#1D2235",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#00FF66",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#2B3044",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#2B3044",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#5499FF",
      },
    ],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [
      {
        color: "#5499FF",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8A94A6",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [
      {
        color: "#131824",
      },
    ],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#B45FFF",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#00FFCC",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#0F1420",
      },
    ],
  },
];

export interface LatLng {
  lat: number;
  lon: number;
  timestamp?: number;
}

interface TrackedMapProps {
  coordinates: LatLng[];
  autoCenter?: boolean;
  readOnly?: boolean;
  startMarker?: boolean;
  endMarker?: boolean;
  followUser?: boolean;
  initialRegion?: Region;
  isTrackingActive?: boolean; // New prop to control user location visibility
}

const TrackedMap = ({
  coordinates,
  autoCenter = true,
  readOnly = false,
  startMarker = true,
  endMarker = true,
  followUser = true,
  initialRegion,
  isTrackingActive = false,
}: TrackedMapProps) => {
  const mapRef = useRef<MapView>(null);
  const hasCenteredRef = useRef(false); // Optimize coordinates - reduce density for better performance while maintaining visual quality
  const optimizeCoordinates = (coords: LatLng[], maxPoints?: number) => {
    // Adaptive optimization based on route length and usage
    const totalPoints = coords.length;

    // Estimate route length (rough calculation)
    const estimatedKm = totalPoints * 0.005; // ~5 points per 25m = 200 points per km

    let targetMaxPoints;
    if (readOnly) {
      // Historical view: scale based on route length
      if (estimatedKm <= 1) targetMaxPoints = 200;
      else if (estimatedKm <= 3) targetMaxPoints = 350;
      else if (estimatedKm <= 5) targetMaxPoints = 500;
      else if (estimatedKm <= 10) targetMaxPoints = 750;
      else targetMaxPoints = 1000; // Very long routes
    } else {
      // Live tracking: more points for smoother real-time experience
      if (estimatedKm <= 1) targetMaxPoints = 300;
      else if (estimatedKm <= 3) targetMaxPoints = 500;
      else if (estimatedKm <= 5) targetMaxPoints = 800;
      else if (estimatedKm <= 10) targetMaxPoints = 1200;
      else targetMaxPoints = 1500; // Very long routes
    }

    // Override with manual parameter if provided
    if (maxPoints) targetMaxPoints = maxPoints;

    if (coords.length <= targetMaxPoints) return coords;

    // Intelligent sampling strategy
    const optimized = [];

    // Always include first point
    optimized.push(coords[0]);

    if (totalPoints <= 50) {
      // Short routes: keep all points
      return coords;
    } else if (totalPoints <= 200) {
      // Medium routes: keep every 2nd point
      for (let i = 1; i < coords.length - 1; i += 2) {
        optimized.push(coords[i]);
      }
    } else if (totalPoints <= 500) {
      // Long routes: keep every 3rd point
      for (let i = 2; i < coords.length - 1; i += 3) {
        optimized.push(coords[i]);
      }
    } else {
      // Very long routes: adaptive sampling
      const step = Math.max(2, Math.floor(totalPoints / (targetMaxPoints - 2)));
      for (let i = step; i < coords.length - 1; i += step) {
        optimized.push(coords[i]);
      }
    }

    // Always include last point
    if (coords.length > 1) {
      optimized.push(coords[coords.length - 1]);
    }

    return optimized;
  };
  // Format coordinates for react-native-maps with optimization
  const optimizedCoordinates = optimizeCoordinates(coordinates);
  const formattedCoordinates = optimizedCoordinates.map((coord) => ({
    latitude: coord.lat,
    longitude: coord.lon,
  }));

  // Debug log to monitor optimization (remove in production)
  // console.log(`Coordinates: ${coordinates.length} -> ${optimizedCoordinates.length} (${readOnly ? 'readonly' : 'live'})`);
  // Function to center the map on coordinates
  const centerMapOnCoordinates = () => {
    if (
      !mapRef.current ||
      optimizedCoordinates.length === 0 ||
      (readOnly && hasCenteredRef.current)
    )
      return;

    // Always use fitToCoordinates for better native map handling
    if (formattedCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(formattedCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: !readOnly, // Disable animation for readOnly mode to prevent shaking
      });

      if (readOnly) {
        hasCenteredRef.current = true;
      }
    }
  }; // Auto center map on coordinates if there are any
  useEffect(() => {
    if (!autoCenter || optimizedCoordinates.length === 0) return;

    // For readOnly mode (activity details), only center once when coordinates are first loaded
    if (readOnly) {
      const timer = setTimeout(() => {
        centerMapOnCoordinates();
      }, 800);
      return () => clearTimeout(timer);
    }

    // For live tracking mode, center on coordinate changes
    const timer = setTimeout(() => {
      centerMapOnCoordinates();
    }, 800);

    return () => clearTimeout(timer);
  }, [
    autoCenter,
    readOnly ? optimizedCoordinates.length > 0 : optimizedCoordinates,
  ]);
  // Additional effect to handle map ready state - only for initial load
  useEffect(() => {
    if (readOnly) {
      // Reset centering flag when coordinates change in readOnly mode
      hasCenteredRef.current = false;
    }
  }, [optimizedCoordinates.length, readOnly]);
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={initialRegion}
        showsUserLocation={!readOnly && !isTrackingActive}
        followsUserLocation={followUser && !isTrackingActive}
        showsMyLocationButton={!readOnly && !isTrackingActive}
        showsBuildings={false}
        showsIndoors={false}
        showsTraffic={false}
        showsPointsOfInterest={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        moveOnMarkerPress={false}
        onMapReady={() => {
          if (autoCenter && optimizedCoordinates.length > 0 && readOnly) {
            setTimeout(() => {
              centerMapOnCoordinates();
            }, 300);
          }
        }}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        {formattedCoordinates.length > 0 && (
          <>
            {/* Main polyline */}
            <Polyline
              coordinates={formattedCoordinates}
              strokeWidth={2}
              strokeColor={COLORS.secondary}
            />
            {/* Start point indicator - Native markers for all modes */}
            {startMarker && formattedCoordinates.length > 0 && (
              <Marker
                coordinate={formattedCoordinates[0]}
                pinColor={COLORS.success}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
              />
            )}
            {/* End point indicator - Native markers for all modes */}
            {endMarker && formattedCoordinates.length > 1 && (
              <Marker
                coordinate={
                  formattedCoordinates[formattedCoordinates.length - 1]
                }
                pinColor={COLORS.danger}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
              />
            )}
          </>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default React.memo(TrackedMap);
