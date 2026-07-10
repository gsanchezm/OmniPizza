import { createProfileRepository } from "../repositories/profileRepository";
import { useAppStore } from "../../../store/useAppStore";

export async function loadProfile(
  repository = createProfileRepository(),
) {
  const { data } = await repository.get();
  useAppStore.getState().setProfile({
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    notes: data.notes ?? "",
    birthday: data.birthday ?? "",
  });
  return data;
}
