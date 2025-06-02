import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import useStepStore from "../src/store/useStepStore";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../styles/theme";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarScreen() {
  const { selectedRange, setDateRange } = useStepStore();
  const today = new Date();

  // Create today's date in local timezone (avoiding UTC conversion issues)
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Initialize currentDate to first day of current month to avoid day overflow issues
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    todayLocal
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    todayLocal
  );
  const [pendingDay, setPendingDay] = useState<Date | null>(null);

  // Get days in current month view including previous and next month days
  const getDaysInMonth = (year: number, month: number): Date[] => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);

    // Adjust to Monday of the week containing the first day
    const dayOfWeek = firstDayOfMonth.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Monday=0 system
    startDate.setDate(startDate.getDate() - mondayOffset);

    const days: Date[] = [];
    const currentDate = new Date(startDate);

    // Generate 6 weeks (42 days) to ensure we show complete weeks
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const days: (Date | null)[] = getDaysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  // Next/Previous month navigation
  const goToNextMonth = () => {
    // Create new date at the first day of next month to avoid day overflow issues
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(nextMonth);
  };

  const goToPrevMonth = () => {
    // Create new date at the first day of previous month to avoid day overflow issues
    const prevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(prevMonth);
  };

  // Check if a day is in the current month
  const isCurrentMonth = (day: Date) => {
    return (
      day.getMonth() === currentDate.getMonth() &&
      day.getFullYear() === currentDate.getFullYear()
    );
  };

  // Handle day selection
  const handleDayPress = (day: Date) => {
    if (!day) return;

    // Create a local date to avoid timezone issues
    const localDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());

    // Prevent selecting future dates
    const today = new Date();
    const todayLocal = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (localDay > todayLocal) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If the day is not in the current month but there is a selected start date, try to handle as range
    if (!isCurrentMonth(day)) {
      if (selectedStartDate && !selectedEndDate) {
        // There is a start date, this can be the end date - do not navigate, just set the range
        if (selectedStartDate > localDay) {
          setSelectedEndDate(selectedStartDate);
          setSelectedStartDate(localDay);
        } else {
          setSelectedEndDate(localDay);
        }
        return;
      } else {
        // No start date or already have end date - navigate and start new selection
        setCurrentDate(new Date(day.getFullYear(), day.getMonth(), 1));
        setPendingDay(localDay);
        return;
      }
    }

    // If no start date or already have end date, start new selection
    if (!selectedStartDate || selectedEndDate) {
      setSelectedStartDate(localDay);
      setSelectedEndDate(null);
      return;
    }

    // If the start date is after the selected day, swap
    if (selectedStartDate > localDay) {
      setSelectedEndDate(selectedStartDate);
      setSelectedStartDate(localDay);
      return;
    }

    setSelectedEndDate(localDay);
  };

  // Check if a day is selected (start date, end date, or in between)
  const isDaySelected = (day: Date | null) => {
    if (!day || !selectedStartDate) return false;

    const isStartDate = isSameDay(day, selectedStartDate);
    const isEndDate = selectedEndDate && isSameDay(day, selectedEndDate);

    // Cross-month range support - compare actual dates regardless of which month view we're in
    const isInRange =
      selectedEndDate &&
      day.getTime() > selectedStartDate.getTime() &&
      day.getTime() < selectedEndDate.getTime();

    return isStartDate || isEndDate || isInRange;
  };

  // Check if a day is the start or end of selection
  const isDayEdge = (day: Date | null) => {
    if (!day || !selectedStartDate) return false;

    const isStartDate = isSameDay(day, selectedStartDate);
    const isEndDate = selectedEndDate && isSameDay(day, selectedEndDate);

    return isStartDate || isEndDate;
  };

  // Compare two dates for equality (ignoring time)
  const isSameDay = (
    date1: Date | null | undefined,
    date2: Date | null | undefined
  ) => {
    if (
      !date1 ||
      !date2 ||
      !(date1 instanceof Date) ||
      !(date2 instanceof Date) ||
      isNaN(date1.getTime()) ||
      isNaN(date2.getTime())
    ) {
      return false;
    }
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Helper to format date as YYYY.MM.DD
  const formatDate = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}.${m}.${d}`;
  };

  // Apply the selected range and navigate back
  const applyDateRange = () => {
    if (selectedStartDate) {
      setDateRange(selectedStartDate, selectedEndDate || selectedStartDate);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  // Add a useEffect that processes pendingDay when currentDate changes
  React.useEffect(() => {
    if (pendingDay && isCurrentMonth(pendingDay)) {
      // Create local date to avoid timezone issues
      const localPendingDay = new Date(
        pendingDay.getFullYear(),
        pendingDay.getMonth(),
        pendingDay.getDate()
      );

      // If no start date or already have end date, start new selection
      if (!selectedStartDate || selectedEndDate) {
        setSelectedStartDate(localPendingDay);
        setSelectedEndDate(null);
      } else {
        // There is a start date, this will be the end date
        if (selectedStartDate > localPendingDay) {
          setSelectedEndDate(selectedStartDate);
          setSelectedStartDate(localPendingDay);
        } else {
          setSelectedEndDate(localPendingDay);
        }
      }
      setPendingDay(null);
    }
  }, [currentDate, pendingDay, selectedStartDate, selectedEndDate]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Background with logo */}
      <View style={styles.backgroundContainer}>
        <Image
          source={require("../assets/images/stepio-background.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Date Range</Text>

          <LinearGradient
            colors={GRADIENTS.storyCard}
            style={styles.monthSelector}>
            <TouchableOpacity
              onPress={goToPrevMonth}
              style={styles.navButton}>
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>

            <TouchableOpacity
              onPress={goToNextMonth}
              style={styles.navButton}>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <LinearGradient
          colors={GRADIENTS.storyCard}
          style={styles.calendarContainer}>
          {/* Day labels */}
          <View style={styles.weekdaysRow}>
            {DAYS.map((day) => (
              <Text
                key={day}
                style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar days */}
          <ScrollView contentContainerStyle={styles.daysGrid}>
            {days.map((day, index) => {
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              const isFuture = day && day > today;

              // New: is the day in the selected range (but not start/end)
              let isInRange = false;
              if (
                day &&
                selectedStartDate &&
                selectedEndDate &&
                day.getTime() > selectedStartDate.getTime() &&
                day.getTime() < selectedEndDate.getTime()
              ) {
                isInRange = true;
              }

              return (
                <TouchableOpacity
                  key={`day-${index}`}
                  style={[
                    styles.dayCell,
                    !day && styles.emptyCell,
                    isDaySelected(day) && styles.selectedDay,
                    isDayEdge(day) && styles.edgeDay,
                    isInRange && styles.inRangeDay, // New: tartomány napjai
                    day && !isCurrentMonth(day) && styles.adjacentMonthDay,
                    isFuture && styles.futureDay,
                  ]}
                  onPress={() => day && handleDayPress(day)}
                  disabled={!day || !!isFuture}>
                  {day instanceof Date && !isNaN(day.getTime()) && (
                    <Text
                      style={[
                        styles.dayText,
                        isDaySelected(day) && styles.selectedDayText,
                        !isCurrentMonth(day) && styles.adjacentMonthDayText,
                        isFuture && styles.futureDayText,
                      ]}>
                      {day.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>

        <LinearGradient
          colors={GRADIENTS.storyCard}
          style={styles.selectedRangeDisplay}>
          <Text style={styles.rangeText}>
            {selectedStartDate instanceof Date &&
            !isNaN(selectedStartDate.getTime())
              ? selectedEndDate instanceof Date &&
                !isNaN(selectedEndDate?.getTime())
                ? `${formatDate(selectedStartDate)} - ${formatDate(
                    selectedEndDate
                  )}`
                : `${formatDate(selectedStartDate)}`
              : "Select a date range"}
          </Text>
        </LinearGradient>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={[
              styles.applyButton,
              !selectedStartDate && styles.disabledButton,
            ]}>
            <TouchableOpacity
              onPress={applyDateRange}
              disabled={!selectedStartDate}
              style={styles.applyButtonInner}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
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
  contentContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "center", // Center content vertically
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.cyber,
    fontSize: FONTS.sizes.xxl,
    color: COLORS.white,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  navButton: {
    padding: SPACING.sm,
  },
  monthYearText: {
    ...FONTS.bold,
    fontSize: FONTS.sizes.lg,
    color: COLORS.white,
  },
  calendarContainer: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    maxHeight: 360, // Increased from 300 to 360 to fit 6 weeks without scrolling
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: SPACING.sm,
  },
  dayLabel: {
    width: 40,
    textAlign: "center",
    ...FONTS.medium,
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  emptyCell: {
    backgroundColor: "transparent",
  },
  dayText: {
    ...FONTS.medium,
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
  },
  adjacentMonthDay: {
    opacity: 0.3,
  },
  adjacentMonthDayText: {
    color: COLORS.darkMuted,
  },
  futureDay: {
    opacity: 0.2,
  },
  futureDayText: {
    color: COLORS.darkMuted,
  },
  selectedDay: {
    backgroundColor: `${COLORS.primary}20`,
  },
  edgeDay: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  selectedDayText: {
    color: COLORS.darkBackground,
    fontWeight: "bold",
  },
  selectedRangeDisplay: {
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  rangeText: {
    ...FONTS.medium,
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    ...FONTS.medium,
    fontSize: FONTS.sizes.md,
    color: COLORS.darkMuted,
  },
  applyButton: {
    borderRadius: 12,
    flex: 1,
  },
  applyButtonInner: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
  },
  applyButtonText: {
    ...FONTS.bold,
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  // New style: inRangeDay (days in the selected range)
  inRangeDay: {
    backgroundColor: `${COLORS.primary}20`, // faint primary color
    borderRadius: 16,
  },
});
