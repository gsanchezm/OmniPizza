export interface UnauthorizedDeps {
  hasSession: () => boolean;
  logout: () => void;
  goToLogin: () => void;
}

/**
 * A 401 means "send the user back to Login" only when a session actually existed
 * (an expired or invalidated token on an authenticated request). On a login attempt
 * the store has no token yet, so we must stay put and let the caller render its own
 * error ("Invalid credentials"). Mirrors the web httpClient interceptor.
 */
export function handleUnauthorized(err: unknown, deps: UnauthorizedDeps): void {
  const status = (err as { response?: { status?: number } } | null)?.response?.status;
  if (status === 401 && deps.hasSession()) {
    deps.logout();
    deps.goToLogin();
  }
}
