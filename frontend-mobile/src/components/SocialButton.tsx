import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface SocialButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  label?: string;
}

export const SocialButton = ({ onPress, icon, label }: SocialButtonProps) => {
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.container} onPress={onPress}>
      {icon}
      {label && <Text style={styles.text}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surface.base2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  text: {
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
