import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useStepStore, { StepSession } from "../../src/store/useStepStore";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";

export default function ActivitiesScreen() {
  const { sessions } = useStepStore();

  // Create flattened data for FlatList
  const flattenedData = useMemo(() => {
    const groupedSessions = groupSessionsByDate(sessions);
    const data: Array<
      | { type: "date"; date: string; formattedDate: string }
      | { type: "session"; session: StepSession }
    > = [];

    // Sort dates in descending order and create flat array
    Object.entries(groupedSessions)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .forEach(([date, daySessions]) => {
        // Add date header
        data.push({
          type: "date",
          date,
          formattedDate: formatDateHeader(date),
        });

        // Add sessions for this date
        daySessions.forEach((session) => {
          data.push({
            type: "session",
            session,
          });
        });
      });

    return data;
  }, [sessions]);
  const renderItem = ({
    item,
  }: {
    item:
      | { type: "date"; date: string; formattedDate: string }
      | { type: "session"; session: StepSession };
  }) => {
    if (item.type === "date") {
      return <Text style={styles.dateHeader}>{item.formattedDate}</Text>;
    } else {
      return (
        <ActivityItem
          session={item.session}
          onPress={() => {
            router.push(`/${item.session.id}`);
          }}
        />
      );
    }
  };

  const getItemKey = (
    item:
      | { type: "date"; date: string; formattedDate: string }
      | { type: "session"; session: StepSession },
    index: number
  ) => {
    if (item.type === "date") {
      return `date-${item.date}`;
    } else {
      return `session-${item.session.id}`;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background with logo */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require("@/assets/images/stepio-background.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      {sessions.length > 0 ? (
        <FlatList
          data={flattenedData}
          renderItem={renderItem}
          keyExtractor={getItemKey}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          getItemLayout={undefined}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Your Path Tracking History</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={GRADIENTS.storyCard}
            style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.emptyIconBackground}>
                <Ionicons
                  name="walk-outline"
                  size={48}
                  color={COLORS.white}
                />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No Activities Yet</Text>
            <Text style={styles.emptyMessage}>
              Start tracking your walks to see them here
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push("/(tabs)/path-tracking")}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.startButtonGradient}>
                <Ionicons
                  name="play"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.startButtonText}>Start Tracking</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

// Activity item component
const ActivityItem = React.memo(
  ({ session, onPress }: { session: StepSession; onPress: () => void }) => {
    // Calculate duration in minutes
    const durationMs = (session.endTime || Date.now()) - session.startTime;
    const durationMins = Math.floor(durationMs / (1000 * 60));

    // Use saved distance if available, otherwise estimate from steps as fallback
    const distanceKm =
      typeof session.distance === "number"
        ? session.distance.toFixed(1)
        : (session.steps * 0.0008).toFixed(1);

    // Activity time
    const activityTime = new Date(session.startTime).toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    );

    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={onPress}>
        <LinearGradient
          colors={GRADIENTS.storyCard}
          style={styles.activityCardGradient}>
          <View style={styles.activityItemContent}>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTime}>{activityTime}</Text>
              <Text style={styles.activityStats}>
                {durationMins} min • {session.steps.toLocaleString()} steps •{" "}
                {distanceKm} km
              </Text>
            </View>
            <View style={styles.activityChevron}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.darkMuted}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
);

// Helper function to group sessions by date
function groupSessionsByDate(sessions: StepSession[]) {
  // First, sort sessions by startTime in descending order (newest first)
  const sortedSessions = [...sessions].sort(
    (a, b) => b.startTime - a.startTime
  );

  const groups = sortedSessions.reduce(
    (groups: { [key: string]: StepSession[] }, session) => {
      // Use local date to avoid timezone issues
      const sessionDate = new Date(session.startTime);
      const date = `${sessionDate.getFullYear()}-${(sessionDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${sessionDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(session);
      return groups;
    },
    {}
  );

  // Sort each date group by startTime in descending order (newest first within each day)
  Object.keys(groups).forEach((date) => {
    groups[date].sort((a, b) => b.startTime - a.startTime);
  });

  return groups;
}

// Helper function to format date header
function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if date is today
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  // Check if date is yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // Otherwise, return formatted date
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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

  scrollContent: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: "center",
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONTS.sizes.xxl,
    color: COLORS.white,
    textAlign: "center",
  },
  dateHeader: {
    ...FONTS.semibold,
    fontSize: FONTS.sizes.lg,
    color: COLORS.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
    textTransform: "uppercase",
    letterSpacing: 1.0,
  },
  activityItem: {
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  activityCardGradient: {
    padding: SPACING.lg,
  },
  activityItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityDetails: {
    flex: 1,
  },
  activityTime: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  activityStats: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
  },
  activityChevron: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyCard: {
    padding: SPACING.xl * 2,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    width: "100%",
    maxWidth: 320,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    marginBottom: SPACING.lg,
  },
  emptyIconBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkMuted,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  startButton: {
    borderRadius: 16,
    overflow: "hidden",
    minWidth: 200,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  startButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    color: COLORS.white,
  },
});
