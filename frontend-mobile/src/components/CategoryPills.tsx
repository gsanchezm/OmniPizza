import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { useT } from '../i18n';

const CATEGORIES = [
  { id: 'all', labelKey: 'allPizza' },
  { id: 'popular', labelKey: 'popular' },
  { id: 'veggie', labelKey: 'veggie' },
  { id: 'meat', labelKey: 'meat' },
  { id: 'sides', labelKey: 'sides' },
];

interface CategoryPillsProps {
  selected: string;
  onSelect: (id: string) => void;
}

export const CategoryPills = ({ selected, onSelect }: CategoryPillsProps) => {
  const t = useT();
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {t(cat.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 10,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface.base2,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  pillActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  text: {
    color: Colors.text.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  textActive: {
    color: '#FFFFFF',
  },
});
