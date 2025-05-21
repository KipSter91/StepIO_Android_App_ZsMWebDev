import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import useStepStore, { StepSession } from "../../src/store/useStepStore";

export default function ActivitiesScreen() {
  const { sessions } = useStepStore();

  // Group sessions by date
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <View style={styles.container}>
      {sessions.length > 0 ? (
        <FlatList
          data={Object.entries(groupedSessions)}
          keyExtractor={(item) => item[0]}
          renderItem={({ item: [date, daySessions] }) => (
            <View style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
              {daySessions.map((session) => (
                <ActivityItem
                  key={session.id}
                  session={session}
                  onPress={() => router.push(`/activities/${session.id}`)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="directions-walk"
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyTitle}>No Activities Yet</Text>
          <Text style={styles.emptyMessage}>
            Start tracking your walks and runs to see them here
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push("/path-tracking")}>
            <Text style={styles.startButtonText}>Start Tracking</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Activity item component
function ActivityItem({
  session,
  onPress,
}: {
  session: StepSession;
  onPress: () => void;
}) {
  // Calculate duration in minutes
  const durationMs = (session.endTime || Date.now()) - session.startTime;
  const durationMins = Math.floor(durationMs / (1000 * 60));

  // Calculate distance based on steps (approx 0.8m per step)
  const distanceKm = (session.steps * 0.0008).toFixed(2);

  // Activity time
  const activityTime = new Date(session.startTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={onPress}>
      <View style={styles.activityIcon}>
        <MaterialIcons
          name="directions-run"
          size={24}
          color="#fff"
        />
      </View>

      <View style={styles.activityDetails}>
        <Text style={styles.activityTime}>{activityTime}</Text>
        <Text style={styles.activityStats}>
          {durationMins} min • {session.steps.toLocaleString()} steps •{" "}
          {distanceKm} km
        </Text>
      </View>

      <MaterialIcons
        name="chevron-right"
        size={24}
        color="#ccc"
      />
    </TouchableOpacity>
  );
}

// Helper function to group sessions by date
function groupSessionsByDate(sessions: StepSession[]) {
  return sessions.reduce(
    (groups: { [key: string]: StepSession[] }, session) => {
      const date = new Date(session.startTime).toISOString().split("T")[0];

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(session);
      return groups;
    },
    {}
  );
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
    backgroundColor: "#fff",
  },
  listContent: {
    paddingVertical: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3498db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTime: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  activityStats: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
