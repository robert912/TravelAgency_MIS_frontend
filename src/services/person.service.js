import httpClient from "../http-common";

const API_URL = "/api/persons";

const personService = {
    // Obtener todas las personas
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener solo personas activas
    getAllActive: () =>
        httpClient.get(`${API_URL}/active`),

    // Obtener persona por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Crear nueva persona
    create: (data) =>
        httpClient.post(`${API_URL}/`, data),

    // Actualizar persona
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),

    // Buscar persona por identificación o correo
    searchPerson: (query) =>
        httpClient.get(`${API_URL}/search`, {
            params: { query },
        }),
};

export default personService;