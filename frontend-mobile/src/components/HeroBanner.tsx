import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

export const HeroBanner = () => {
  return (
    <View style={styles.container} accessibilityLabel="view-hero-banner" testID="view-hero-banner">
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000' }}
        style={styles.image}
        imageStyle={{ borderRadius: 24 }}
        accessibilityLabel="img-hero-banner"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.content} accessibilityLabel="view-hero-content">
             <View style={styles.badge} accessibilityLabel="view-hero-badge">
                <Text style={styles.badgeText} accessibilityLabel="text-hero-badge">LIMITED OFFER</Text>
             </View>
             <Text style={styles.title} accessibilityLabel="text-hero-title" testID="text-hero-title">Buy 1 Get 1 Free</Text>
             <Text style={styles.subtitle} accessibilityLabel="text-hero-subtitle">Signature Truffle & Mushroom Pizza</Text>

             <TouchableOpacity style={styles.button} accessibilityLabel="btn-hero-claim" testID="btn-hero-claim">
                <Text style={styles.buttonText} accessibilityLabel="text-hero-claim">Claim Now</Text>
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
