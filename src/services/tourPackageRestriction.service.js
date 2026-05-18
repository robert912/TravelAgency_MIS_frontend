import httpClient from "../http-common";

const API_URL = "/api/tour-package-restrictions";

const tourPackageRestrictionService = {
    // Sincronizar restricciones del paquete turístico
    syncRestrictions: (packageId, restrictionIds, userId = 1) =>
        httpClient.put(
            `${API_URL}/package/${packageId}/sync`,
            { restrictionIds },
            {
                params: { userId },
            }
        ),
};

export default tourPackageRestrictionService;