import { createAuthRepository } from "../repositories/authRepository";

export async function loginUser(
  { username, password },
  repository = createAuthRepository(),
) {
  return repository.login(username, password);
}
