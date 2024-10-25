import axios from 'axios';
import io from 'socket.io-client';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const socket = io();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email: string, password: string) => api.post('/login', { email, password });
export const register = (userData: any) => api.post('/register', userData);
export const refreshToken = () => api.post('/refresh-token');

// Users
export const getUsers = (page: number = 1, limit: number = 10) => api.get(`/users?page=${page}&limit=${limit}`);
export const updateProfile = (profileData: any) => api.put('/profile', profileData);
export const submitReview = (reviewData: any) => api.post('/reviews', reviewData);
export const reportUser = (reportData: any) => api.post('/report', reportData);
export const blockUser = (blockData: any) => api.post('/block', blockData);
export const unblockUser = (blockData: any) => api.delete('/block', { data: blockData });

// Chats
export const getChats = (userId: string) => api.get(`/chats/${userId}`);
export const getMessages = (userId1: string, userId2: string, page: number = 1, limit: number = 10) => 
  api.get(`/messages/${userId1}/${userId2}?page=${page}&limit=${limit}`);
export const getRoomMessages = (roomId: string, page: number = 1, limit: number = 10) => 
  api.get(`/room-messages/${roomId}?page=${page}&limit=${limit}`);
export const sendMessage = (senderId: string, receiverId: string | null, roomId: string | null, text: string) => 
  api.post('/messages', { senderId, receiverId, roomId, text });

// Rooms
export const getRooms = (page: number = 1, limit: number = 10) => api.get(`/rooms?page=${page}&limit=${limit}`);
export const createRoom = (roomData: any) => api.post('/rooms', roomData);
export const joinRoom = (roomId: string, userId: string) => api.post(`/rooms/${roomId}/join`, { userId });
export const leaveRoom = (roomId: string, userId: string) => api.post(`/rooms/${roomId}/leave`, { userId });
export const assignCoHost = (roomId: string, userId: string) => api.post(`/rooms/${roomId}/assign-cohost`, { userId });

// Notifications
export const getNotifications = (userId: number) => api.get(`/notifications/${userId}`);
export const addNotification = (notificationData: any) => api.post('/notifications', notificationData);
export const markNotificationAsRead = (id: number) => api.put(`/notifications/${id}/read`);
export const deleteNotification = (id: number) => api.delete(`/notifications/${id}`);
export const clearNotifications = (userId: number) => api.delete(`/notifications/user/${userId}`);

export default api;