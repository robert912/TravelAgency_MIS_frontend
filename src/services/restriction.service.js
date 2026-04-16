import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/restrictions/');
};

const getAllActive = () => {
    return httpClient.get('/api/restrictions/active');
};

const get = id => {
    return httpClient.get(`/api/restrictions/${id}`);
};

const create = data => {
    return httpClient.post("/api/restrictions/", data);
};

const update = data => {
    return httpClient.put('/api/restrictions/', data);
};

const remove = id => {
    return httpClient.delete(`/api/restrictions/${id}`);
};

export default { getAll, getAllActive, get, create, update, remove };