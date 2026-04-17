import httpClient from "../http-common";

/* Obtener servicios activos de un paquete específico */
const getActiveByPackageId = (packageId) => {
    return httpClient.get(`/api/tour-package-services/package/${packageId}/active`);
}

/* Obtener todos los servicios de un paquete (incluye inactivos) */
const getAllByPackageId = (packageId) => {
    return httpClient.get(`/api/tour-package-services/package/${packageId}/all`);
}

/* Sincronizar servicios (Envía Map<String, List<Long>>) */
const syncServices = (packageId, serviceIds, userId = 1) => {
    return httpClient.put(`/api/tour-package-services/package/${packageId}/sync`,
        { serviceIds },
        { params: { userId } }
    );
}

export default { getActiveByPackageId, getAllByPackageId, syncServices };