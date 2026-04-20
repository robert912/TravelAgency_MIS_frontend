import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/tour-packages/');
}

const getAllActive = () => {
    return httpClient.get('/api/tour-packages/active');
}

const searchFilter = (filters) => {
    return httpClient.get('/api/tour-packages/search', {
        params: filters
    });
}

const create = data => {
    return httpClient.post('/api/tour-packages/', data);
}

const get = id => {
    return httpClient.get(`/api/tour-packages/${id}`);
}

const update = data => {
    return httpClient.put('/api/tour-packages/', data);
}

const toggleActive = data => {
    return httpClient.put('/api/tour-packages/', data);
}

const getAvailability = (packageId) => {
    return httpClient.get(`/api/tour-packages/${packageId}/availability`);
}

const checkAvailabilityForQuantity = (packageId, quantity) => {
    return httpClient.get(`/api/tour-packages/${packageId}/availability/check`, {
        params: { quantity }
    });
}

export default { getAll, getAllActive, searchFilter, create, get, update, toggleActive, getAvailability, checkAvailabilityForQuantity };