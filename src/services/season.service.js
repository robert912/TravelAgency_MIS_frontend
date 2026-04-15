import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/seasons/');
}

const getAllActive = () => {
    return httpClient.get('/api/seasons/active');
}

const create = data => {
    return httpClient.post("/api/seasons/", data);
}

const get = id => {
    return httpClient.get(`/api/seasons/${id}`);
}

const update = data => {
    return httpClient.put('/api/seasons/', data);
}

const remove = id => {
    return httpClient.delete(`/api/seasons/${id}`);
}
export default { getAll, getAllActive, create, get, update, remove };