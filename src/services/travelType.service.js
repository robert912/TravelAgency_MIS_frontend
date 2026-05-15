import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/travel-types/');
}

const getAllActive = () => {
    return httpClient.get('/api/travel-types/active');
}

const get = id => {
    return httpClient.get(`/api/travel-types/${id}`);
}

const create = data => {
    return httpClient.post("/api/travel-types/", data);
}

const update = data => {
    return httpClient.put('/api/travel-types/', data);
}

export default { getAll, getAllActive, create, get, update };