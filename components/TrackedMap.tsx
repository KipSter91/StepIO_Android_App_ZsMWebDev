import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";

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
}

const TrackedMap = ({
  coordinates,
  autoCenter = true,
  readOnly = false,
  startMarker = true,
  endMarker = true,
  followUser = false,
  initialRegion,
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
        initialRegion={initialRegion}
        showsUserLocation={!readOnly}
        followsUserLocation={followUser}
        showsMyLocationButton={!readOnly}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        {formattedCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={formattedCoordinates}
              strokeWidth={4}
              strokeColor="#2196F3"
            />

            {startMarker && coordinates.length > 0 && (
              <Marker
                coordinate={{
                  latitude: coordinates[0].lat,
                  longitude: coordinates[0].lon,
                }}>
                <View style={[styles.markerContainer, styles.startMarker]}>
                  <MaterialIcons
                    name="play-arrow"
                    size={16}
                    color="#fff"
                  />
                </View>
              </Marker>
            )}

            {endMarker && coordinates.length > 1 && (
              <Marker
                coordinate={{
                  latitude: coordinates[coordinates.length - 1].lat,
                  longitude: coordinates[coordinates.length - 1].lon,
                }}>
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
    borderRadius: 8,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  startMarker: {
    backgroundColor: "#4CAF50",
  },
  endMarker: {
    backgroundColor: "#F44336",
  },
});

export default TrackedMap;
