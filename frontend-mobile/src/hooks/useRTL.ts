import { useAppStore } from "../store/useAppStore";

/**
 * Reactive RTL helper.
 *
 * The app deliberately does NOT use `I18nManager.forceRTL()` — that only applies
 * after a full reload, and the store is intentionally ephemeral, so a reload would
 * wipe the session that just selected the Arabic market. Instead, components mirror
 * layout directly from state: Arabic (`language === "ar"`) => RTL.
 *
 * Note: Arabic script itself always renders right-to-left inside a `Text` run (bidi
 * is automatic regardless of I18nManager). This hook only drives the things that do
 * NOT auto-mirror: text alignment, row order, and writing direction.
 */
export type RTLInfo = {
  isRTL: boolean;
  textAlign: "right" | "left";
  row: "row-reverse" | "row";
  writingDirection: "rtl" | "ltr";
};

export function useRTL(): RTLInfo {
  const isRTL = useAppStore((s) => s.language === "ar");
  return {
    isRTL,
    textAlign: isRTL ? "right" : "left",
    row: isRTL ? "row-reverse" : "row",
    writingDirection: isRTL ? "rtl" : "ltr",
  };
}
