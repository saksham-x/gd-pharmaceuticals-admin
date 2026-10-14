import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("adminToken");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========================================
// ERROR MESSAGE
//
// Every API failure comes back as
// { message }, so this pulls out
// something worth showing the admin
// instead of a generic "failed".
// ========================================

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (
    axios.isAxiosError<{
      message?: string;
    }>(error)
  ) {
    // No response at all: the request never
    // reached the server.
    if (!error.response) {
      return "Cannot reach the server. Check that the backend is running.";
    }

    if (error.response.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    return (
      error.response.data?.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default api;