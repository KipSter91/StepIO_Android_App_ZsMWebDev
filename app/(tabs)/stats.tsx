import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  nativeStepCounterService,
  HourlySteps,
} from "../../src/services/nativeStepCounterService";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";
import useStepStore from "../../src/store/useStepStore";

const { width } = Dimensions.get("window");

export type DateRangeType = "day" | "week" | "month" | "year";

export interface DateRange {
  from: Date;
  to: Date;
  type: DateRangeType;
}

interface StatsData {
  totalSteps: number;
  totalCalories: number;
  totalDistance: number;
  hourlySteps: HourlySteps;
  activeDays: number; // This will represent active hours for day view, active days for other views
}

// Simple chart component to replace victory-native
const SimpleChart = ({
  data,
  labels,
  dateRangeType,
  dateRange,
}: {
  data: number[];
  labels?: string[];
  dateRangeType: DateRangeType;
  dateRange?: DateRange;
}) => {
  const maxValue = Math.max(...data, 1);
  const [chartHeight, setChartHeight] = React.useState(140); // default to style height

  // Generate Y-axis labels (nice numbers, always 5 labels, maxValue at top or felette)
  function getNiceChartMax(value: number) {
    if (value <= 0) return 1;
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / Math.pow(10, exponent);
    let niceFraction;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 2.5) niceFraction = 2.5;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
    return niceFraction * Math.pow(10, exponent);
  }

  const chartMax = getNiceChartMax(maxValue);
  // --- Y Axis labels and grid lines logic ---
  // We want 4 grid lines (not 0), but the bars should start at the bottom (0),
  // so the chartMax (top) -> 0 (bottom) mapping must be precise.
  // The grid lines should be at 1, 0.75, 0.5, 0.25 of chartMax, but the bar height calculation must always use the full chartHeight for chartMax.

  // yAxisLabels: only 4 visible values (no 0), but keep 5 slots for correct grid/bar mapping
  const yAxisLabels = [
    chartMax,
    chartMax * 0.75,
    chartMax * 0.5,
    chartMax * 0.25,
  ];
  const yAxisLabelSlots = 5; // for grid line math

  const formatYAxisLabel = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };
  const getLabel = (index: number): string => {
    if (labels && labels[index]) return labels[index];

    switch (dateRangeType) {
      case "day":
        // Show every 4th hour to reduce clutter
        if (index % 4 === 0) {
          return index < 10 ? `0${index}` : index.toString();
        }
        return "";
      case "week":
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] || "";
      case "month": {
        // For month view, only show labels for certain days and not in the future
        const dayNumber = index + 1;
        if (dateRange) {
          const dayDate = new Date(
            dateRange.from.getFullYear(),
            dateRange.from.getMonth(),
            dayNumber
          );
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          // Only show label for every 5th day or last day of month, and not in future
          if (
            dayDate <= today &&
            (dayNumber % 5 === 1 ||
              dayNumber ===
                new Date(
                  dateRange.from.getFullYear(),
                  dateRange.from.getMonth() + 1,
                  0
                ).getDate())
          ) {
            return dayNumber.toString();
          }
        }
        return "";
      }
      case "year":
        return (
          [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ][index] || ""
        );
      default:
        return "";
    }
  };

  const shouldShowBar = (index: number): boolean => {
    if (dateRangeType === "month" && dateRange) {
      const dayNumber = index + 1;
      const dayDate = new Date(
        dateRange.from.getFullYear(),
        dateRange.from.getMonth(),
        dayNumber
      );
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Only show bar if this day is not in the future
      return dayDate <= today;
    }
    return true;
  };

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartWithAxis}>
        {/* Y-Axis Labels */}
        <View style={styles.yAxis}>
          {yAxisLabels.map((value, index) => (
            <Text
              key={index}
              style={styles.yAxisLabel}>
              {formatYAxisLabel(value)}
            </Text>
          ))}
          {/* Invisible label for 0, to keep spacing */}
          <Text style={[styles.yAxisLabel, { opacity: 0 }]}>0</Text>
        </View>
        {/* Chart Bars + Grid Lines */}
        <View
          style={styles.chartBars}
          onLayout={(e) => setChartHeight(e.nativeEvent.layout.height)}>
          {/* Horizontal grid lines (no 0 line) */}
          {Array.from({ length: yAxisLabelSlots - 1 }).map((_, index) => (
            <View
              key={"hgrid-" + index}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                // 0 (top) to 3 (bottom) for 4 lines, so index/(slots-1)
                top: `${(index / (yAxisLabelSlots - 1)) * 100}%`,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.08)",
                zIndex: 0,
              }}
            />
          ))}
          {/* Chart Bars */}
          {data.map((value, index) => {
            // Clamp value to [0, chartMax] for safety
            const clamped = Math.max(0, Math.min(value, chartMax));
            // Height is proportional to chartMax, so 0 -> 0px, chartMax -> chartHeight
            const height = (clamped / chartMax) * chartHeight;
            const showBar = shouldShowBar(index);
            return (
              <View
                key={index}
                style={styles.barContainer}>
                {showBar && (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={[
                      styles.bar,
                      { height: Math.max(height, 2), zIndex: 1 },
                    ]}
                  />
                )}
                <Text style={[styles.barLabel, !showBar && { opacity: 0.3 }]}>
                  {getLabel(index)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
}) => (
  <LinearGradient
    colors={GRADIENTS.storyCard}
    style={styles.statCard}>
    <View style={styles.statCardHeader}>
      <Ionicons
        name={icon}
        size={24}
        color={COLORS.primary}
      />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </LinearGradient>
);

export default function StatsScreen() {
  const { sessions, selectedRange } = useStepStore();
  const [statsData, setStatsData] = useState<StatsData>({
    totalSteps: 0,
    totalCalories: 0,
    totalDistance: 0,
    hourlySteps: {},
    activeDays: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [periodChartData, setPeriodChartData] = useState<{
    [key: string]: number;
  }>({});
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    // Create local dates to avoid timezone issues
    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEndLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    console.log(`🕐 Initializing with today's date:`, today);
    console.log(`🕐 Today's ISO string:`, today.toISOString());
    console.log(`🕐 Today's date string:`, today.toISOString().split("T")[0]);
    console.log(`🕐 Today local:`, todayLocal);
    console.log(`🕐 Today local ISO:`, todayLocal.toISOString());
    console.log(`🕐 Today end local:`, todayEndLocal);
    console.log(`🕐 Today end local ISO:`, todayEndLocal.toISOString());

    return {
      from: todayLocal,
      to: todayEndLocal,
      type: "day" as DateRangeType,
    };
  }); // Check if we have a selected range from the calendar modal
  useEffect(() => {
    if (selectedRange.from && selectedRange.to) {
      console.log("📅 Processing selected range from calendar modal:");
      console.log("📅 selectedRange.from:", selectedRange.from);
      console.log("📅 selectedRange.to:", selectedRange.to);

      // Convert string dates back to Date objects if needed
      const fromDate =
        selectedRange.from instanceof Date
          ? selectedRange.from
          : new Date(selectedRange.from);
      const toDate =
        selectedRange.to instanceof Date
          ? selectedRange.to
          : new Date(selectedRange.to);

      console.log("📅 Converted fromDate:", fromDate);
      console.log("📅 Converted fromDate ISO:", fromDate.toISOString());
      console.log("📅 Converted toDate:", toDate);
      console.log("📅 Converted toDate ISO:", toDate.toISOString());

      // Check if dates are valid
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        console.log("📅 Invalid dates detected, skipping...");
        return;
      }

      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let type: DateRangeType = "day";
      let adjustedFromDate = new Date(fromDate);
      let adjustedToDate = new Date(toDate);

      if (diffDays <= 1) {
        type = "day";
      } else if (diffDays <= 7) {
        type = "week";
      } else if (diffDays <= 31) {
        type = "month";
        // For month view, expand to full month, but not beyond today
        adjustedFromDate = new Date(
          fromDate.getFullYear(),
          fromDate.getMonth(),
          1
        );
        const monthEnd = new Date(
          fromDate.getFullYear(),
          fromDate.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        adjustedToDate = monthEnd > today ? today : monthEnd;
      } else {
        type = "year";
        // For year view, expand to full year, but not beyond today
        adjustedFromDate = new Date(fromDate.getFullYear(), 0, 1);
        const yearEnd = new Date(fromDate.getFullYear(), 11, 31, 23, 59, 59);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        adjustedToDate = yearEnd > today ? today : yearEnd;
      }

      const newRange: DateRange = {
        from: adjustedFromDate,
        to: adjustedToDate,
        type,
      };

      setDateRange(newRange);
      loadStatsData(newRange);
    }
  }, [selectedRange]);
  // Helper function to generate date array for a given range
  const generateDateArray = (range: DateRange): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(range.from);
    const endDate = new Date(range.to);

    // Ensure we don't go beyond today for future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const actualEndDate = endDate > today ? today : endDate;

    while (currentDate <= actualEndDate) {
      // Don't include future dates
      if (currentDate <= today) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };
  // Helper function to get period key for grouping data
  const getPeriodKey = (date: Date, type: DateRangeType): string => {
    // Always use local YYYY-MM-DD for period keys (not UTC)
    const localDateString = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    return localDateString;
  };
  const loadStatsData = async (range: DateRange) => {
    try {
      // Prevent loading data for future dates
      const today = new Date();
      if (range.from > today) {
        console.log("Selected date is in the future, not loading data");
        setStatsData({
          totalSteps: 0,
          totalCalories: 0,
          totalDistance: 0,
          hourlySteps: {},
          activeDays: 0,
        });
        return;
      }
      if (range.type === "day") {
        // For single day, use unified timestamp-based approach
        const selectedDate = range.from;
        // Always use local date string in YYYY-MM-DD format
        const dateString = `${selectedDate.getFullYear()}-${(
          selectedDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${selectedDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;
        console.log(`🔍 Loading day data for: ${dateString}`);
        console.log(`🔍 Selected date:`, selectedDate);
        console.log(`🔍 Today's date:`, new Date());
        console.log(`🔍 Date range:`, range);

        const [timestamps, hourlyStepsRaw] = await Promise.all([
          nativeStepCounterService.getStepTimestampsForDate(dateString),
          nativeStepCounterService.getHourlyStepsForDate(selectedDate),
        ]);

        // If hourlyStepsRaw is empty or all zeros, but timestamps exist, build hourly steps
        let hourlySteps = { ...hourlyStepsRaw };
        const hasNonZero = Object.values(hourlyStepsRaw).some((v) => v > 0);
        if (!hasNonZero && timestamps.length > 0) {
          // Build hourly steps from timestamps
          hourlySteps = {};
          for (let i = 0; i < 24; i++) hourlySteps[i.toString()] = 0;
          timestamps.forEach((t) => {
            const d = new Date(t.timestamp);
            const hour = d.getHours();
            hourlySteps[hour.toString()] =
              (hourlySteps[hour.toString()] || 0) + t.steps;
          });
          console.log("📊 Built hourlySteps from timestamps:", hourlySteps);
        }

        const totalSteps = timestamps.reduce(
          (sum, timestamp) => sum + timestamp.steps,
          0
        );
        const totalCalories = totalSteps * 0.04; // Unified calculation
        const totalDistance = totalSteps * 0.0008;

        // Calculate active hours (hours with steps > 0)
        const activeHours = Object.values(hourlySteps).filter(
          (steps) => steps > 0
        ).length;

        setStatsData({
          totalSteps,
          totalCalories: Math.round(totalCalories),
          totalDistance,
          hourlySteps,
          activeDays: activeHours, // For day view, this represents active hours
        });

        console.log(`📊 Day stats set:`, {
          totalSteps,
          totalCalories: Math.round(totalCalories),
          totalDistance,
          hourlySteps,
          activeDays: activeHours,
        });
      } else {
        // For other periods, collect data from multiple dates using unified approach
        const dateArray = generateDateArray(range);
        let totalSteps = 0;
        let totalCalories = 0;
        let activeDays = 0;
        const periodData: { [key: string]: number } = {};

        // Collect data for each date in the range
        for (const date of dateArray) {
          // Use local date string for period key
          const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
          const timestamps =
            await nativeStepCounterService.getStepTimestampsForDate(dateString);

          const daySteps = timestamps.reduce(
            (sum, timestamp) => sum + timestamp.steps,
            0
          );
          if (daySteps > 0) {
            totalSteps += daySteps;
            totalCalories += daySteps * 0.04; // Unified calculation
            activeDays++;
          }

          // Group data by period type
          const periodKey = getPeriodKey(date, range.type);
          periodData[periodKey] = (periodData[periodKey] || 0) + daySteps;
        }

        const totalDistance = totalSteps * 0.0008;

        setStatsData({
          totalSteps,
          totalCalories: Math.round(totalCalories),
          totalDistance,
          hourlySteps: {},
          activeDays,
        }); // Store period data for chart
        setPeriodChartData(periodData);

        console.log(`📊 Period stats set:`, {
          totalSteps,
          totalCalories: Math.round(totalCalories),
          totalDistance,
          activeDays,
          periodData,
        });
      }
    } catch (error) {
      console.error("Error loading stats data:", error);
    }
  };
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadStatsData(dateRange);
    setIsRefreshing(false);
  };

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    loadStatsData(newRange);
  };
  useEffect(() => {
    loadStatsData(dateRange);

    // Subscribe to step updates (only for current day)
    const stepUpdateHandler = () => {
      if (dateRange.type === "day") {
        loadStatsData(dateRange);
      }
    };

    nativeStepCounterService.onStepUpdate(stepUpdateHandler);

    return () => {
      nativeStepCounterService.removeStepUpdateListener(stepUpdateHandler);
    };
  }, [dateRange, sessions]); // Add sessions dependency  // Generate chart data for different periods
  const getChartDataForPeriod = () => {
    console.log(
      `🔍 getChartDataForPeriod called for dateRange.type:`,
      dateRange.type
    );
    console.log(`🔍 Current statsData:`, statsData);

    if (dateRange.type === "day") {
      // For day view, return hourly data
      const hourlyData = Array.from(
        { length: 24 },
        (_, index) => statsData.hourlySteps[index.toString()] || 0
      );
      console.log(`📊 Day chart data:`, hourlyData);
      console.log(`📊 Hourly steps data:`, statsData.hourlySteps);
      console.log(
        `📊 Each hour breakdown:`,
        Array.from({ length: 24 }, (_, index) => ({
          hour: index,
          steps: statsData.hourlySteps[index.toString()] || 0,
        }))
      );
      return hourlyData;
    }

    // For other periods, use the period chart data from native service
    switch (dateRange.type) {
      case "week": {
        // Group by day of week (Monday = 0)
        const weekData = Array(7).fill(0);
        const dateArray = generateDateArray(dateRange);
        dateArray.forEach((date) => {
          const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
          // Use local date string for key
          const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
          weekData[dayOfWeek] += periodChartData[dateKey] || 0;
        });

        console.log(`📊 Week chart data:`, weekData);
        console.log(`📊 Period chart data:`, periodChartData);
        return weekData;
      }
      case "month": {
        // For month view, show daily breakdown (1-31 days)
        const daysInMonth = new Date(
          dateRange.from.getFullYear(),
          dateRange.from.getMonth() + 1,
          0
        ).getDate();
        const monthData = Array(daysInMonth).fill(0);
        const dateArray = generateDateArray(dateRange);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        dateArray.forEach((date) => {
          // Only include data for dates up to today
          if (date <= today) {
            const dayOfMonth = date.getDate() - 1; // 0-based index
            // Use local date string for key
            const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
            if (dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
              monthData[dayOfMonth] = periodChartData[dateKey] || 0;
            }
          }
        });

        console.log(`📊 Month chart data:`, monthData);
        console.log(`📊 Period chart data:`, periodChartData);
        return monthData;
      }
      case "year": {
        // For year view, show monthly breakdown (Jan-Dec)
        const yearData = Array(12).fill(0);
        const dateArray = generateDateArray(dateRange);
        dateArray.forEach((date) => {
          const month = date.getMonth();
          // Use local date string for key
          const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
          yearData[month] += periodChartData[dateKey] || 0;
        });

        console.log(`📊 Year chart data:`, yearData);
        console.log(`📊 Period chart data:`, periodChartData);
        return yearData;
      }
      default:
        return [];
    }
  };
  const getChartTitle = () => {
    switch (dateRange.type) {
      case "day":
        return "Hourly Activity";
      case "week":
        return "Daily Activity";
      case "month":
        return "Daily Activity";
      case "year":
        return "Monthly Activity";
    }
  };
  const getChartSubtitle = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatMonth = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    };

    const formatYear = (date: Date) => {
      return date.getFullYear().toString();
    };

    switch (dateRange.type) {
      case "day":
        return `Steps for ${formatDate(dateRange.from)}`;
      case "week":
        return `Steps from ${formatDate(dateRange.from)} to ${formatDate(
          dateRange.to
        )}`;
      case "month":
        return `Daily steps for ${formatMonth(dateRange.from)}`;
      case "year":
        return `Monthly steps for ${formatYear(dateRange.from)}`;
    }
  };
  const getMaxDaysForPeriod = () => {
    switch (dateRange.type) {
      case "day":
        return 1;
      case "week":
        return 7;
      case "month": {
        // Get actual number of days in the month
        const year = dateRange.from.getFullYear();
        const month = dateRange.from.getMonth();
        return new Date(year, month + 1, 0).getDate();
      }
      case "year": {
        // Get actual number of days in the year (accounting for leap years)
        const year = dateRange.from.getFullYear();
        const isLeapYear =
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        return isLeapYear ? 366 : 365;
      }
    }
  };
  return (
    <ImageBackground
      source={require("../../assets/images/stepio-background.png")}
      style={styles.container}
      resizeMode="cover">
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.darkCard}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Your Stats</Text>
              <Text style={styles.headerSubtitle}>Activity Overview</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={async () => {
                  console.log("🔍 Debug button pressed - logging JSON data...");
                  await nativeStepCounterService.logTodayJsonData();
                }}>
                <LinearGradient
                  colors={[COLORS.secondary, COLORS.primary]}
                  style={styles.calendarButtonGradient}>
                  <Ionicons
                    name="bug"
                    size={20}
                    color={COLORS.white}
                  />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => router.push("/modal")}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.calendarButtonGradient}>
                  <Ionicons
                    name="calendar"
                    size={24}
                    color={COLORS.white}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Steps"
              value={statsData.totalSteps.toLocaleString()}
              icon="footsteps"
              subtitle="total"
            />
            <StatCard
              title="Distance"
              value={`${statsData.totalDistance.toFixed(2)} km`}
              icon="map"
              subtitle="traveled"
            />
            <StatCard
              title="Calories"
              value={`${statsData.totalCalories}`}
              icon="flame"
              subtitle="burned"
            />
            <StatCard
              title={dateRange.type === "day" ? "Active Hours" : "Active Days"}
              value={`${statsData.activeDays}`}
              icon="time"
              subtitle={
                dateRange.type === "day"
                  ? "of 24"
                  : `of ${getMaxDaysForPeriod()}`
              }
            />
          </View>
        </View>
        {/* Chart Section */}
        <LinearGradient
          colors={GRADIENTS.storyCard}
          style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{getChartTitle()}</Text>
            <Text style={styles.chartSubtitle}>{getChartSubtitle()}</Text>
          </View>
          <SimpleChart
            data={getChartDataForPeriod()}
            dateRangeType={dateRange.type}
            dateRange={dateRange}
          />
        </LinearGradient>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...FONTS.cyber,
    fontSize: FONTS.sizes.xxl,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    ...FONTS.medium,
    fontSize: FONTS.sizes.md,
    color: COLORS.darkMuted,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignSelf: "center",
  },
  calendarButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  summaryContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - SPACING.lg * 3) / 2,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  statTitle: {
    ...FONTS.medium,
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
    marginLeft: SPACING.sm,
  },
  statValue: {
    ...FONTS.bold,
    fontSize: FONTS.sizes.xl,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  statSubtitle: {
    ...FONTS.regular,
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkMuted,
  },
  chartSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  chartHeader: {
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    ...FONTS.bold,
    fontSize: FONTS.sizes.lg,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  chartSubtitle: {
    ...FONTS.regular,
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
  },
  chartContainer: {
    height: 180,
    justifyContent: "flex-end",
  },
  chartWithAxis: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 160,
  },
  yAxis: {
    width: 15, // Még kisebb szélesség
    height: 140,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 0, // Nincs padding
    marginRight: 2, // Minimális margin
  },
  yAxisLabel: {
    ...FONTS.regular,
    fontSize: 8, // Smaller font
    color: COLORS.darkMuted,
    textAlign: "right",
  },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    paddingLeft: SPACING.xs, // Adjunk vissza kis padding-et
    paddingRight: SPACING.xs,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 0.5,
    maxWidth: 25,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    ...FONTS.regular,
    fontSize: 8,
    color: COLORS.darkMuted,
    marginTop: SPACING.xs / 2,
    textAlign: "center",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  debugButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
