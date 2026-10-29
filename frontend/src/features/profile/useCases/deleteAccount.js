import { createProfileRepository } from "../repositories/profileRepository";
import { useAuthStore } from "../../../store";

/**
 * "Delete account" in this sandbox: the test users themselves are fixed, so this wipes
 * everything held for the caller's login (profile, cart, market) on the server and then
 * signs out. If the server call fails the user stays signed in and the error propagates.
 */
export async function deleteAccount({
  repository = createProfileRepository(),
  logout = () => useAuthStore.getState().logout(),
} = {}) {
  await repository.resetSession();
  logout();
}
