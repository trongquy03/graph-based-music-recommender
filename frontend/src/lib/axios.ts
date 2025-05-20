import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "http://localhost:5000/api",
});
axiosInstance.interceptors.request.use(async (config) => {
  const token = await window.Clerk?.session?.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});