import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/conditions/');
}

const getAllActive = () => {
    return httpClient.get('/api/conditions/active');
}

const create = data => {
    return httpClient.post("/api/conditions/", data);
}

const get = id => {
    return httpClient.get(`/api/conditions/${id}`);
}

const update = data => {
    return httpClient.put('/api/conditions/', data);
}

const remove = id => {
    return httpClient.delete(`/api/conditions/${id}`);
}

export default { getAll, getAllActive, create, get, update, remove };