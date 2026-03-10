import { authService } from "../../../services/auth.service";

export function createAuthRepository(service = authService) {
  return {
    login(username: string, password?: string) {
      return service.login(username, password);
    },
    getTestUsers() {
      return service.getTestUsers();
    },
  };
}
