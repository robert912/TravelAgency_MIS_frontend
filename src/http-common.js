import axios from "axios";
import keycloak from "./services/keycloak";

const travelApi = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: travelApi,
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