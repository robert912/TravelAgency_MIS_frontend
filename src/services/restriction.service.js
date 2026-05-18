import httpClient from "../http-common";

const API_URL = "/api/restrictions";

const restrictionService = {
    // Obtener todas las restricciones
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo restricciones activas
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Obtener restricción por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Crear nueva restricción
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Actualizar restricción
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),
};

export default restrictionService;