import React, { useEffect, useState } from "react";
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
import { useRTL } from "../hooks/useRTL";
import { saveProfile } from "../features/profile/useCases/saveProfile";
import { loadProfile } from "../features/profile/useCases/loadProfile";
import { getReadableControlProps, getReadableTextProps, getTestProps } from "../utils/qa";
import { Dropdown, type DropdownOption } from "../components/Dropdown";

// Birthday is assembled from three dropdowns (no native date input, no new deps)
// and combined into an ISO "YYYY-MM-DD" string. Values are zero-padded so the
// ISO string is well-formed without extra formatting.
const BIRTHDAY_DAY_OPTIONS: DropdownOption[] = Array.from({ length: 31 }, (_, i) => {
  const n = i + 1;
  return { label: String(n), value: String(n).padStart(2, "0") };
});
const BIRTHDAY_MONTH_OPTIONS: DropdownOption[] = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return { label: String(n), value: String(n).padStart(2, "0") };
});
const BIRTHDAY_YEAR_OPTIONS: DropdownOption[] = Array.from(
  { length: 2015 - 1950 + 1 },
  (_, i) => {
    const y = 2015 - i; // most recent first
    return { label: String(y), value: String(y) };
  },
);

function parseBirthday(iso: string): { year: string; month: string; day: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? { year: m[1], month: m[2], day: m[3] } : { year: "", month: "", day: "" };
}

