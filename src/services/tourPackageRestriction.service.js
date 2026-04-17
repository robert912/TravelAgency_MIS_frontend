import httpClient from "../http-common";

/* Obtener restricciones activas de un paquete específico */
const getActiveByPackageId = (packageId) => {
    return httpClient.get(`/api/tour-package-restrictions/package/${packageId}/active`);
}

/* Obtener todas las restricciones de un paquete (incluye inactivas) */
const getAllByPackageId = (packageId) => {
    return httpClient.get(`/api/tour-package-restrictions/package/${packageId}/all`);
}

/* Sincronizar restricciones (Envía Map<String, List<Long>>) */
const syncRestrictions = (packageId, restrictionIds, userId = 1) => {
    return httpClient.put(`/api/tour-package-restrictions/package/${packageId}/sync`,
        { restrictionIds },
        { params: { userId } }
    );
}

export default { getActiveByPackageId, getAllByPackageId, syncRestrictions };