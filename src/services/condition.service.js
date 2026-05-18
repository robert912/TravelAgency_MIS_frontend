import httpClient from "../http-common";

const API_URL = "/api/conditions";

const conditionService = {
    // Obtener todas las condiciones
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo condiciones activas
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Obtener condición por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Crear nueva condición
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Actualizar condición
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),
};

export default conditionService;