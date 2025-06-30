import React, { createContext, useState } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const backendUrl = 'http://192.168.1.231:5000';

  // --- AUTHENTICATION ---
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

  const logout = () => {
    setUser(null);
    setToken(null);
  };
  
  // --- USER PROFILE ---
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
  
  // --- POSTINGS (JOBS & PROJECTS) ---
  const getJobs = async () => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.get(`${backendUrl}/api/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const getProjects = async () => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.get(`${backendUrl}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // --- RECOMMENDATIONS & INVITATIONS ---
  const getRecommendations = async (type, id) => {
    if (!token) throw new Error('User not authenticated');
    const resourceType = type === 'job' ? 'jobs' : 'projects';
    const url = `${backendUrl}/api/${resourceType}/${id}/recommendations`;
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res;
    } catch (err) {
      throw err;
    }
  };

  const sendInvitation = async (payload) => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.post(`${backendUrl}/api/invitations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const getMyInvitations = async () => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.get(`${backendUrl}/api/invitations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res;
    } catch (err) {
      throw err;
    }
  };

  const respondToInvitation = async (invitationId, status) => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.patch(`${backendUrl}/api/invitations/${invitationId}/respond`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res;
    } catch (err) {
      throw err;
    }
  };

  // --- NOTIFICATIONS ---
  const getMyNotifications = async () => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.get(`${backendUrl}/api/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res;
    } catch (err) {
      throw err;
    }
  };

  // --- CHAT / MESSAGING ---
  const getMessages = async (conversationId) => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.get(`${backendUrl}/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const sendMessage = async (conversationId, text) => {
    if (!token) throw new Error('User not authenticated');
    try {
      const res = await axios.post(`${backendUrl}/api/conversations/${conversationId}/messages`, 
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updateTalentProfile,
        getUserProfile,
        getJobs,
        getProjects,
        getRecommendations,
        sendInvitation,
        getMyInvitations,
        respondToInvitation,
        getMyNotifications,
        getMessages,
        sendMessage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};