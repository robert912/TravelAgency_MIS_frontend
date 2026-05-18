import httpClient from "../http-common";

const API_URL = "/api/tour-package-services";

const tourPackageServiceService = {
    // Sincronizar servicios del paquete turístico
    syncServices: (packageId, serviceIds, userId = 1) =>
        httpClient.put(
            `${API_URL}/package/${packageId}/sync`,
            { serviceIds },
            {
                params: { userId },
            }
        ),
};

export default tourPackageServiceService;