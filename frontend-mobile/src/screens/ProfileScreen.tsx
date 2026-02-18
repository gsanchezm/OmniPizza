import React from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  Alert
} from "react-native";
import { CustomNavbar } from "../components/CustomNavbar";
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
    <View style={styles.screen}>
      <CustomNavbar title={t("profile")} navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Title Space */}
        <View style={styles.headerSpace}>
           <Text style={styles.subTitle}>
             {t("managePreferences") || "Manage your premium dining preferences"}
           </Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
           <View style={styles.avatarContainer}>
             <Image 
               source={{ uri: "https://api.dicebear.com/7.x/avataaars/png?seed=Alexander" }}
               style={styles.avatar}
             />
             <View style={styles.editIconBtn}>
                <Text style={{color: 'white', fontSize: 10}}>✎</Text>
             </View>
           </View>
           
           <View style={styles.profileInfo}>
             <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4}}>
               <Text style={styles.userName}>{profile?.fullName || "Alexander Sterling"}</Text>
               <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t("premiumMember") || "PREMIUM"}</Text>
               </View>
             </View>
             <Text style={styles.userMeta}>{t("joined") || "Joined"} March 2023</Text>
           </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
           <View style={styles.formHeader}>
              <Text style={{fontSize: 18, marginRight: 8}}>👤</Text>
              <Text style={styles.formTitle}>{t("personalInformation") || "Personal Information"}</Text>
           </View>
           
           <View style={styles.formBody}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t("fullName")}</Text>
                <TextInput 
                  style={styles.input} 
                  value={profile?.fullName || ""} 
                  onChangeText={(v)=>setProfile({ fullName: v })}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t("phone")}</Text>
                <TextInput 
                  style={styles.input} 
                  value={profile?.phone || ""} 
                  onChangeText={(v)=>setProfile({ phone: v })}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t("address")}</Text>
                <TextInput 
                  style={styles.input} 
                  value={profile?.address || ""} 
                  onChangeText={(v)=>setProfile({ address: v })}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t("deliveryNotes") || "Delivery Notes"}</Text>
                <TextInput 
                  style={[styles.input, { height: 80, paddingTop: 12, textAlignVertical: 'top' }]} 
                  multiline 
                  value={profile?.notes || ""} 
                  onChangeText={(v)=>setProfile({ notes: v })}
                  placeholderTextColor="#666"
                />
              </View>
           </View>
           
           <View style={styles.formFooter}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.goBack()}>
                <Text style={styles.btnCancelText}>{t("cancel") || "CANCEL"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                <Text style={styles.btnSaveText}>{t("saveChanges") || "SAVE CHANGES"}</Text>
              </TouchableOpacity>
           </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn}>
           <Text style={styles.deleteText}>🗑  {t("deleteAccount") || "Delete Account"}</Text>
        </TouchableOpacity>

      </ScrollView>
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
    position: 'relative',
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
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: "#FF5722",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
    marginBottom: 24,
  },
  formHeader: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
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
    alignItems: 'center',
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
    alignItems: 'center',
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
