import axios from "axios";

const clientAPI = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor - handle errors
clientAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Network error. Please check if the backend is running."));
    }
    const message =
      error.response.data?.message ||
      error.response.statusText ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

export default clientAPI;
