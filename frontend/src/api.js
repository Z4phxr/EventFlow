import axios from 'axios';

// In development (Vite dev server), use the proxy configured in vite.config.js
// In production (Docker/nginx), use relative path to let nginx proxy handle it
// For direct access (e.g., testing), can override with VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired/invalid JWT)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if we have a token stored (meaning it was invalid/expired)
    // Don't redirect for login/register endpoints
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      if (token && !isAuthEndpoint) {
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        
        // Redirect to login with message
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getMyEvents: () => api.get('/events/my'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getWeather: (id) => api.get(`/events/${id}/weather`)
};

// Registrations API
export const registrationsAPI = {
  register: (eventId) => api.post(`/events/${eventId}/registrations`),
  unregister: (eventId) => api.delete(`/events/${eventId}/registrations/me`),
  checkRegistration: (eventId) => api.get(`/events/${eventId}/registrations/me`),
  getEventRegistrations: (eventId) => api.get(`/events/${eventId}/registrations`)
};

// Invitations API
export const invitationsAPI = {
  create: (eventId, email) => api.post(`/events/${eventId}/invitations`, { email }),
  list: (eventId) => api.get(`/events/${eventId}/invitations`),
  accept: (token) => api.post(`/invitations/accept?token=${token}`),
  decline: (token) => api.post(`/invitations/decline?token=${token}`)
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications')
};

// Health Check API (for demo dashboard)
export const healthAPI = {
  checkEventService: () => api.get('/events', { params: { limit: 1 } }),
  checkNotificationService: () => api.get('/notifications', { params: { limit: 1 } })
};

export default api;
