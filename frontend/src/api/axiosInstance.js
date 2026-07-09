// axiosInstance.js
// Axios HTTP client setup base URL and JWT token auto-attachment.
// All API calls in the app will use this instance instead of plain axios.

import axios from 'axios';

// Frontend jis port pe chal raha hai, uske hisaab se sahi backend port choose karo
// Dev frontend (3001) -> Dev backend (8001)
// Prod frontend (3000) -> Prod backend (8000)
// Domain access (no port, HTTPS) -> Nginx reverse proxy ke /api route se

const currentPort = window.location.port;

let baseURL;
if (currentPort === '3001') {
    baseURL = `http://${window.location.hostname}:8001`;
} else if (currentPort === '3000') {
    baseURL = `http://${window.location.hostname}:8000`;
} else {
    // Domain se access ho raha hai (koi port nahi URL mein) — Nginx proxy use karo
    baseURL = '/api';
}

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