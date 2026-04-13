import axios from "axios";

const payrollBackendServer = import.meta.env.VITE_BACKEND_SERVER;
const payrollBackendPort = import.meta.env.VITE_BACKEND_PORT;

export default axios.create({
    baseURL: `http://${payrollBackendServer}:${payrollBackendPort}`,
    headers: {
        'Content-Type': 'application/json'
    }
});