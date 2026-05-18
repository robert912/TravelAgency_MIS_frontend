import httpClient from "../http-common";

const API_URL = "/api/services";

const serviceService = {
    // Obtener todos los servicios
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo servicios activos
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Obtener servicio por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Crear nuevo servicio
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Actualizar servicio
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),
};

export default serviceService;