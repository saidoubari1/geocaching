// client/src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utiliser l'adresse IP que vous voyez dans votre terminal: exp://172.25.102.158:8081
export const API_URL = 'http://172.25.102.158:5000';

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
export const registerUser = async (email, password) => {
  try {
    const response = await api.post('/api/auth/register', { email, password });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur d\'inscription'
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    
    // Store token
    const { token } = response.data;
    await AsyncStorage.setItem('token', token);
    
    // Store user data from the token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userData = {
      id: payload.id,
      _id: payload.id, // Pour compatibilité
      email: payload.email
    };
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    
    return { success: true, token, user: userData };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Identifiants invalides'
    };
  }
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('userData');
};

// Geocache services
export const getAllGeocaches = async () => {
  try {
    const response = await api.get('/api/geocache');
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur lors de la récupération des geocaches'
    };
  }
};

export const getGeocacheById = async (id) => {
  try {
    const response = await api.get(`/api/geocache/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur lors de la récupération de la geocache'
    };
  }
};

export const createGeocache = async (geocacheData) => {
  try {
    const response = await api.post('/api/geocache', geocacheData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur lors de la création de la geocache'
    };
  }
};

export const updateGeocache = async (id, geocacheData) => {
  try {
    const response = await api.put(`/api/geocache/${id}`, geocacheData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur lors de la mise à jour de la geocache'
    };
  }
};

export const deleteGeocache = async (id) => {
  try {
    const response = await api.delete(`/api/geocache/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur lors de la suppression de la geocache'
    };
  }
};

export const addComment = async (id, comment) => {
  try {
    const response = await api.post(`/api/geocache/${id}/comment`, { comment });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur lors de l\'ajout du commentaire'
    };
  }
};

export const getNearbyGeocaches = async (latitude, longitude, radius = 5) => {
  try {
    const response = await api.get(`/api/geocache/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erreur lors de la récupération des geocaches à proximité'
    };
  }
};

export const markGeocacheAsFound = async (geocacheId, comment = '') => {
  try {
    const response = await api.post(`/api/geocache/${geocacheId}/found`, { comment });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors du marquage de la geocache comme trouvée'
    };
  }
};

export const getUserRanking = async () => {
  try {
    const response = await api.get('/api/users/ranking');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de la récupération du classement'
    };
  }
};

export const uploadUserAvatar = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await api.post('/api/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Erreur lors de l\'envoi de l\'avatar'
    };
  }
};

export default api;