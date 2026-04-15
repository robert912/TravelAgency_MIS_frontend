import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/categories/');
}

const getAllActive = () => {
    return httpClient.get('/api/categories/active');
}

const create = data => {
    return httpClient.post("/api/categories/", data);
}

const get = id => {
    return httpClient.get(`/api/categories/${id}`);
}

const update = data => {
    return httpClient.put('/api/categories/', data);
}

const remove = id => {
    return httpClient.delete(`/api/categories/${id}`);
}
export default { getAll, getAllActive, create, get, update, remove };