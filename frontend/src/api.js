import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token
api.interceptors.request.use((config) => {
  const publicEndpoints = [
    '/auth/',
    '/invitations/verify',
    '/invitations/decline'
  ];
  
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    config.url?.includes(endpoint)
  );
  
  const isAcceptRegister = config.url?.includes('/invitations/accept-register');
  
  if (!isPublicEndpoint || isAcceptRegister) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

// Handle 401 and 403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      if (token && !isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        
        window.location.href = '/login?session=expired';
      }
    }
    
    if (error.response?.status === 403) {
      console.warn('Access denied for request:', error.config?.url);
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
  verify: (token) => api.get(`/invitations/verify?token=${token}`),
  accept: (token) => api.post(`/invitations/accept?token=${token}`),
  acceptAndRegister: (token) => api.post(`/invitations/accept-register?token=${token}`),
  decline: (token) => api.post(`/invitations/decline?token=${token}`)
};

// Notifications API
export const notificationsAPI = {
  getAll: (page = 0, size = 20) => api.get('/notifications', { params: { page, size } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

// Health Check API
export const healthAPI = {
  checkEventService: () => api.get('/events', { params: { limit: 1 } }),
  checkNotificationService: () => api.get('/notifications', { params: { limit: 1 } })
};

export default api;
