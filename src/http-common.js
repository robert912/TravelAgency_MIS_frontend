import axios from "axios";
import keycloak from "./services/keycloak";

const payrollBackendServer = import.meta.env.VITE_BACKEND_SERVER;
const payrollBackendPort = import.meta.env.VITE_BACKEND_PORT;

const api = axios.create({
    baseURL: `http://${payrollBackendServer}:${payrollBackendPort}`,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    await keycloak.updateToken(30);
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;