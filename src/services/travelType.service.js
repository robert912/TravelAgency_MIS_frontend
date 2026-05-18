import httpClient from "../http-common";

const API_URL = "/api/travel-types";

const travelTypeService = {
    // Obtener todos los tipos de viaje
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo tipos de viaje activos
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Obtener tipo de viaje por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Crear nuevo tipo de viaje
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Actualizar tipo de viaje
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),
};

export default travelTypeService;