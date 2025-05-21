import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import useStepStore from "../../src/store/useStepStore";

export default function ProfileScreen() {
  const { userProfile, updateUserProfile } = useStepStore();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [email, setEmail] = useState(userProfile.email);
  const [age, setAge] = useState(userProfile.age.toString());
  const [dailyStepGoal, setDailyStepGoal] = useState(
    userProfile.dailyStepGoal.toString()
  );

  const handleSave = () => {
    // Basic validation
    if (!firstName.trim()) {
      Alert.alert("Missing information", "Please enter your first name.");
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (!age.trim() || isNaN(Number(age)) || Number(age) <= 0) {
      Alert.alert("Invalid age", "Please enter a valid age.");
      return;
    }

    if (
      !dailyStepGoal.trim() ||
      isNaN(Number(dailyStepGoal)) ||
      Number(dailyStepGoal) < 1000
    ) {
      Alert.alert(
        "Invalid step goal",
        "Please enter a valid step goal (minimum 1000)."
      );
      return;
    }

    // Update profile
    updateUserProfile({
      firstName,
      lastName,
      email,
      age: Number(age),
      dailyStepGoal: Number(dailyStepGoal),
    });

    setEditing(false);
  };

  // Simple email validation
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userProfile.firstName?.[0]?.toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.username}>
          {userProfile.firstName} {userProfile.lastName}
        </Text>
        <Text style={styles.userEmail}>{userProfile.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(!editing)}>
            <Text style={styles.editButtonText}>
              {editing ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Daily Step Goal</Text>
              <TextInput
                style={styles.input}
                value={dailyStepGoal}
                onChangeText={setDailyStepGoal}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <InfoRow
              label="First Name"
              value={userProfile.firstName}
            />
            <InfoRow
              label="Last Name"
              value={userProfile.lastName}
            />
            <InfoRow
              label="Email"
              value={userProfile.email}
            />
            <InfoRow
              label="Age"
              value={userProfile.age.toString()}
            />
            <InfoRow
              label="Daily Step Goal"
              value={`${userProfile.dailyStepGoal.toLocaleString()} steps`}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <SettingRow
          icon="notifications"
          label="Notifications"
          value="On"
          onPress={() =>
            Alert.alert(
              "Coming soon",
              "Notification settings will be available soon."
            )
          }
        />
        <SettingRow
          icon="language"
          label="Language"
          value="English"
          onPress={() =>
            Alert.alert(
              "Coming soon",
              "Language settings will be available soon."
            )
          }
        />
        <SettingRow
          icon="color-lens"
          label="Theme"
          value="Light"
          onPress={() =>
            Alert.alert("Coming soon", "Theme settings will be available soon.")
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingRow
          icon="info"
          label="App Version"
          value="1.0.0"
        />
        <SettingRow
          icon="description"
          label="Terms of Service"
          onPress={() =>
            Alert.alert(
              "Coming soon",
              "Terms of service will be available soon."
            )
          }
        />
        <SettingRow
          icon="lock"
          label="Privacy Policy"
          onPress={() =>
            Alert.alert("Coming soon", "Privacy policy will be available soon.")
          }
        />
      </View>
    </ScrollView>
  );
}

// Information row component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Setting row component
function SettingRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}>
      <MaterialIcons
        name={icon}
        size={24}
        color="#666"
        style={styles.settingIcon}
      />
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingValueContainer}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {onPress && (
          <MaterialIcons
            name="chevron-right"
            size={20}
            color="#ccc"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  profileHeader: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3498db",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  editButtonText: {
    color: "#3498db",
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingIcon: {
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  settingValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
  },
  editForm: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#666",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
