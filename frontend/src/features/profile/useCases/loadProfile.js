import { createProfileRepository } from "../repositories/profileRepository";
import { useProfileStore } from "../../../store";

export async function loadProfile(repository = createProfileRepository()) {
  const { data } = await repository.get();
  useProfileStore.getState().setProfile({
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    notes: data.notes ?? "",
  });
  return data;
}
