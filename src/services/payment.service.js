import httpClient from "../http-common";

const API_URL = "/api/payments";

const paymentService = {
    // Procesar pago
    processPayment: (data) => {
        return httpClient.post(`${API_URL}/process`, data);
    },
    
    // Obtener pago por reserva
    getByReservationId: (reservationId) => {
        return httpClient.get(`${API_URL}/reservation/${reservationId}`);
    },
    
    // Obtener todos los pagos
    getAll: () => {
        return httpClient.get(`${API_URL}/`);
    },
    
    // Obtener pago por ID
    get: (id) => {
        return httpClient.get(`${API_URL}/${id}`);
    }
};

export default paymentService;