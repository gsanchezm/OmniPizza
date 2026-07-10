import { createProfileRepository } from "../repositories/profileRepository";
import { useAppStore } from "../../../store/useAppStore";

export async function saveProfile(
  message: string,
  notify: (msg: string) => void,
  repository = createProfileRepository(),
) {
  const { profile } = useAppStore.getState();
  const { data } = await repository.patch({
    full_name: profile.fullName,
    phone: profile.phone,
    address: profile.address,
    notes: profile.notes,
    birthday: profile.birthday,
  });
  useAppStore.getState().setProfile({
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    notes: data.notes ?? "",
    birthday: data.birthday ?? "",
  });
  notify(message);
  return data;
}
