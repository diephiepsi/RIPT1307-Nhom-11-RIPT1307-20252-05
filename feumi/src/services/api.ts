import axios from "axios";
import { storage } from "./storage";

const clientBase =
  process.env.API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  process.env.UMI_APP_API_URL ||
  "https://ript1307-backend.onrender.com/api";

export const api = axios.create({
  baseURL: clientBase,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = storage.getToken();

  if (token && config.headers) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});
