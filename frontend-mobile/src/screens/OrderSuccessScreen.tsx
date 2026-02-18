import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Dimensions,
  Platform
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
// import { CustomNavbar } from "../components/CustomNavbar"; // Not using navbar here for full screen effect

const { width } = Dimensions.get("window");

export default function OrderSuccessScreen({ navigation }: any) {
  const t = useT();
  const { lastOrder } = useAppStore();

  const courier = {
    name: "Carlos R.",
    rating: "4.9",
    vehicle: "driving"
  };

  return (
    <View style={styles.screen}>
      
      {/* Map Background Area */}
      <View style={styles.mapContainer}>
          {/* Placeholder for map */}
          <View style={styles.mapPlaceholder}>
               <Image 
                 source={require('../../assets/ui/map_background.png')}
                 style={styles.mapImage}
               />
               <View style={styles.mapOverlay} />
          </View>
          
          {/* Header Controls */}
          <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Catalog")}>
                  <Text style={{color: 'white', fontSize: 20}}>←</Text>
              </TouchableOpacity>
              
              <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{t("liveTracking")}</Text>
              </View>

              <View style={styles.supportBtn}>
                 <Text style={{fontSize: 20}}>🎧</Text>
              </View>
          </View>

           {/* Pulse Animation Placeholder */}
           <View style={styles.pulseContainer}>
               <View style={styles.pulseRing} />
               <View style={styles.pulseCore}>
                   <Text style={{fontSize: 24}}>🍕</Text>
               </View>
               <View style={styles.courierTag}>
                   <Text style={styles.courierNameTag}>CARLOS</Text>
               </View>
           </View>
      </View>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomSheet}>
          <Text style={styles.statusTitle}>{t("outForDelivery")}</Text>
          <Text style={styles.statusSub}>{t("expectedArrival")}: 8:45 PM</Text>
          
          <View style={styles.timeRow}>
              <Text style={styles.bigTime}>15-20</Text>
              <Text style={styles.minLabel}>{t("min")}</Text>
          </View>

          {/* Courier Card */}
          <View style={styles.courierCard}>
              <View style={styles.courierInfo}>
                   <Image 
                       source={{ uri: "https://api.dicebear.com/7.x/avataaars/png?seed=Carlos" }}
                       style={styles.courierAvatar}
                   />
                   <View style={styles.ratingBadge}>
                       <Text style={styles.ratingText}>4.9 ★</Text>
                   </View>
                   
                   <View style={{marginLeft: 12}}>
                       <Text style={styles.courierLabel}>{t("yourCourier")}</Text>
                       <Text style={styles.courierName}>{courier.name}</Text>
                       <Text style={styles.courierVehicle}>{t(courier.vehicle)}</Text>
                   </View>
              </View>

              <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#333' }]}>
                      <Image source={require('../../assets/ui/icon_chat.png')} style={{width: 20, height: 20, tintColor: 'white'}} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF5722' }]}>
                      <Image source={require('../../assets/ui/icon_phone.png')} style={{width: 20, height: 20, tintColor: 'white'}} />
                  </TouchableOpacity>
              </View>
          </View>

          {/* Order Details Hint */}
          <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsText}>{t("orderDetails").toUpperCase()}</Text>
              <Text style={{color: '#666'}}>^</Text>
          </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0F0F0F" },
  mapContainer: {
      flex: 1, // Takes up remaining space above the fixed height bottom sheet (well, simplified flex approach)
      position: 'relative',
      backgroundColor: '#1a1a1a',
  },
  mapPlaceholder: {
      ...StyleSheet.absoluteFillObject,
  },
  mapImage: {
      width: '100%',
      height: '100%',
      opacity: 0.6,
  },
  mapOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
  },
  
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingHorizontal: 20,
      alignItems: 'center',
  },
  backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#333',
  },
  supportBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#333',
  },
  liveBadge: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#333',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF5722',
  },
  liveText: {
      color: '#FF5722',
      fontWeight: '800',
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
  },

  pulseContainer: {
      position: 'absolute',
      top: '40%',
      left: width / 2 - 40,
      alignItems: 'center',
  },
  pulseRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 87, 34, 0.2)',
      position: 'absolute',
  },
  pulseCore: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 87, 34, 0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 15,
      borderWidth: 3,
      borderColor: '#FFCCBC',
  },
  courierTag: {
      backgroundColor: '#FF5722',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: -10,
  },
  courierNameTag: {
      color: 'white',
      fontWeight: '800',
      fontSize: 10,
  },

  bottomSheet: {
      backgroundColor: '#121212',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 30,
      paddingBottom: 50,
      borderTopWidth: 1,
      borderTopColor: '#333',
  },
  statusTitle: {
      color: 'white',
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 4,
  },
  statusSub: {
      color: '#888',
      fontSize: 14,
      fontWeight: '500',
  },
  timeRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'flex-end',
      marginTop: -40, 
      marginBottom: 30,
  },
  bigTime: {
      fontSize: 56,
      fontWeight: '900',
      color: '#FF5722',
      fontStyle: 'italic',
      letterSpacing: -2,
  },
  minLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FF5722',
      marginLeft: 4,
  },

  courierCard: {
      backgroundColor: '#1E1E1E',
      borderRadius: 24,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  courierInfo: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  courierAvatar: {
      width: 50,
      height: 50,
      borderRadius: 16,
      backgroundColor: '#333',
      borderWidth: 1,
      borderColor: '#444',
  },
  ratingBadge: {
      position: 'absolute',
      bottom: -6,
      left: 10,
      backgroundColor: '#FF5722',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
  },
  ratingText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
  },
  courierLabel: {
      color: '#666',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
  },
  courierName: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
      marginTop: 2,
  },
  courierVehicle: {
      color: '#888',
      fontSize: 12,
  },
  actions: {
      flexDirection: 'row',
      gap: 10,
  },
  actionBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
  },

  detailsBtn: {
      marginTop: 24,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
  },
  detailsText: {
      color: '#666',
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 1,
  },
});
