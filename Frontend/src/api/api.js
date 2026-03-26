import axios from "axios";

const api = axios.create({
  baseURL: "https://hiresight-ai.onrender.com/api"
});

// Add a request interceptor to attach the auth token automatically
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle global errors (e.g., unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token unconditionally if unauthorized
      sessionStorage.removeItem("token");
      // Optionally redirect to login page if we aren't already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
export default api;
