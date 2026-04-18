import httpClient from "../http-common";

const API_URL = "/api/persons";

const personService = {
    // Obtener todas las personas
    getAll: () => {
        return httpClient.get(`${API_URL}/`);
    },

    // Obtener solo personas activas
    getAllActive: () => {
        return httpClient.get(`${API_URL}/active`);
    },

    // Obtener persona por ID
    get: (id) => {
        return httpClient.get(`${API_URL}/${id}`);
    },

    // Crear nueva persona
    create: (data) => {
        return httpClient.post(`${API_URL}/`, data);
    },

    // Actualizar persona
    update: (data) => {
        return httpClient.put(`${API_URL}/`, data);
    },

    // Desactivar persona (borrado lógico)
    delete: (id) => {
        return httpClient.delete(`${API_URL}/${id}`);
    },

    // Buscar personas por filtros
    search: (filters) => {
        return httpClient.get(`${API_URL}/search`, { params: filters });
    }
};

export default personService;