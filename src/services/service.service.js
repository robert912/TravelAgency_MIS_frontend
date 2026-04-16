import httpClient from "../http-common";

const getAll = () => httpClient.get('/api/services/');
const getAllActive = () => httpClient.get('/api/services/active');
const get = id => httpClient.get(`/api/services/${id}`);
const create = data => httpClient.post("/api/services/", data);
const update = data => httpClient.put('/api/services/', data);
const remove = id => httpClient.delete(`/api/services/${id}`);

export default { getAll, getAllActive, get, create, update, remove };