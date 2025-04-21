// client/src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utiliser l'adresse IP que vous voyez dans votre terminal: exp://172.25.102.158:8081
export const API_URL = 'http://172.25.102.158:5000/api';

// Create an axios instance with authorization header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const registerUser = (email, password) => {
  return api.post('/api/auth/register', { email, password });
};

export const loginUser = (email, password) => {
  return api.post('/api/auth/login', { email, password });
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('token');
};

// Geocache services
export const getAllGeocaches = () => {
  return api.get('/api/geocache');
};

export const getGeocacheById = (id) => {
  return api.get(`/api/geocache/${id}`);
};

export const createGeocache = (geocacheData) => {
  return api.post('/api/geocache', geocacheData);
};

export const updateGeocache = (id, geocacheData) => {
  return api.put(`/api/geocache/${id}`, geocacheData);
};

export const deleteGeocache = (id) => {
  return api.delete(`/api/geocache/${id}`);
};

export const addComment = (id, comment) => {
  return api.post(`/api/geocache/${id}/comment`, { comment });
};

export default api;