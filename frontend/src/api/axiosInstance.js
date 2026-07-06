// axiosInstance.js
// Axios HTTP client setup base URL and JWT token auto-attachment.
// All API calls in the app will use this instance instead of plain axios.

import axios from 'axios';

// baseURL -> FastAPI server address - har request mein automatically lagega
const axiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:8000',
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