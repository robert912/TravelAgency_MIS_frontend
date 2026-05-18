import httpClient from "../http-common";

const API_URL = "/api/tour-package-conditions";

const tourPackageConditionService = {
    // Sincronizar condiciones del paquete turístico
    syncConditions: (packageId, conditionIds, userId = 1) =>
        httpClient.put(
            `${API_URL}/package/${packageId}/sync`,
            { conditionIds },
            {
                params: { userId },
            }
        ),
};

export default tourPackageConditionService;