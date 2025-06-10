import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useStepStore from "../../src/store/useStepStore";
import { COLORS, FONTS, SPACING, GRADIENTS } from "../../styles/theme";

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

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"error" | "info">("info");
  // NEW: Modal for Terms and Privacy
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const showCustomModal = (
    title: string,
    message: string,
    type: "error" | "info" = "info"
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };
  const handleSave = () => {
    // Basic validation
    if (!firstName.trim()) {
      showCustomModal(
        "Missing information",
        "Please enter your first name.",
        "error"
      );
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      showCustomModal(
        "Invalid email",
        "Please enter a valid email address.",
        "error"
      );
      return;
    }

    if (
      !age.trim() ||
      isNaN(Number(age)) ||
      Number(age) <= 5 ||
      Number(age) > 120
    ) {
      showCustomModal(
        "Invalid age",
        "Please enter a valid age. (6-120)",
        "error"
      );
      return;
    }

    if (
      !dailyStepGoal.trim() ||
      isNaN(Number(dailyStepGoal)) ||
      Number(dailyStepGoal) < 1000 ||
      Number(dailyStepGoal) > 50000
    ) {
      showCustomModal(
        "Invalid step goal",
        "Please enter a valid step goal (minimum 1000, maximum 50000).",
        "error"
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
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Background with logo */}
        <View style={styles.backgroundContainer}>
          <Image
            source={require("@/assets/images/stepio-background.png")}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.profileHeaderGradient}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.avatarGradient}>
                  <Text style={styles.avatarText}>
                    {(() => {
                      const first =
                        userProfile.firstName?.[0]?.toUpperCase() || "";
                      const last =
                        userProfile.lastName?.[0]?.toUpperCase() || "";
                      return first + last || "U";
                    })()}
                  </Text>
                </LinearGradient>
              </View>
              <Text style={styles.username}>
                {userProfile.firstName} {userProfile.lastName}
              </Text>
              <Text style={styles.userEmail}>{userProfile.email}</Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.sectionGradient}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditing(!editing)}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.editButtonGradient}>
                    <Text style={styles.editButtonText}>
                      {editing ? "Cancel" : "Edit"}
                    </Text>
                  </LinearGradient>
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
                      placeholderTextColor={COLORS.darkMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholderTextColor={COLORS.darkMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      placeholderTextColor={COLORS.darkMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                      style={styles.input}
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.darkMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Daily Step Goal</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyStepGoal}
                      onChangeText={setDailyStepGoal}
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.darkMuted}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </LinearGradient>
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
            </LinearGradient>
          </View>
          <View style={styles.section}>
            <LinearGradient
              colors={GRADIENTS.storyCard}
              style={styles.sectionGradient}>
              <Text style={styles.sectionTitle}>About</Text>
              <SettingRow
                icon="info"
                label="App Version"
                value="1.0.0"
              />
              <SettingRow
                icon="description"
                label="Terms of Service"
                onPress={() => setShowTermsModal(true)}
              />
              <SettingRow
                icon="lock"
                label="Privacy Policy"
                onPress={() => setShowPrivacyModal(true)}
              />
            </LinearGradient>
          </View>
          {/* Extra spacing at bottom */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
        {/* Custom Modal */}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={GRADIENTS.storyCard}
                style={styles.modalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.modalContent}>
                  <MaterialIcons
                    name={modalType === "error" ? "error" : "info"}
                    size={48}
                    color={
                      modalType === "error" ? COLORS.danger : COLORS.primary
                    }
                    style={styles.modalIcon}
                  />
                  <Text style={styles.modalTitle}>{modalTitle}</Text>
                  <Text style={styles.modalMessage}>{modalMessage}</Text>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowModal(false)}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>OK</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
        {/* Terms of Service Modal */}
        <Modal
          visible={showTermsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTermsModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={GRADIENTS.storyCard}
                style={styles.modalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.modalContent}>
                  <MaterialIcons
                    name="description"
                    size={48}
                    color={COLORS.primary}
                    style={styles.modalIcon}
                  />
                  <Text style={styles.modalTitle}>Terms of Service</Text>
                  <Text style={styles.modalMessage}>
                    StepIO is a free application created and owned by Zsolt
                    Márku. This is the first version of the app and it is still
                    under active development as a learning project. The app has
                    been tested on a Samsung S23 Ultra and no major bugs or
                    issues were encountered during testing. However, as devices
                    and user environments may vary, occasional bugs or issues
                    may still occur. You are welcome to use it free of charge,
                    but any misuse or unauthorized distribution may have legal
                    consequences. Thank you for your understanding and support
                    as the app continues to improve.
                  </Text>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowTermsModal(false)}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>OK</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
        {/* Privacy Policy Modal */}
        <Modal
          visible={showPrivacyModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPrivacyModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={GRADIENTS.storyCard}
                style={styles.modalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <View style={styles.modalContent}>
                  <MaterialIcons
                    name="lock"
                    size={48}
                    color={COLORS.primary}
                    style={styles.modalIcon}
                  />
                  <Text style={styles.modalTitle}>Privacy Policy</Text>
                  <Text style={styles.modalMessage}>
                    StepIO does not collect or store any personal data. All your
                    information is saved only on your device and is never shared
                    or uploaded anywhere. You have full control over your data.
                  </Text>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowPrivacyModal(false)}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>OK</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </View>
    </>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  profileHeader: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  profileHeaderGradient: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  avatarGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    color: COLORS.white,
    ...FONTS.bold,
  },
  username: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.white,
    ...FONTS.bold,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkMuted,
  },
  section: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  sectionGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    ...FONTS.bold,
    color: COLORS.white,
  },
  editButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  editButtonGradient: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: COLORS.white,
    ...FONTS.medium,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  infoLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkMuted,
    ...FONTS.regular,
  },
  infoValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    ...FONTS.medium,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
  },
  settingIcon: {
    marginRight: 16,
    color: COLORS.primary,
  },
  settingLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    flex: 1,
    ...FONTS.regular,
  },
  settingValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkMuted,
    marginRight: 8,
    ...FONTS.medium,
  },
  editForm: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    marginBottom: 6,
    color: COLORS.darkMuted,
    ...FONTS.medium,
  },
  input: {
    backgroundColor: COLORS.darkBackground,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    ...FONTS.regular,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    ...FONTS.bold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  modalGradient: {
    padding: SPACING.xl,
  },
  modalContent: {
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.darkMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  modalButton: {
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 100,
  },
  modalButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  bottomSpacing: {
    height: SPACING.lg, // Extra space at bottom
  },
});
