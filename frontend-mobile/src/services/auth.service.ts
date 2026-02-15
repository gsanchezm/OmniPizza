import { apiClient } from "../api/client";

export const authService = {
    async login(username: string, password?: string) {
        const response = await apiClient.post("/api/auth/login", {
            username,
            password: password || "pizza123", // default password for convenience if not provided
        });
        return response.data;
    },
    async getTestUsers() {
        const response = await apiClient.get("/api/auth/users");
        return response.data;
    },
};
