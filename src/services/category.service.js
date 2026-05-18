import httpClient from "../http-common";

const API_URL = "/api/categories";

const categoryService = {
    // Obtener todas las categorías
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo categorías activas
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Obtener categoría por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Crear nueva categoría
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Actualizar categoría
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),
};

export default categoryService;