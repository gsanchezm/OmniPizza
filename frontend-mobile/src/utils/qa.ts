import { Platform } from 'react-native';

/**
 * Genera las props correctas para automatización según la plataforma.
 * @param id El identificador único del elemento (ej: "btn-login")
 */
export const getTestProps = (id: string) => {
  return Platform.select({
    ios: {
      testID: id,
    },
    android: {
      accessibilityLabel: id,
      testID: id, // React Native moderno mapea esto bien, pero accessibilityLabel es fallback seguro
    },
    default: {
      testID: id, // Para web
    }
  });
};