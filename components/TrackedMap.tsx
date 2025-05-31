import React, { useEffect, useRef } from "react";
import { RootTagContext, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
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

  // Format coordinates for react-native-maps
  const formattedCoordinates = coordinates.map((coord) => ({
    latitude: coord.lat,
    longitude: coord.lon,
  }));

  // Auto center map on coordinates if there are any
  useEffect(() => {
    if (!autoCenter || coordinates.length === 0 || !mapRef.current) return;

    // Fit to coordinates
    mapRef.current.fitToCoordinates(formattedCoordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  }, [autoCenter, coordinates, formattedCoordinates]);
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
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        {formattedCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={formattedCoordinates}
              strokeWidth={2}
              strokeColor={COLORS.primary}
            />
            {startMarker && formattedCoordinates.length > 0 && (
              <Marker
                coordinate={formattedCoordinates[0]}
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0, y: 0 }}>
                <View style={[styles.markerContainer, styles.startMarker]}>
                  <MaterialIcons
                    name="play-arrow"
                    size={16}
                    color="#fff"
                  />
                </View>
              </Marker>
            )}
            {endMarker && formattedCoordinates.length > 1 && (
              <Marker
                coordinate={
                  formattedCoordinates[formattedCoordinates.length - 1]
                }
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0, y: 0 }}>
                <View style={[styles.markerContainer, styles.endMarker]}>
                  <MaterialIcons
                    name="flag"
                    size={16}
                    color="#fff"
                  />
                </View>
              </Marker>
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
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  startMarker: {
    backgroundColor: COLORS.success,
  },
  endMarker: {
    backgroundColor: COLORS.danger,
  },
});

export default TrackedMap;
