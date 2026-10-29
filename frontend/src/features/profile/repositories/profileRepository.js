import httpClient from "../../../services/httpClient";

const PROFILE_PATH = "/api/users/me/profile";
const SESSION_RESET_PATH = "/api/session/reset";

export function createProfileRepository(client = httpClient) {
  return {
    get: () => client.get(PROFILE_PATH),
    patch: (payload) => client.patch(PROFILE_PATH, payload),
    resetSession: () => client.post(SESSION_RESET_PATH),
  };
}
