import httpClient from "../http-common";

const API_URL = "/api/tour-packages";

const tourPackageService = {
    // Obtener todos los paquetes turísticos
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo paquetes activos
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Buscar paquetes con filtros
    searchFilter: (filters) =>
        httpClient.get(`${API_URL}/search`, {
            params: filters,
        }),

    // Crear nuevo paquete turístico
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Obtener paquete por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Actualizar paquete turístico
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),

    // Activar o desactivar paquete turístico
    toggleActive: (data) =>
        httpClient.put(`${API_URL}/`, data),

    // Obtener disponibilidad del paquete
    getAvailability: (packageId) =>
        httpClient.get(`${API_URL}/${packageId}/availability`),

    // Verificar disponibilidad para una cantidad específica
    checkAvailabilityForQuantity: (packageId, quantity) =>
        httpClient.get(`${API_URL}/${packageId}/availability/check`, {
            params: { quantity },
        }),
};

export default tourPackageService;