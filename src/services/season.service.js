import httpClient from "../http-common";

const API_URL = "/api/seasons";

const seasonService = {
    // Obtener todas las temporadas
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo temporadas activas
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Obtener temporada por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Crear nueva temporada
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Actualizar temporada
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),
};

export default seasonService;