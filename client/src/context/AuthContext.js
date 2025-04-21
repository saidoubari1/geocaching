// client/src/Context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('userData');
      
      if (token && user) {
        setUserToken(token);
        setUserData(JSON.parse(user));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading auth data', error);
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token } = response.data;
      
      // Décoder le token pour extraire les infos utilisateur
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.id,
        _id: payload.id, // Pour compatibilité
        email: payload.email
      };
      
      setUserToken(token);
      setUserData(user);
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password) => {
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/auth/register`, { email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur d\'inscription'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUserToken(null);
    setUserData(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userData');
  };

  const updateUserAvatar = async (avatarUrl) => {
    if (userData) {
      const updatedUserData = { 
        ...userData, 
        avatar: { exists: true, url: avatarUrl } 
      };
      setUserData(updatedUserData);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        login, 
        register, 
        logout, 
        isLoading, 
        userToken, 
        userData,
        updateUserAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};