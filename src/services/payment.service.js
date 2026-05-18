import httpClient from "../http-common";

const API_URL = "/api/payments";

const paymentService = {
    // Procesar pago
    processPayment: (data) =>
        httpClient.post(`${API_URL}/process`, data),

    // Obtener pago por reserva
    getByReservationId: (reservationId) =>
        httpClient.get(`${API_URL}/reservation/${reservationId}`),

    // Obtener todos los pagos
    getAll: () =>
        httpClient.get(`${API_URL}/`),

    // Obtener pago por ID
    get: (id) =>
        httpClient.get(`${API_URL}/${id}`),
};

export default paymentService;