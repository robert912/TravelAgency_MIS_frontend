import httpClient from "../http-common";

const API_URL = "/api/reservations";

const reservationService = {
    // Obtener todas las reservas
    getAll: () => {
        return httpClient.get(`${API_URL}/`);
    },

    // Obtener reservas activas
    getAllActive: () => {
        return httpClient.get(`${API_URL}/active`);
    },

    // Obtener reserva por ID
    get: (id) => {
        return httpClient.get(`${API_URL}/${id}`);
    },

    // Crear nueva reserva
    create: (data) => {
        return httpClient.post(`${API_URL}/`, data);
    },

    // Actualizar reserva
    update: (data) => {
        return httpClient.put(`${API_URL}/`, data);
    },

    // Cancelar reserva (borrado lógico)
    cancel: (id) => {
        return httpClient.delete(`${API_URL}/${id}`);
    },

    // Cambiar estado de reserva
    changeStatus: (id, status, userId = 1) => {
        return httpClient.patch(`${API_URL}/${id}/status`, null, {
            params: { status, userId }
        });
    },

    // Obtener reservas por persona
    getByPersonId: (personId) => {
        return httpClient.get(`${API_URL}/person/${personId}`);
    },

    // Obtener reservas por paquete
    getByPackageId: (packageId) => {
        return httpClient.get(`${API_URL}/package/${packageId}`);
    },

    // Obtener reservas por estado
    getByStatus: (status) => {
        return httpClient.get(`${API_URL}/status/${status}`);
    },

    // Obtener reservas próximas a vencer
    getExpiringSoon: (days = 3) => {
        return httpClient.get(`${API_URL}/expiring-soon`, { params: { days } });
    },

    // Buscar reservas con filtros
    search: (filters) => {
        return httpClient.get(`${API_URL}/search`, { params: filters });
    }
};

export default reservationService;