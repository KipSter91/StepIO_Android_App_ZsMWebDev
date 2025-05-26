import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryBar,
  VictoryLine,
  VictoryScatter,
  VictoryTooltip,
} from "victory-native";
import useStepStore, {
  ChartMode,
  StepSession,
} from "../../src/store/useStepStore";

const { width } = Dimensions.get("window");
const chartWidth = width - 32;

export default function StatsScreen() {
  const { chartMode, setChartMode, selectedRange, sessions } = useStepStore();

  // Calculate actual stats from sessions data
  const stats = useMemo(() => {
    // Filter sessions within selected range
    const filteredSessions = sessions.filter((session) => {
      const sessionDate = new Date(session.startTime);
      return (
        sessionDate >= selectedRange.from && sessionDate <= selectedRange.to
      );
    });

    // Calculate totals
    const totalSteps = filteredSessions.reduce(
      (sum, session) => sum + session.steps,
      0
    );
    const totalDistance = filteredSessions.reduce(
      (sum, session) => sum + (session.distance || session.steps * 0.0008),
      0
    );
    const totalCalories = filteredSessions.reduce(
      (sum, session) => sum + (session.calories || session.steps * 0.04),
      0
    );
    const activeDays = new Set(
      filteredSessions.map((session) =>
        new Date(session.startTime).toDateString()
      )
    ).size;

    return {
      totalSteps,
      totalDistance,
      totalCalories,
      activeDays,
    };
  }, [sessions, selectedRange]);

  // Generate chart data based on the mode
  const chartData = useMemo(() => {
    return generateChartData(sessions, selectedRange, chartMode);
  }, [sessions, selectedRange, chartMode]);

  // Handle mode switching
  const handleModeChange = (mode: ChartMode) => {
    setChartMode(mode);
  };

  // Open date picker
  const openDatePicker = () => {
    router.push("/modal" as any); // suppress type error for Expo Router
  };
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={openDatePicker}>
            <Text style={styles.dateText}>
              {formatDateRange(selectedRange.from, selectedRange.to)}
            </Text>
            <MaterialIcons
              name="calendar-today"
              size={16}
              color="#3498db"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Steps"
            value={stats.totalSteps.toLocaleString()}
            icon="directions-walk"
          />
          <StatCard
            title="Distance"
            value={`${stats.totalDistance.toFixed(1)} km`}
            icon="straighten"
          />
          <StatCard
            title="Calories"
            value={`${stats.totalCalories.toFixed(0)} kcal`}
            icon="local-fire-department"
          />
          <StatCard
            title="Active Days"
            value={stats.activeDays.toString()}
            icon="event-available"
          />
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Activity Chart</Text>

          <View style={styles.modeSwitcher}>
            <ModeButton
              label="D"
              mode="day"
              current={chartMode}
              onPress={() => handleModeChange("day")}
            />
            <ModeButton
              label="W"
              mode="week"
              current={chartMode}
              onPress={() => handleModeChange("week")}
            />
            <ModeButton
              label="M"
              mode="month"
              current={chartMode}
              onPress={() => handleModeChange("month")}
            />
            <ModeButton
              label="Y"
              mode="year"
              current={chartMode}
              onPress={() => handleModeChange("year")}
            />
          </View>
        </View>

        {VictoryNative && chartData.length > 0 ? (
          <View style={styles.chartWrapper}>
            <VictoryNative.VictoryChart
              width={chartWidth}
              height={220}
              padding={{ top: 20, bottom: 40, left: 50, right: 30 }}
              theme={VictoryNative.VictoryTheme.material}
              domainPadding={{ x: 20 }}>
              <VictoryNative.VictoryAxis
                tickFormat={(tick: string) => getTickFormat(tick, chartMode)}
                style={{
                  tickLabels: {
                    fontSize: 10,
                    padding: 5,
                    angle: chartMode === "week" ? -45 : 0,
                  },
                }}
              />
              <VictoryNative.VictoryAxis
                dependentAxis
                tickFormat={(tick: number) => `${Math.round(tick / 1000)}k`}
                style={{
                  tickLabels: { fontSize: 10, padding: 5 },
                }}
              />
              <VictoryNative.VictoryBar
                data={chartData}
                x="label"
                y="steps"
                style={{
                  data: {
                    fill: ({ datum }: { datum: any }) =>
                      datum.isToday ? "#2980b9" : "#3498db",
                    width: chartMode === "day" ? 15 : undefined,
                  },
                }}
                cornerRadius={4}
                barRatio={0.8}
                labels={({ datum }: { datum: any }) =>
                  `${datum.steps.toLocaleString()} steps`
                }
                labelComponent={
                  <VictoryNative.VictoryTooltip
                    flyoutStyle={{ fill: "white" }}
                  />
                }
              />
              {chartMode !== "day" && (
                <>
                  <VictoryNative.VictoryLine
                    data={chartData}
                    x="label"
                    y="average"
                    style={{
                      data: {
                        stroke: "#e74c3c",
                        strokeWidth: 2,
                        strokeDasharray: "5,5",
                      },
                    }}
                  />
                  <VictoryNative.VictoryScatter
                    data={chartData}
                    x="label"
                    y="average"
                    size={4}
                    style={{
                      data: { fill: "#e74c3c" },
                    }}
                  />
                </>
              )}
            </VictoryNative.VictoryChart>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#3498db" }]}
                />
                <Text style={styles.legendText}>Steps</Text>
              </View>
              {chartMode !== "day" && (
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: "#e74c3c" }]}
                  />
                  <Text style={styles.legendText}>Average</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.chartPlaceholder}>
            <Text style={styles.placeholderText}>
              No data available for the selected time period
            </Text>
          </View>
        )}
      </View>

      <View style={styles.recentActivityContainer}>
        <Text style={styles.recentActivityTitle}>Recent Activities</Text>

        {sessions.length > 0 ? (
          sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.activityCard}
              onPress={() => router.push(`/stats/${session.id}`)}>
              <View style={styles.activityIconContainer}>
                <MaterialIcons
                  name="directions-run"
                  size={24}
                  color="#3498db"
                />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>
                  {new Date(session.startTime).toLocaleDateString()}
                </Text>
                <Text style={styles.activitySubtitle}>
                  {formatDuration(
                    (session.endTime || Date.now()) - session.startTime
                  )}
                  {" • "}
                  {session.steps} steps
                  {" • "}
                  {(session.steps * 0.0008).toFixed(2)} km
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color="#ccc"
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent activities</Text>
            <TouchableOpacity
              style={styles.startTrackingButton}
              onPress={() => router.push("/path-tracking")}>
              <Text style={styles.startTrackingButtonText}>Start Tracking</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}) {
  return (
    <View style={styles.statCard}>
      <MaterialIcons
        name={icon}
        size={24}
        color="#3498db"
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function ModeButton({
  label,
  mode,
  current,
  onPress,
}: {
  label: string;
  mode: ChartMode;
  current: ChartMode;
  onPress: () => void;
}) {
  const isActive = mode === current;

  return (
    <TouchableOpacity
      style={[styles.modeButton, isActive && styles.activeModeButton]}
      onPress={onPress}>
      <Text
        style={[
          styles.modeButtonText,
          isActive && styles.activeModeButtonText,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Define chart data generation based on the mode
function generateChartData(
  sessions: StepSession[],
  selectedRange: { from: Date; to: Date },
  chartMode: ChartMode
): Array<{ label: string; steps: number; average: number; isToday: boolean }> {
  // Filter sessions within the selected range
  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= selectedRange.from && sessionDate <= selectedRange.to;
  });

  if (filteredSessions.length === 0) return [];

  // Get today's date for highlighting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create map to aggregate data
  const dataMap = new Map<
    string,
    { steps: number; count: number; date: Date }
  >();

  // Prepare time intervals based on mode
  let dateFormat: Intl.DateTimeFormatOptions;
  let intervalType: "day" | "week" | "month" | "year";

  switch (chartMode) {
    case "day":
      dateFormat = { hour: "numeric" };
      intervalType = "day";

      // Create hourly slots for the current day
      const dayStart = new Date(today);
      for (let hour = 0; hour < 24; hour++) {
        const hourDate = new Date(dayStart);
        hourDate.setHours(hour, 0, 0, 0);
        const hourKey = hourDate.toLocaleTimeString("en-US", {
          hour: "numeric",
        });
        dataMap.set(hourKey, { steps: 0, count: 0, date: hourDate });
      }

      // Fill with actual data
      filteredSessions.forEach((session) => {
        const sessionDate = new Date(session.startTime);
        const hour = sessionDate.getHours();
        const hourDate = new Date(sessionDate);
        hourDate.setHours(hour, 0, 0, 0);
        const hourKey = hourDate.toLocaleTimeString("en-US", {
          hour: "numeric",
        });

        const existing = dataMap.get(hourKey) || {
          steps: 0,
          count: 0,
          date: hourDate,
        };
        dataMap.set(hourKey, {
          steps: existing.steps + session.steps,
          count: existing.count + 1,
          date: hourDate,
        });
      });
      break;

    case "week":
      dateFormat = { weekday: "short" };
      intervalType = "week";

      // Create daily slots for the week
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + day);
        const dayKey = dayDate.toLocaleDateString("en-US", {
          weekday: "short",
        });
        dataMap.set(dayKey, { steps: 0, count: 0, date: dayDate });
      }

      // Fill with actual data
      filteredSessions.forEach((session) => {
        const sessionDate = new Date(session.startTime);
        const dayKey = sessionDate.toLocaleDateString("en-US", {
          weekday: "short",
        });

        const dayDate = new Date(sessionDate);
        dayDate.setHours(0, 0, 0, 0);

        const existing = dataMap.get(dayKey) || {
          steps: 0,
          count: 0,
          date: dayDate,
        };
        dataMap.set(dayKey, {
          steps: existing.steps + session.steps,
          count: existing.count + 1,
          date: dayDate,
        });
      });
      break;

    case "month":
      dateFormat = { day: "numeric" };
      intervalType = "month";

      // Create daily slots for the month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const dayDate = new Date(monthStart);
        dayDate.setDate(day);
        const dayKey = day.toString();
        dataMap.set(dayKey, { steps: 0, count: 0, date: dayDate });
      }

      // Fill with actual data
      filteredSessions.forEach((session) => {
        const sessionDate = new Date(session.startTime);

        // Only include sessions from the current month
        if (
          sessionDate.getMonth() === today.getMonth() &&
          sessionDate.getFullYear() === today.getFullYear()
        ) {
          const day = sessionDate.getDate();
          const dayKey = day.toString();

          const dayDate = new Date(sessionDate);
          dayDate.setHours(0, 0, 0, 0);

          const existing = dataMap.get(dayKey) || {
            steps: 0,
            count: 0,
            date: dayDate,
          };
          dataMap.set(dayKey, {
            steps: existing.steps + session.steps,
            count: existing.count + 1,
            date: dayDate,
          });
        }
      });
      break;

    case "year":
      dateFormat = { month: "short" };
      intervalType = "year";

      // Create monthly slots for the year
      const yearStart = new Date(today.getFullYear(), 0, 1);
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(yearStart);
        monthDate.setMonth(month);
        const monthKey = monthDate.toLocaleDateString("en-US", {
          month: "short",
        });
        dataMap.set(monthKey, { steps: 0, count: 0, date: monthDate });
      }

      // Fill with actual data
      filteredSessions.forEach((session) => {
        const sessionDate = new Date(session.startTime);

        // Only include sessions from the current year
        if (sessionDate.getFullYear() === today.getFullYear()) {
          const monthKey = sessionDate.toLocaleDateString("en-US", {
            month: "short",
          });

          const monthDate = new Date(sessionDate);
          monthDate.setDate(1);
          monthDate.setHours(0, 0, 0, 0);

          const existing = dataMap.get(monthKey) || {
            steps: 0,
            count: 0,
            date: monthDate,
          };
          dataMap.set(monthKey, {
            steps: existing.steps + session.steps,
            count: existing.count + 1,
            date: monthDate,
          });
        }
      });
      break;
  }

  // Calculate overall average steps
  const totalSteps = Array.from(dataMap.values()).reduce(
    (sum, item) => sum + item.steps,
    0
  );
  const totalItems =
    Array.from(dataMap.values()).filter((item) => item.steps > 0).length || 1;
  const averageSteps = Math.max(1000, totalSteps / totalItems);

  // Build the final data array
  return Array.from(dataMap.entries())
    .map(([label, data]) => ({
      label,
      steps: data.steps,
      average: averageSteps,
      isToday: data.date.toDateString() === today.toDateString(),
    }))
    .sort((a, b) => {
      if (chartMode === "week") {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days.indexOf(a.label) - days.indexOf(b.label);
      }
      return 0;
    });
}

// Format tick labels for the chart based on chart mode
function getTickFormat(tick: string, mode: ChartMode): string {
  switch (mode) {
    case "day":
      return tick; // Hour format
    case "week":
      return tick; // Weekday name
    case "month":
      return tick; // Day number
    case "year":
      return tick; // Month name
    default:
      return tick;
  }
}

// Helper function to format date range
function formatDateRange(from: Date, to: Date): string {
  // For same day
  if (from.toDateString() === to.toDateString()) {
    return from.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // For same month
  if (
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear()
  ) {
    return `${from.getDate()} - ${to.getDate()} ${from.toLocaleDateString(
      "en-US",
      { month: "short" }
    )}`;
  }

  // Different months
  return `${from.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// Helper function to format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes}m ${seconds % 60}s`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateText: {
    color: "#3498db",
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 8,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
  },
  chartContainer: {
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modeSwitcher: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeModeButton: {
    backgroundColor: "#3498db",
  },
  modeButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  activeModeButtonText: {
    color: "#fff",
  },
  chartWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#999",
    fontStyle: "italic",
  },
  recentActivityContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f3fd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  activitySubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyState: {
    padding: 24,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  startTrackingButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  startTrackingButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});
