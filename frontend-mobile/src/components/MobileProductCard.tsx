import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import type { Pizza } from "../types/api";

interface MobileProductCardProps {
  pizza: Pizza;
  onPress: (pizza: Pizza) => void;
}

export const MobileProductCard = ({ pizza, onPress }: MobileProductCardProps) => {
  return (
    <View style={styles.card} testID={`card-pizza-${pizza.id}`} accessibilityLabel={`card-pizza-${pizza.id}`}>
      {/* Image Section */}
      <View style={styles.imageContainer} accessibilityLabel={`view-img-container-${pizza.id}`}>
        <Image
          source={{ uri: pizza.image }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={`img-pizza-${pizza.id}`}
          testID={`img-pizza-${pizza.id}`}
        />
      </View>

      {/* Content Section */}
      <View style={styles.content} accessibilityLabel={`view-pizza-content-${pizza.id}`}>
        <Text style={styles.title} numberOfLines={1} testID={`text-pizza-name-${pizza.id}`} accessibilityLabel={`text-pizza-name-${pizza.id}`}>{pizza.name}</Text>
        <Text style={styles.desc} numberOfLines={2} accessibilityLabel={`text-pizza-desc-${pizza.id}`}>{pizza.description}</Text>

        <View style={styles.footer} accessibilityLabel={`view-pizza-footer-${pizza.id}`}>
           <Text style={styles.price} testID={`text-pizza-price-${pizza.id}`} accessibilityLabel={`text-pizza-price-${pizza.id}`}>{pizza.currency_symbol}{pizza.price}</Text>

           <TouchableOpacity onPress={() => onPress(pizza)} style={styles.addButton} testID={`btn-add-pizza-${pizza.id}`} accessibilityLabel={`btn-add-pizza-${pizza.id}`}>
              <Text style={styles.addIcon} accessibilityLabel={`icon-add-pizza-${pizza.id}`}>＋</Text>
           </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface.base2,
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface.base,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: Colors.text.muted,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.brand.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: -2,
  },
});
