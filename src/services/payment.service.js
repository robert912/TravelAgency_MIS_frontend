import httpClient from "../http-common";

const API_URL = "/api/payments";

const paymentService = {
    // Obtener todos los pagos
    getAll: () => {
        return httpClient.get(`${API_URL}/`);
    },

    // Obtener pago por ID
    get: (id) => {
        return httpClient.get(`${API_URL}/${id}`);
    },

    // Crear nuevo pago
    create: (data) => {
        return httpClient.post(`${API_URL}/`, data);
    },

    // Actualizar pago
    update: (data) => {
        return httpClient.put(`${API_URL}/`, data);
    },

    // Obtener pagos por reserva
    getByReservationId: (reservationId) => {
        return httpClient.get(`${API_URL}/reservation/${reservationId}`);
    },

    // Registrar pago de reserva
    registerPayment: (reservationId, paymentData) => {
        return httpClient.post(`${API_URL}/reservation/${reservationId}/pay`, paymentData);
    }
};

export default paymentService;