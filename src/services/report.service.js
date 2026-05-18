import httpClient from "../http-common";

const API_URL = "/api/reports";

const reportService = {
    // Obtener ventas por período
    getSalesByPeriod: (startDate, endDate) =>
        httpClient.get(`${API_URL}/sales`, {
            params: { startDate, endDate },
        }),

    // Obtener ranking de paquetes por período
    getPackageRankingByPeriod: (startDate, endDate) =>
        httpClient.get(`${API_URL}/package-ranking`, {
            params: { startDate, endDate },
        }),
};

export default reportService;