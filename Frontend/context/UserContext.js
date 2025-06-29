import React, { createContext, useState } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);


  const backendUrl = 'http://172.31.243.24:5000';


  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = 'talent') => {
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/auth/register`, { name, email, password, role });
      setUser(res.data.user);
      setToken(res.data.token);
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updateData) => {
    if (!token) throw new Error('User not authenticated');
    setLoading(true);
    try {
      const res = await axios.put(`${backendUrl}/api/users/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTalentProfile = async (talentData) => {
    if (!token) throw new Error('User not authenticated');
    setLoading(true);
    try {
      const res = await axios.put(`${backendUrl}/api/users/talent-profile`, talentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async () => {
    if (!token) throw new Error('User not authenticated');
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateProfile,
        updateTalentProfile,
        getUserProfile,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
