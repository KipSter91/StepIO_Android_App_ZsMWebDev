import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../styles/theme";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return (
    <Ionicons
      size={24}
      style={{ marginBottom: -3 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.darkMuted,
        tabBarStyle: {
          backgroundColor: COLORS.darkCard,
          borderTopColor: "rgba(0, 255, 204, 0.2)",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: COLORS.darkBackground,
          borderBottomColor: "rgba(0, 255, 204, 0.2)",
          borderBottomWidth: 1,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: "600",
          color: COLORS.white,
        },
        animation: "fade",
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="home"
              color={color}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="home-outline"
              size={24}
              color={COLORS.primary}
              style={{ marginRight: 15 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="path-tracking"
        options={{
          title: "Path Tracking",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="map"
              color={color}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="map-outline"
              size={24}
              color={COLORS.primary}
              style={{ marginRight: 15 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="stats-chart"
              color={color}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="stats-chart-outline"
              size={24}
              color={COLORS.primary}
              style={{ marginRight: 15 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Activities",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="list"
              color={color}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="list-outline"
              size={24}
              color={COLORS.primary}
              style={{ marginRight: 15 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="person"
              color={color}
            />
          ),
          headerRight: () => (
            <Ionicons
              name="person-outline"
              size={24}
              color={COLORS.primary}
              style={{ marginRight: 15 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
