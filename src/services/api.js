import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://laravel-backend-sixs.onrender.com/api'
    : 'http://127.0.0.1:8001/api',
});

// Intercepteur : ajoute automatiquement le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
