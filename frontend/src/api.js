import axios from 'axios';

const api = axios.create({
  baseURL: '', // Left blank intentional: points directly to local dev server proxy routing rules
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;