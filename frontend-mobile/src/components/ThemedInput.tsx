import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../theme/colors';

interface ThemedInputProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
}

export const ThemedInput = ({ label, icon, rightElement, error, style, ...props }: ThemedInputProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.errorBorder : null]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? { paddingLeft: 40 } : null, rightElement ? { paddingRight: 40 } : null, style]}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.brand.primary}
          {...props}
        />
        {rightElement && <View style={styles.rightContainer}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: Colors.surface.base2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    height: 50,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
    paddingHorizontal: 16,
    fontFamily: 'System', // Will map to Plus Jakarta Sans if available
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  errorBorder: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
