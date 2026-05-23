import httpClient from "../../../services/httpClient";

const PROFILE_PATH = "/api/users/me/profile";

export function createProfileRepository(client = httpClient) {
  return {
    get: () => client.get(PROFILE_PATH),
    patch: (payload) => client.patch(PROFILE_PATH, payload),
  };
}
