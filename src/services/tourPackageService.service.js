import httpClient from "../http-common";

/* Sincronizar servicios (Envía Map<String, List<Long>>) */
const syncServices = (packageId, serviceIds, userId = 1) => {
    return httpClient.put(`/api/tour-package-services/package/${packageId}/sync`,
        { serviceIds },
        { params: { userId } }
    );
}

export default { syncServices };