import { authService } from "../../../services/auth.service";

export function createAuthRepository(service = authService) {
  return {
    login(username, password) {
      return service.login(username, password);
    },
    getTestUsers() {
      return service.getTestUsers();
    },
  };
}
