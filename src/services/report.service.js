import httpClient from "../http-common";

const API_URL = "/api/reports";

const reportService = {
    getSalesByPeriod: (startDate, endDate) => {
        return httpClient.get(`${API_URL}/sales`, {
            params: { startDate, endDate }
        });
    },

    getPackageRankingByPeriod: (startDate, endDate) => {
        return httpClient.get(`${API_URL}/package-ranking`, {
            params: { startDate, endDate }
        });
    },
};

export default reportService;