export default function ProfileScreen({ navigation }: any) {
  const t = useT();
  const { textAlign, row } = useRTL();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const [saving, setSaving] = useState(false);

  // Local birthday parts drive the three dropdowns. They are the source of truth
  // for partial selections; the store only holds a full ISO (or empty) string.
  const [bDay, setBDay] = useState("");
  const [bMonth, setBMonth] = useState("");
  const [bYear, setBYear] = useState("");

  useEffect(() => {
    loadProfile().catch(() => {
      /* no profile yet or offline — local state stays */
    });
  }, []);

  // Seed the dropdowns only from a complete ISO (e.g. after loadProfile), so a
  // partial in-progress selection is never wiped by the store write below.
  useEffect(() => {
    const p = parseBirthday(profile?.birthday || "");
    if (p.year && p.month && p.day) {
      setBDay(p.day);
      setBMonth(p.month);
      setBYear(p.year);
    }
  }, [profile?.birthday]);

  const updateBirthday = (part: "day" | "month" | "year", v: string) => {
    const day = part === "day" ? v : bDay;
    const month = part === "month" ? v : bMonth;
    const year = part === "year" ? v : bYear;
    setBDay(day);
    setBMonth(month);
    setBYear(year);
    setProfile({ birthday: day && month && year ? `${year}-${month}-${day}` : "" });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveProfile(t("profileSaved") || "Profile saved", (message) =>
        Alert.alert(message),
      );
    } catch (err: any) {
      Alert.alert(err?.response?.data?.detail || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen} accessibilityLabel="screen-profile" testID="screen-profile">
      <CustomNavbar title={t("profile")} navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...getTestProps("scroll-profile")}
      >
        {/* Header Title Space */}
        <View style={styles.headerSpace} accessibilityLabel="view-profile-header">
          <Text style={[styles.subTitle, { textAlign }]} {...getReadableTextProps("text-profile-subtitle", t("managePreferences") || "Manage your premium dining preferences")}>
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
              <Text style={[styles.userName, { textAlign }]} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps("text-profile-username", profile?.fullName || "Alexander Sterling")}>
                {profile?.fullName || "Alexander Sterling"}
              </Text>
              <View style={styles.badge} accessibilityLabel="view-premium-badge">
                <Text style={styles.badgeText} numberOfLines={1} {...getReadableTextProps("text-premium-badge", t("premiumMember") || "PREMIUM")}>
                  {t("premiumMember") || "PREMIUM"}
                </Text>
              </View>
            </View>
            <Text style={[styles.userMeta, { textAlign }]} {...getReadableTextProps("text-profile-meta", `${t("joined") || "Joined"} March 2023`)}>
              {t("joined") || "Joined"} March 2023
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard} accessibilityLabel="view-form-card">
          <View style={styles.formHeader} accessibilityLabel="view-form-header">
            <Text style={{ fontSize: 18, marginRight: 8 }} accessibilityLabel="icon-personal-info">👤</Text>
            <Text style={[styles.formTitle, { textAlign }]} {...getReadableTextProps("text-form-title", t("personalInformation") || "Personal Information")}>
              {t("personalInformation") || "Personal Information"}
            </Text>
          </View>

          <View style={styles.formBody} accessibilityLabel="view-form-body">
            <View style={styles.fieldGroup} accessibilityLabel="view-field-fullname">
              <Text style={[styles.label, { textAlign }]} {...getReadableTextProps("label-profile-fullname", t("fullName"))}>{t("fullName")}</Text>
              <TextInput
                style={styles.input}
                value={profile?.fullName || ""}
                onChangeText={(v) => setProfile({ fullName: v })}
                placeholderTextColor="#666"
                testID="input-profile-fullname"
                accessibilityLabel={t("fullName")}
              />
            </View>

            <View style={styles.fieldGroup} accessibilityLabel="view-field-phone">
              <Text style={[styles.label, { textAlign }]} {...getReadableTextProps("label-profile-phone", t("phone"))}>{t("phone")}</Text>
              <TextInput
                style={styles.input}
                value={profile?.phone || ""}
                onChangeText={(v) => setProfile({ phone: v })}
                placeholderTextColor="#666"
                accessibilityLabel={t("phone")}
                testID="input-profile-phone"
              />
            </View>

            <View style={styles.fieldGroup} accessibilityLabel="view-field-address">
              <Text style={[styles.label, { textAlign }]} {...getReadableTextProps("label-profile-address", t("address"))}>{t("address")}</Text>
              <TextInput
                style={styles.input}
                value={profile?.address || ""}
                onChangeText={(v) => setProfile({ address: v })}
                placeholderTextColor="#666"
                accessibilityLabel={t("address")}
                testID="input-profile-address"
              />
            </View>

            <View style={styles.fieldGroup} accessibilityLabel="view-field-notes">
              <Text style={[styles.label, { textAlign }]} {...getReadableTextProps("label-profile-notes", t("deliveryNotes") || "Delivery Notes")}>
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
                accessibilityLabel={t("deliveryNotes") || "Delivery Notes"}
                testID="input-profile-notes"
              />
            </View>

            <View style={styles.fieldGroup} accessibilityLabel="view-field-birthday">
              <Text style={[styles.label, { textAlign }]} {...getReadableTextProps("label-birthday", t("birthday") || "Birthday")}>
                {t("birthday") || "Birthday"}
              </Text>
              <View style={[styles.birthdayRow, { flexDirection: row }]} accessibilityLabel="view-birthday-row">
                <View style={styles.birthdayCol} accessibilityLabel="view-birthday-day">
                  <Dropdown
                    value={bDay}
                    options={BIRTHDAY_DAY_OPTIONS}
                    onChange={(v) => updateBirthday("day", v)}
                    placeholder="DD"
                    testID="input-birthday-day"
                  />
                </View>
                <View style={styles.birthdayCol} accessibilityLabel="view-birthday-month">
                  <Dropdown
                    value={bMonth}
                    options={BIRTHDAY_MONTH_OPTIONS}
                    onChange={(v) => updateBirthday("month", v)}
                    placeholder="MM"
                    testID="input-birthday-month"
                  />
                </View>
                <View style={styles.birthdayColYear} accessibilityLabel="view-birthday-year">
                  <Dropdown
                    value={bYear}
                    options={BIRTHDAY_YEAR_OPTIONS}
                    onChange={(v) => updateBirthday("year", v)}
                    placeholder="YYYY"
                    testID="input-birthday-year"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.formFooter} accessibilityLabel="view-form-footer">
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => navigation.goBack()}
              {...getReadableControlProps("btn-cancel-profile", t("cancel") || "CANCEL")}
            >
              <Text style={styles.btnCancelText} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps("text-cancel-profile", t("cancel") || "CANCEL")}>
                {t("cancel") || "CANCEL"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSave, saving && styles.btnSaveDisabled]}
              onPress={handleSave}
              disabled={saving}
              {...getReadableControlProps("btn-save-profile", saving ? (t("saving") || "SAVING…") : (t("saveChanges") || "SAVE CHANGES"))}
            >
              <Text style={styles.btnSaveText} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps("text-save-profile", saving ? (t("saving") || "SAVING…") : (t("saveChanges") || "SAVE CHANGES"))}>
                {saving ? (t("saving") || "SAVING…") : (t("saveChanges") || "SAVE CHANGES")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} {...getReadableControlProps("btn-delete-account", t("deleteAccount") || "Delete Account")}>
          <Text style={styles.deleteText} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps("text-delete-account", `🗑 ${t("deleteAccount") || "Delete Account"}`)}>
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
    flexShrink: 1,
  },
  badge: {
    backgroundColor: "#2A1810",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,87,34,0.3)",
    flexShrink: 0,
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
  birthdayRow: {
    flexDirection: "row",
    gap: 10,
  },
  birthdayCol: {
    flex: 1,
  },
  birthdayColYear: {
    flex: 1.4,
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
  btnSaveDisabled: {
    opacity: 0.6,
  },
  btnSaveText: {
    color: Colors.text.inverse,
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
