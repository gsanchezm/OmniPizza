import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { CustomNavbar } from "../components/CustomNavbar";
import { BottomNavBar } from "../components/BottomNavBar";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";

export default function ProfileScreen({ navigation }: any) {
  const t = useT();
  const { profile, setProfile } = useAppStore();

  const handleSave = () => {
    Alert.alert(t("profileSaved") || "Profile saved");
  };

  return (
    <View style={styles.screen} accessibilityLabel="screen-profile" testID="screen-profile">
      <CustomNavbar title={t("profile")} navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="scroll-profile"
      >
        {/* Header Title Space */}
        <View style={styles.headerSpace} accessibilityLabel="view-profile-header">
          <Text style={styles.subTitle} accessibilityLabel="text-profile-subtitle">
            {t("managePreferences") || "Manage your premium dining preferences"}
          </Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard} accessibilityLabel="view-profile-card" testID="view-profile-card">
          <View style={styles.avatarContainer} accessibilityLabel="view-avatar-container">
            <Image
              source={{
                uri: "https://api.dicebear.com/7.x/avataaars/png?seed=Alexander",
              }}
              style={styles.avatar}
              accessibilityLabel="img-profile-avatar"
              testID="img-profile-avatar"
            />
            <View style={styles.editIconBtn} accessibilityLabel="btn-edit-avatar">
              <Text style={{ color: "white", fontSize: 10 }} accessibilityLabel="icon-edit-avatar">✎</Text>
            </View>
          </View>

          <View style={styles.profileInfo} accessibilityLabel="view-profile-info">
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
              accessibilityLabel="view-profile-name-row"
            >
              <Text style={styles.userName} accessibilityLabel="text-profile-username" testID="text-profile-username">
                {profile?.fullName || "Alexander Sterling"}
              </Text>
              <View style={styles.badge} accessibilityLabel="view-premium-badge">
                <Text style={styles.badgeText} accessibilityLabel="text-premium-badge">
                  {t("premiumMember") || "PREMIUM"}
                </Text>
              </View>
            </View>
            <Text style={styles.userMeta} accessibilityLabel="text-profile-meta">
              {t("joined") || "Joined"} March 2023
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard} accessibilityLabel="view-form-card">
          <View style={styles.formHeader} accessibilityLabel="view-form-header">
            <Text style={{ fontSize: 18, marginRight: 8 }} accessibilityLabel="icon-personal-info">👤</Text>
            <Text style={styles.formTitle} accessibilityLabel="text-form-title">
              {t("personalInformation") || "Personal Information"}
            </Text>
          </View>

          <View style={styles.formBody} accessibilityLabel="view-form-body">
            <View style={styles.fieldGroup} accessibilityLabel="view-field-fullname">
              <Text style={styles.label} accessibilityLabel="label-profile-fullname">{t("fullName")}</Text>
              <TextInput
                style={styles.input}
                value={profile?.fullName || ""}
                onChangeText={(v) => setProfile({ fullName: v })}
                placeholderTextColor="#666"
                testID="input-profile-fullname"
                accessibilityLabel="input-profile-fullname"
              />
            </View>

            <View style={styles.fieldGroup} accessibilityLabel="view-field-phone">
              <Text style={styles.label} accessibilityLabel="label-profile-phone">{t("phone")}</Text>
              <TextInput
                style={styles.input}
                value={profile?.phone || ""}
                onChangeText={(v) => setProfile({ phone: v })}
                placeholderTextColor="#666"
                accessibilityLabel="input-profile-phone"
                testID="input-profile-phone"
              />
            </View>

            <View style={styles.fieldGroup} accessibilityLabel="view-field-address">
              <Text style={styles.label} accessibilityLabel="label-profile-address">{t("address")}</Text>
              <TextInput
                style={styles.input}
                value={profile?.address || ""}
                onChangeText={(v) => setProfile({ address: v })}
                placeholderTextColor="#666"
                accessibilityLabel="input-profile-address"
              />
            </View>

            <View style={styles.fieldGroup} accessibilityLabel="view-field-notes">
              <Text style={styles.label} accessibilityLabel="label-profile-notes">
                {t("deliveryNotes") || "Delivery Notes"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { height: 80, paddingTop: 12, textAlignVertical: "top" },
                ]}
                multiline
                value={profile?.notes || ""}
                onChangeText={(v) => setProfile({ notes: v })}
                placeholderTextColor="#666"
                accessibilityLabel="input-profile-notes"
                testID="input-profile-notes"
              />
            </View>
          </View>

          <View style={styles.formFooter} accessibilityLabel="view-form-footer">
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => navigation.goBack()}
              accessibilityLabel="btn-cancel-profile"
              testID="btn-cancel-profile"
            >
              <Text style={styles.btnCancelText} accessibilityLabel="text-cancel-profile">
                {t("cancel") || "CANCEL"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave} testID="btn-save-profile" accessibilityLabel="btn-save-profile">
              <Text style={styles.btnSaveText} accessibilityLabel="text-save-profile">
                {t("saveChanges") || "SAVE CHANGES"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} testID="btn-delete-account" accessibilityLabel="btn-delete-account">
          <Text style={styles.deleteText} accessibilityLabel="text-delete-account">
            🗑 {t("deleteAccount") || "Delete Account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0F0F0F" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  headerSpace: {
    marginBottom: 24,
  },
  subTitle: {
    color: "#888",
    fontSize: 14,
  },

  profileCard: {
    backgroundColor: "#161616",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2A2A2A",
    borderWidth: 2,
    borderColor: "#333",
  },
  editIconBtn: {
    position: "absolute",
    bottom: 0,
    right: -4,
    backgroundColor: "#FF5722",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#161616",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: "#2A1810",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,87,34,0.3)",
  },
  badgeText: {
    color: "#FF5722",
    fontSize: 8,
    fontWeight: "900",
  },
  userMeta: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },

  formCard: {
    backgroundColor: "#161616",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    overflow: "hidden",
    marginBottom: 24,
  },
  formHeader: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
    flexDirection: "row",
    alignItems: "center",
  },
  formTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  formBody: {
    padding: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: "#666",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "white",
    fontSize: 14,
  },
  formFooter: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  btnCancelText: {
    color: "white",
    fontWeight: "800",
    fontSize: 12,
  },
  btnSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF5722",
    alignItems: "center",
  },
  btnSaveText: {
    color: "white",
    fontWeight: "800",
    fontSize: 12,
  },

  deleteBtn: {
    alignItems: "center",
    padding: 16,
  },
  deleteText: {
    color: "#666",
    fontWeight: "700",
    fontSize: 14,
  },
});
