import { Platform } from 'react-native';

/**
 * Genera las props correctas para automatización según la plataforma.
 *
 * No hay readableLabel disponible en este helper — por eso NO se setea
 * accessibilityLabel = id: un lector de pantalla anunciando el id crudo
 * ("btn-add-pizza-3") es peor que no anunciar nada. Donde exista un texto
 * legible, usar getReadableControlProps/getReadableTextProps en su lugar.
 * @param id El identificador único del elemento (ej: "btn-login")
 */
export const getTestProps = (id: string) => {
  return Platform.select({
    ios: {
      testID: id,
    },
    android: {
      testID: id, // React Native mapea testID a resource-id en Android
    },
    default: {
      testID: id, // Para web
    }
  });
};

/**
 * Props for text/value nodes that must remain selectable by test id while still
 * exposing the visible string to XCUITest/Appium `getText()` on iOS, and to
 * TalkBack/screen readers on both platforms.
 *
 * `testID` stays equal to `id` on every platform — that's the stable locator
 * Appium/Detox rely on (on Android it surfaces as the view's `resource-id`).
 * `accessibilityLabel` carries the human-readable string, not the raw id, so
 * TalkBack/VoiceOver announce real content instead of machine identifiers.
 */
export const getReadableTextProps = (id: string, readableLabel: string) => {
  return Platform.select({
    ios: {
      testID: id,
      accessibilityLabel: readableLabel,
    },
    android: {
      testID: id,
      accessibilityLabel: readableLabel,
    },
    default: {
      testID: id,
    },
  });
};

/**
 * Props for interactive controls that must keep a stable test id while also
 * exposing a human-readable value to XCUITest/Appium and to TalkBack/VoiceOver
 * on both platforms. See `getReadableTextProps` for the testID/accessibilityLabel
 * split rationale.
 */
export const getReadableControlProps = (id: string, readableLabel: string) => {
  return Platform.select({
    ios: {
      testID: id,
      accessibilityLabel: readableLabel,
    },
    android: {
      testID: id,
      accessibilityLabel: readableLabel,
    },
    default: {
      testID: id,
    },
  });
};
