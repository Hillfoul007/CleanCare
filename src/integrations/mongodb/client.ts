// MongoDB client configuration and helper exports
// This file exports all the helpers that work with the MongoDB backend API

export { authHelpers } from "./authHelpers";
export { bookingHelpers } from "./bookingHelpers";
export { riderHelpers } from "./riderHelpers";

// Re-export types
export type * from "./types";

// Configuration
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || "http://localhost:8080",
};

// Helper to check if backend is available
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(
      `${config.apiBaseUrl.replace("/api", "")}/health`,
    );
    const data = await response.json();

    if (response.ok) {
      return {
        isAvailable: true,
        status: data.status,
        timestamp: data.timestamp,
        environment: data.environment,
      };
    }

    return { isAvailable: false, error: "Backend health check failed" };
  } catch (error) {
    console.error("Backend health check error:", error);
    return { isAvailable: false, error: "Cannot connect to backend" };
  }
};

// Helper to get auth token
export const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

// Helper to get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("current_user");
  return userStr ? JSON.parse(userStr) : null;
};

// Helper to check if user is logged in
export const isLoggedIn = () => {
  const token = localStorage.getItem("auth_token");
  const user = localStorage.getItem("current_user");
  return !!(token && user);
};

// Helper to clear auth data
export const clearAuthData = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("current_user");
};
