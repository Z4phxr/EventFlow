import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api';
import { useAuth } from '../auth/AuthContext';

function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchNotifications(true);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (liveUpdates) {
      connectToSSE();
    } else {
      disconnectFromSSE();
    }
    
    return () => {
      disconnectFromSSE();
    };
  }, [liveUpdates]);

  const connectToSSE = () => {
    const token = localStorage.getItem('token');
    
    if (!token || !user || !user.id) {
      console.error('Missing token or user ID for SSE connection');
      setError('Authentication required for live updates');
      setLiveUpdates(false);
      return;
    }

    const sseUrl = `${window.location.origin}/api/notifications/stream?userId=${user.id}`;
    
    console.log('Connecting to SSE:', sseUrl);
    const es = new EventSource(sseUrl);
    
    es.onopen = () => {
      console.log('SSE connection opened');
      setError('');
    };
    
    es.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('Received SSE notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        setPagination(prev => ({
          ...prev,
          totalElements: prev.totalElements + 1
        }));
        // Trigger navbar refresh
        window.dispatchEvent(new CustomEvent('notification-marked-read'));
        setTimeout(() => {
          const element = document.querySelector(`[data-notification-id="${notification.id}"]`);
          if (element) {
            element.classList.add('new-notification-highlight');
            setTimeout(() => element.classList.remove('new-notification-highlight'), 3000);
          }
        }, 100);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    });
    
    es.addEventListener('connect', (event) => {
      console.log('SSE connected:', event.data);
    });
    
    es.onerror = (error) => {
      console.error('SSE error:', error);
      setError('Live updates connection failed. Falling back to auto-refresh.');
      setLiveUpdates(false);
    };
    
    setEventSource(es);
  };

  const disconnectFromSSE = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const response = await notificationsAPI.getAll(0, pagination.size);
      const data = response.data;
      
      setNotifications(data.content || []);
      setPagination({
        page: data.number || 0,
        size: data.size || 20,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0,
        hasMore: (data.number || 0) < (data.totalPages || 0) - 1
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadMoreNotifications = async () => {
    try {
      setLoadingMore(true);
      setError('');
      const nextPage = pagination.page + 1;
      const response = await notificationsAPI.getAll(nextPage, pagination.size);
      const data = response.data;
      
      setNotifications(prev => [...prev, ...(data.content || [])]);
      setPagination({
        page: data.number || nextPage,
        size: data.size || 20,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || 0,
        hasMore: (data.number || nextPage) < (data.totalPages || 0) - 1
      });
    } catch (err) {
      console.error('Failed to load more notifications:', err);
      setError('Failed to load more notifications. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      window.dispatchEvent(new CustomEvent('notification-marked-read'));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to mark notification as read.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent('notification-marked-read'));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to mark all notifications as read.');
    }
  };

  const formatDate = (dateValue) => {
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute, second] = dateValue;
      const date = new Date(year, month - 1, day, hour, minute, second);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    return new Date(dateValue).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getNotificationTypeLabel = (type) => {
    const typeMap = {
      'EVENT_CREATED': 'Event Created',
      'EVENT_UPDATED': 'Event Updated',
      'EVENT_DELETED': 'Event Deleted',
      'USER_REGISTERED': 'User Registered',
      'USER_UNREGISTERED': 'User Unregistered'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Notifications</h1>
        <div className="header-actions">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={liveUpdates}
              onChange={(e) => setLiveUpdates(e.target.checked)}
            />
            <span>Live updates (SSE)</span>
          </label>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              disabled={liveUpdates}
            />
            <span>Auto-refresh (4s)</span>
          </label>
          <button onClick={() => fetchNotifications()} disabled={loading}>
            Refresh
          </button>
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="button button-secondary"
              disabled={loading}
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {lastRefresh && (
        <div className="pagination-info">
          <p className="last-refresh">Last updated: {formatDate(lastRefresh)}</p>
          <p className="page-info">
            Showing {notifications.length} of {pagination.totalElements} notifications
            {pagination.totalPages > 1 && ` (Page ${pagination.page + 1} of ${pagination.totalPages})`}
          </p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications yet</p>
          <p className="empty-state-hint">
            Notifications appear when events are created, updated, deleted, or when users register/unregister.
          </p>
        </div>
      ) : (
        <div className="notifications-container">
          <table className="notifications-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Message</th>
                <th>Created At</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr 
                  key={notification.id}
                  data-notification-id={notification.id}
                  className={`notification-row ${
                    !notification.read ? 'notification-unread' : 'notification-read'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  style={{ cursor: !notification.read ? 'pointer' : 'default' }}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <span className={`notification-type-badge type-${notification.type.toLowerCase()}`}>
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                    </div>
                  </td>
                  <td className={`notification-message ${
                    !notification.read ? 'font-semibold' : ''
                  }`}>
                    {notification.message}
                  </td>
                  <td className="notification-date">{formatDate(notification.createdAt)}</td>
                  <td className="notification-details">
                    {notification.eventId && (
                      <span className="detail-badge">Event #{notification.eventId}</span>
                    )}
                    {notification.userId && (
                      <span className="detail-badge">User #{notification.userId}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {pagination.hasMore && (
            <div className="load-more-container">
              <button
                onClick={loadMoreNotifications}
                disabled={loadingMore}
                className="button button-secondary load-more-btn"
              >
                {loadingMore ? 'Loading...' : `Load More (${pagination.totalElements - notifications.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
