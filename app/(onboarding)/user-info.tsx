import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import useStepStore from "../../src/store/useStepStore";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";

export default function UserInfoScreen() {
  const { updateUserProfile } = useStepStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");

  const isFormValid = () => {
    if (!firstName.trim()) return false;
    if (!email.trim() || !validateEmail(email)) return false;
    if (
      !age.trim() ||
      isNaN(Number(age)) ||
      Number(age) <= 0 ||
      Number(age) >= 120
    )
      return false;
    return true;
  };

  const handleContinue = () => {
    if (!firstName.trim()) {
      Alert.alert("Missing Information", "Please enter your first name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Missing Information", "Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (
      !age.trim() ||
      isNaN(Number(age)) ||
      Number(age) <= 0 ||
      Number(age) >= 120
    ) {
      Alert.alert("Invalid Age", "Please enter a valid age (1-119).");
      return;
    }

    updateUserProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      age: Number(age),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/(onboarding)/daily-target");
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.centeredContent}>
            <View style={styles.backButtonContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() =>
                  router.replace({
                    pathname: "./welcome",
                    params: { animationDirection: "back" },
                  })
                }>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i === 0 ? styles.activeProgressDot : null,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              We'll use this information to personalize your experience
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  placeholderTextColor={COLORS.darkMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoComplete="name-given"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your last name"
                  placeholderTextColor={COLORS.darkMuted}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoComplete="name-family"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor={COLORS.darkMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  placeholderTextColor={COLORS.darkMuted}
                  value={age}
                  onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, !isFormValid() && styles.disabledButton]}
                onPress={handleContinue}
                disabled={!isFormValid()}>
                <LinearGradient
                  colors={
                    isFormValid()
                      ? GRADIENTS.primaryToSecondary
                      : [COLORS.darkMuted, COLORS.darkMuted]
                  } // Changed to COLORS.darkMuted
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={COLORS.white}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  backButtonContainer: {
    position: "absolute",
    top: SPACING.xl * 1.2, // Ugyanaz a pozíció mint a daily-targeten
    left: SPACING.md,
    zIndex: 1,
  },
  backButton: {
    padding: SPACING.sm,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.darkBorder, // Adjusted color
    marginHorizontal: SPACING.xs / 2,
  },
  activeProgressDot: {
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: FONTS.sizes.xl, // Adjusted size
    fontWeight: "700", // Adjusted weight
    color: COLORS.white,
    marginBottom: SPACING.sm, // Adjusted margin
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONTS.sizes.sm, // Adjusted size
    color: COLORS.darkMuted,
    marginBottom: SPACING.xl, // Adjusted margin
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.darkCard, // Adjusted background
    borderWidth: 1,
    borderColor: COLORS.darkBorder, // Adjusted border color
    borderRadius: 12,
    color: COLORS.white,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  buttonContainer: {
    marginTop: SPACING.md, // Adjusted margin
  },
  button: {
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  disabledButton: {
    opacity: 0.7, // Adjusted for better visibility of disabled state
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
    marginRight: SPACING.xs,
  },
});
