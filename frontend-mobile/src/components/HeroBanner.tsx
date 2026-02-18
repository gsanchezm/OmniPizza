import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

export const HeroBanner = () => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000' }}
        style={styles.image}
        imageStyle={{ borderRadius: 24 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
             <View style={styles.badge}>
                <Text style={styles.badgeText}>LIMITED OFFER</Text>
             </View>
             <Text style={styles.title}>Buy 1 Get 1 Free</Text>
             <Text style={styles.subtitle}>Signature Truffle & Mushroom Pizza</Text>
             
             <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Claim Now</Text>
             </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    height: 180,
    marginBottom: 24,
    borderRadius: 24,
    // Mobile shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'flex-end',
    padding: 20,
  },
  content: {
    gap: 6,
  },
  badge: {
    backgroundColor: Colors.brand.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: Colors.text.muted,
    fontSize: 13,
    maxWidth: '70%',
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
  },
});
