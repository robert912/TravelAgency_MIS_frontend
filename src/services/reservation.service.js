import httpClient from "../http-common";

const API_URL = "/api/reservations";

const reservationService = {
    // Obtener todas las reservas
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener reserva por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),

    // Obtener pasajeros de una reserva
    getPassengers: (reservationId) =>
        httpClient.get(`${API_URL}/${reservationId}/passengers`),

    // Crear reserva con DTO
    createReservation: (data) =>
        httpClient.post(`${API_URL}/create`, data),

    // Actualizar reserva
    update: (data) =>
        httpClient.put(`${API_URL}/`, data),

    // Cambiar estado de reserva
    changeStatus: (id, status) =>
        httpClient.put(`${API_URL}/${id}/status`, null, {
            params: { status },
        }),

    // Obtener reservas por persona
    getByPersonId: (personId) =>
        httpClient.get(`${API_URL}/person/${personId}`),
};

export default reservationService;