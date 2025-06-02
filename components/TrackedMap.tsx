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
  const hasCenteredRef = useRef(false);
  // Format coordinates for react-native-maps
  const formattedCoordinates = coordinates.map((coord) => ({
    latitude: coord.lat,
    longitude: coord.lon,
  }));

  // Function to center the map on coordinates
  const centerMapOnCoordinates = () => {
    if (
      !mapRef.current ||
      coordinates.length === 0 ||
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
  };
  // Auto center map on coordinates if there are any
  useEffect(() => {
    if (!autoCenter || coordinates.length === 0) return;

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
  }, [autoCenter, readOnly ? coordinates.length > 0 : coordinates]);
  // Additional effect to handle map ready state - only for initial load
  useEffect(() => {
    if (readOnly) {
      // Reset centering flag when coordinates change in readOnly mode
      hasCenteredRef.current = false;
    }
  }, [coordinates.length, readOnly]);
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
        onMapReady={() => {
          if (autoCenter && coordinates.length > 0 && readOnly) {
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

export default TrackedMap;
