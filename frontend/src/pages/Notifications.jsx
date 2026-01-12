import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchNotifications(true);
      }, 4000); // 4 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const response = await notificationsAPI.getAll();
      setNotifications(response.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
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
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (4s)</span>
          </label>
          <button onClick={() => fetchNotifications()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {lastRefresh && (
        <p className="last-refresh">
          Last updated: {formatDate(lastRefresh)}
        </p>
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
                <tr key={notification.id} className="notification-row">
                  <td>
                    <span className={`notification-type-badge type-${notification.type.toLowerCase()}`}>
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                  </td>
                  <td className="notification-message">{notification.message}</td>
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
        </div>
      )}
    </div>
  );
}

export default Notifications;
