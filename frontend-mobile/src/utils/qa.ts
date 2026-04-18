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

/**
 * Props for text/value nodes that must remain selectable by test id while still
 * exposing the visible string to XCUITest/Appium `getText()` on iOS.
 */
export const getReadableTextProps = (id: string, readableLabel: string) => {
  return Platform.select({
    ios: {
      testID: id,
      accessibilityLabel: readableLabel,
    },
    android: {
      accessibilityLabel: id,
      testID: id,
    },
    default: {
      testID: id,
    },
  });
};

/**
 * Props for interactive controls that must keep a stable test id while also
 * exposing a human-readable value to XCUITest/Appium on iOS.
 */
export const getReadableControlProps = (id: string, readableLabel: string) => {
  return Platform.select({
    ios: {
      testID: id,
      accessibilityLabel: readableLabel,
    },
    android: {
      accessibilityLabel: id,
      testID: id,
    },
    default: {
      testID: id,
    },
  });
};
