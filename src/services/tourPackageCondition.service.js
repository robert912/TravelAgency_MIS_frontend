import httpClient from "../http-common";

/* Sincronizar condiciones (Envía Map<String, List<Long>>) */
const syncConditions = (packageId, conditionIds, userId = 1) => {
    return httpClient.put(`/api/tour-package-conditions/package/${packageId}/sync`,
        { conditionIds },
        { params: { userId } }
    );
}

export default { syncConditions };