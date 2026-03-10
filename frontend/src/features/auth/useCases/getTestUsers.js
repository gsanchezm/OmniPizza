import { createAuthRepository } from "../repositories/authRepository";

export async function getTestUsers(repository = createAuthRepository()) {
  return repository.getTestUsers();
}
