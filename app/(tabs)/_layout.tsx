import React from "react";
import { Tabs, Link } from "expo-router";
import { StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "../../constants/Colors";
import { useColorScheme } from "../../components/useColorScheme";
import { useClientOnlyValue } from "../../components/useClientOnlyValue";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}) {
  return (
    <MaterialIcons
      size={28}
      style={{ marginBottom: -3 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="home"
              color={color}
            />
          ),
          headerRight: () => (
            <Link
              href="/modal"
              asChild>
              <Pressable>
                {({ pressed }) => (
                  <MaterialIcons
                    name="calendar-today"
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="path-tracking"
        options={{
          title: "Track",
          tabBarIcon: ({ color }) => (
            <TabBarIcon
              name="directions-run"
              color={color}
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
              name="assessment"
              color={color}
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
              name="view-list"
              color={color}
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
        }}
      />
    </Tabs>
  );
}
