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
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import useStepStore from "../../src/store/useStepStore";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING } from "../../styles/theme";

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
      Number(age) <= 5 ||
      Number(age) >= 120
    )
      return false;
    return true;
  };

  const handleContinue = () => {
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
                      ? [COLORS.primary, COLORS.secondary]
                      : [COLORS.darkMuted, COLORS.darkBorder]
                  }
                  style={styles.buttonGradient}>
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
    top: SPACING.xl * 1.2,
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
    backgroundColor: COLORS.darkBorder,
    marginHorizontal: SPACING.xs / 2,
  },
  activeProgressDot: {
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: SPACING.xl,
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
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 12,
    color: COLORS.white,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
  button: {
    height: 50,
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
  },
  disabledButton: {
    opacity: 0.7,
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
