import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useStepStore from "../src/store/useStepStore";
import { COLORS, SPACING, GRADIENTS } from "../styles/theme";
import TrackedMap from "../components/TrackedMap";

const { width } = Dimensions.get("window");

export default function ActivityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSessionById, deleteSession } = useStepStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Get the specific session by ID
  const session = getSessionById(id as string);

  if (!session) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={64}
            color={COLORS.danger}
          />
          <Text style={styles.errorTitle}>Activity Not Found</Text>
          <Text style={styles.errorDescription}>
            The activity you're looking for doesn't exist.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };
  const calculateDistance = () => {
    if (typeof session.distance === "number") {
      return `${session.distance.toFixed(1)} km`;
    }
    return `${(session.steps * 0.0008).toFixed(1)} km`;
  };

  const calculateCalories = () => {
    if (session.calories) return session.calories;

    // Rough estimation: 0.04 calories per step
    return Math.round(session.steps * 0.04);
  };
  const calculateAveragePace = () => {
    if (!session.endTime) return "N/A";

    const duration = (session.endTime - session.startTime) / 1000 / 60; // minutes
    const distance = parseFloat(calculateDistance().replace(" km", ""));

    if (distance === 0) return "N/A";

    const paceMinutes = duration / distance;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")} min/km`;
  };
  const handleDeleteActivity = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteSession(id as string);
    setShowDeleteModal(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.backgroundContainer}>
        <Image
          source={require("@/assets/images/stepio-background.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={COLORS.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
      </View>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Activity Title Card */}
        <View style={styles.titleCard}>
          <LinearGradient
            colors={GRADIENTS.storyCard}
            style={styles.titleCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.titleCardContent}>
              <Text style={styles.activityTitle}>Walking Session</Text>
              <Text style={styles.activityDate}>
                {formatDate(session.startTime)}
              </Text>
            </View>
          </LinearGradient>
        </View>
        {/* Map Preview Card (if coordinates available) */}
        {session.coordinates.length > 0 && (
          <View style={styles.mapCard}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.mapCardGradient}>
              <Text style={styles.sectionTitle}>Route Overview</Text>
              <View style={styles.mapContainer}>
                <TrackedMap
                  coordinates={session.coordinates}
                  autoCenter={true}
                  readOnly={true}
                  startMarker={true}
                  endMarker={true}
                  followUser={false}
                  isTrackingActive={false}
                />
              </View>
            </LinearGradient>
          </View>
        )}
        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.statCardGradient}>
              <Ionicons
                name="footsteps"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.statValue}>
                {session.steps.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Steps</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.statCardGradient}>
              <Ionicons
                name="location"
                size={24}
                color={COLORS.secondary}
              />
              <Text style={styles.statValue}>{calculateDistance()}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.statCardGradient}>
              <Ionicons
                name="time"
                size={24}
                color={COLORS.accent}
              />
              <Text style={styles.statValue}>
                {formatDuration(session.startTime, session.endTime as number)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.statCardGradient}>
              <Ionicons
                name="flame"
                size={24}
                color={COLORS.neonPink}
              />
              <Text style={styles.statValue}>
                {calculateCalories().toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Calories</Text>
            </LinearGradient>
          </View>
        </View>
        {/* Detailed Information */}
        <View style={styles.detailsCard}>
          <LinearGradient
            colors={GRADIENTS.storyCard}
            style={styles.detailsCardGradient}>
            <Text style={styles.sectionTitle}>Session Details</Text>
            <View style={styles.detailRow}>
              <Ionicons
                name="play-circle"
                size={20}
                color={COLORS.success}
              />
              <Text style={styles.detailLabel}>Start Time</Text>
              <Text style={styles.detailValue}>
                {formatTime(session.startTime)}
              </Text>
            </View>
            {session.endTime && (
              <View style={styles.detailRow}>
                <Ionicons
                  name="stop-circle"
                  size={20}
                  color={COLORS.danger}
                />
                <Text style={styles.detailLabel}>End Time</Text>
                <Text style={styles.detailValue}>
                  {formatTime(session.endTime)}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons
                name="speedometer"
                size={20}
                color={COLORS.info}
              />
              <Text style={styles.detailLabel}>Average Pace</Text>
              <Text style={styles.detailValue}>{calculateAveragePace()}</Text>
            </View>
          </LinearGradient>
        </View>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Ionicons
                name="share"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.actionButtonText}>Share Activity</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeleteActivity}>
            <View style={styles.actionButtonSecondary}>
              <Ionicons
                name="trash"
                size={20}
                color={COLORS.danger}
              />
              <Text style={styles.actionButtonSecondaryText}>
                Delete Activity
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
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
                <Text style={styles.modalTitle}>Delete Activity</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to delete this activity? This action
                  cannot be undone.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowDeleteModal(false)}>
                    <View style={styles.modalButtonSecondary}>
                      <Text style={styles.modalButtonSecondaryText}>
                        Cancel
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={confirmDelete}>
                    <LinearGradient
                      colors={[COLORS.danger, "#CC0000"]}
                      style={styles.modalButtonPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}>
                      <Text style={styles.modalButtonPrimaryText}>Delete</Text>
                    </LinearGradient>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  errorDescription: {
    fontSize: 16,
    color: COLORS.darkMuted,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    zIndex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleCard: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
  },
  titleCardGradient: {
    padding: SPACING.xl,
  },
  titleCardContent: {
    alignItems: "center",
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  activityDate: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
  },
  statCardGradient: {
    padding: SPACING.lg,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.darkMuted,
  },
  detailsCard: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
  },
  detailsCardGradient: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkMuted,
    marginLeft: SPACING.md,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  mapCard: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    overflow: "hidden",
  },
  mapCardGradient: {
    padding: SPACING.lg,
  },
  mapContainer: {
    height: 350,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  mapStats: {
    marginTop: SPACING.md,
    alignItems: "center",
  },
  mapStatsText: {
    fontSize: 14,
    color: COLORS.darkMuted,
    opacity: 0.7,
  },
  actionButtons: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  actionButtonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.danger,
  },
  // Modal styles
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
    flexDirection: "row",
    gap: SPACING.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
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
