import httpClient from "../http-common";

const API_URL = "/api/reservations";

const reservationService = {
    // Obtener todas las reservas
    getAll: () => {
        return httpClient.get(`${API_URL}/`);
    },

    // Obtener reservas activas (No se utiliza)
    getAllActive: () => {
        return httpClient.get(`${API_URL}/active`);
    },

    // Obtener reserva por ID
    get: (id) => {
        return httpClient.get(`${API_URL}/${id}`);
    },

    // Obtener pasajeros de una reserva
    getPassengers: (reservationId) => {
        return httpClient.get(`${API_URL}/${reservationId}/passengers`);
    },

    // Crear reserva con DTO (NUEVO MÉTODO)
    createReservation: (data) => {
        return httpClient.post(`${API_URL}/create`, data);
    },

    // Actualizar reserva
    update: (data) => {
        return httpClient.put(`${API_URL}/`, data);
    },

    // Cancelar reserva
    /*cancel: (id) => {
        return httpClient.delete(`${API_URL}/${id}`);
    },*/

    // Cambiar estado de reserva
    changeStatus: (id, status) => {
        return httpClient.patch(`${API_URL}/${id}/status`, null, { params: { status } });
    },

    // Obtener reservas por persona
    getByPersonId: (personId) => {
        return httpClient.get(`${API_URL}/person/${personId}`);
    },

    // Obtener reservas por paquete (No se utiliza)
    getByPackageId: (packageId) => {
        return httpClient.get(`${API_URL}/package/${packageId}`);
    },

    checkAvailability: (packageId) => {
        return httpClient.get(`/api/tour-packages/${packageId}/availability`);
    },

};

export default reservationService;