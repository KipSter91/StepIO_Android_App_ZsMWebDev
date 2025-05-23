import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import useStepStore from "../src/store/useStepStore";

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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const { selectedRange, setDateRange } = useStepStore();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    today
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(today);

  // Get days in current month view
  const getDaysInMonth = (year: number, month: number): (Date | null)[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days: (Date | null)[] = getDaysInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  // Next/Previous month navigation
  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };

  const goToPrevMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  // Handle day selection
  const handleDayPress = (day: Date) => {
    if (!day) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If no start date is selected or if end date is already selected, start fresh
    if (!selectedStartDate || selectedEndDate) {
      setSelectedStartDate(day);
      setSelectedEndDate(null);
      return;
    }

    // If start date is after the selected day, swap them
    if (selectedStartDate > day) {
      setSelectedEndDate(selectedStartDate);
      setSelectedStartDate(day);
      return;
    }

    setSelectedEndDate(day);
  };

  // Check if a day is selected (start date, end date, or in between)
  const isDaySelected = (day: Date | null) => {
    if (!day || !selectedStartDate) return false;

    const isStartDate = isSameDay(day, selectedStartDate);
    const isEndDate = selectedEndDate && isSameDay(day, selectedEndDate);
    const isInRange =
      selectedEndDate && day > selectedStartDate && day < selectedEndDate;

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

  // Apply the selected range and navigate back
  const applyDateRange = () => {
    if (selectedStartDate) {
      setDateRange(selectedStartDate, selectedEndDate || selectedStartDate);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Date Range</Text>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={goToPrevMonth}
            style={styles.navButton}>
            <MaterialIcons
              name="chevron-left"
              size={24}
              color="#333"
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
              color="#333"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarContainer}>
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
          {days.map((day, index) => (
            <TouchableOpacity
              key={`day-${index}`}
              style={[
                styles.dayCell,
                !day && styles.emptyCell,
                isDaySelected(day) && styles.selectedDay,
                isDayEdge(day) && styles.edgeDay,
              ]}
              onPress={() => day && handleDayPress(day)}
              disabled={!day}>
              {day instanceof Date && !isNaN(day.getTime()) && (
                <Text
                  style={[
                    styles.dayText,
                    isDaySelected(day) && styles.selectedDayText,
                  ]}>
                  {day.getDate()}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.selectedRangeDisplay}>
        <Text style={styles.rangeText}>
          {selectedStartDate instanceof Date &&
          !isNaN(selectedStartDate.getTime())
            ? selectedEndDate instanceof Date &&
              !isNaN(selectedEndDate?.getTime())
              ? `${selectedStartDate.toLocaleDateString()} - ${selectedEndDate.toLocaleDateString()}`
              : `${selectedStartDate.toLocaleDateString()}`
            : "Select a date range"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.applyButton,
            !selectedStartDate && styles.disabledButton,
          ]}
          onPress={applyDateRange}
          disabled={!selectedStartDate}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
  calendarContainer: {
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    padding: 12,
    marginBottom: 24,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  dayLabel: {
    width: 40,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
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
    marginVertical: 5,
  },
  emptyCell: {
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 16,
    color: "#333",
  },
  selectedDay: {
    backgroundColor: "#e6f3fd",
  },
  edgeDay: {
    backgroundColor: "#3498db",
    borderRadius: 20,
  },
  selectedDayText: {
    color: "#3498db",
    fontWeight: "500",
  },
  selectedRangeDisplay: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  rangeText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});
