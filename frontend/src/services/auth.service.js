import httpClient from "./httpClient";

export const authService = {
  login: (username, password) =>
    httpClient.post("/api/auth/login", { username, password }),
  getTestUsers: () => httpClient.get("/api/auth/users"),
  getProfile: () => httpClient.get("/api/auth/profile"),
};
