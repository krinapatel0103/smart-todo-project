// axiosInstance.js
// Axios HTTP client setup base URL and JWT token auto-attachment.
// All API calls in the app will use this instance instead of plain axios.

import axios from 'axios';

// Frontend jis port pe chal raha hai, uske hisaab se sahi backend port choose karo
// Dev frontend (3001) -> Dev backend (8001)
// Prod frontend (3000) -> Prod backend (8000)
const currentPort = window.location.port;
const apiPort = currentPort === '3001' ? '8001' : '8000';
const baseURL = `http://${window.location.hostname}:${apiPort}`;

const axiosInstance = axios.create({
    baseURL: baseURL,
});

// Request Interceptor -> Har API call se pehle yeh chalega 
// localStorage se token lega aur Authorization header mein lagayega
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;