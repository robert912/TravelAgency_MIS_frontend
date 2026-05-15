import httpClient from "../http-common";

/* Sincronizar restricciones (Envía Map<String, List<Long>>) */
const syncRestrictions = (packageId, restrictionIds, userId = 1) => {
    return httpClient.put(`/api/tour-package-restrictions/package/${packageId}/sync`,
        { restrictionIds },
        { params: { userId } }
    );
}

export default { syncRestrictions };