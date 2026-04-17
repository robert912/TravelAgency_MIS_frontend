import httpClient from "../http-common";

/* Obtener condiciones activas de un paquete específico */
const getActiveByPackageId = (packageId) => {
    return httpClient.get(`/api/tour-package-conditions/package/${packageId}/active`);
}

/* Obtener todas las condiciones de un paquete (incluye inactivas) */
const getAllByPackageId = (packageId) => {
    return httpClient.get(`/api/tour-package-conditions/package/${packageId}/all`);
}

/* Sincronizar condiciones (Envía Map<String, List<Long>>) */
const syncConditions = (packageId, conditionIds, userId = 1) => {
    return httpClient.put(`/api/tour-package-conditions/package/${packageId}/sync`,
        { conditionIds },
        { params: { userId } }
    );
}

export default { getActiveByPackageId, getAllByPackageId, syncConditions };