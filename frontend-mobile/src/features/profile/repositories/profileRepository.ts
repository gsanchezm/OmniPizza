import { apiClient } from "../../../api/client";

const PROFILE_PATH = "/api/users/me/profile";

export interface ProfileDTO {
  username: string;
  premium: boolean;
  full_name: string;
  phone: string;
  address: string;
  notes: string;
}

export interface ProfilePatchDTO {
  full_name?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export function createProfileRepository(client = apiClient) {
  return {
    get: () => client.get<ProfileDTO>(PROFILE_PATH),
    patch: (payload: ProfilePatchDTO) =>
      client.patch<ProfileDTO>(PROFILE_PATH, payload),
  };
}
