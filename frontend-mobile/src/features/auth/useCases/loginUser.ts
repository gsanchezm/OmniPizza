import { createAuthRepository } from "../repositories/authRepository";

export async function loginUser(
  input: { username: string; password?: string },
  repository = createAuthRepository(),
) {
  return repository.login(input.username, input.password);
}
