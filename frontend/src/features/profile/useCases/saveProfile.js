import { createProfileRepository } from "../repositories/profileRepository";
import { useProfileStore } from "../../../store";

export async function saveProfile(
  message,
  notify = window.alert,
  repository = createProfileRepository(),
) {
  const { fullName, phone, address, notes, birthday } = useProfileStore.getState();
  const { data } = await repository.patch({
    full_name: fullName,
    phone,
    address,
    notes,
    birthday,
  });
  useProfileStore.getState().setProfile({
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    notes: data.notes ?? "",
    birthday: data.birthday ?? "",
  });
  notify(message);
  return data;
}
