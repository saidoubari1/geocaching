import axios from 'axios';

export const API_URL = 'http://localhost:5000';

export const registerUser = (email, password) => {
  return axios.post(`${API_URL}/api/auth/register`, { email, password });
};

export const loginUser = (email, password) => {
  return axios.post(`${API_URL}/api/auth/login`, { email, password });
};

// Add more functions for geocache CRUD operations as needed.
