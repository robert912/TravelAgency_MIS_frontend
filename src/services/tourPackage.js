import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/tour-packages/');
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

const remove = id => {
    return httpClient.delete(`/api/tour-packages/${id}`);
}

export default { getAll, create, get, update, remove };