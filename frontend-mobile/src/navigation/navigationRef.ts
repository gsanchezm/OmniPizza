import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

// Lives in its own module so non-UI code (e.g. the API client's 401 handler) can
// navigate without importing App.tsx, which would create an import cycle.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToLogin(): void {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({ index: 0, routes: [{ name: "Login" }] });
  }
}
