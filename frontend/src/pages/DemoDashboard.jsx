import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { eventsAPI, registrationsAPI, notificationsAPI, healthAPI, invitationsAPI } from '../api';
import { Link } from 'react-router-dom';

function DemoDashboard() {
  const { user, hasRole } = useAuth();
  const [demoEventId, setDemoEventId] = useState(null);
  const [availableEvents, setAvailableEvents] = useState([]);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const decoded = JSON.parse(jsonPayload);
      console.log('Decoded JWT:', decoded);
      return decoded.userId;
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return null;
    }
  };
  const [message, setMessage] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotifications, setNewNotifications] = useState([]);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [eventSource, setEventSource] = useState(null);
  const [sseEnabled, setSseEnabled] = useState(false);
  const [serviceHealth, setServiceHealth] = useState({
    userService: { status: 'unknown', lastChecked: null },
    eventService: { status: 'unknown', lastChecked: null },
    notificationService: { status: 'unknown', lastChecked: null },
    rabbitmq: { status: 'configured', lastChecked: null }
  });

  useEffect(() => {
    checkServicesHealth();
    fetchUnreadCount();
    fetchAvailableEvents();
  }, []);

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const fetchAvailableEvents = async () => {
    try {
      const response = await eventsAPI.getAll(0, 50);
      const events = response.data.content || response.data;
      setAvailableEvents(events);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const checkServicesHealth = async () => {
    setServiceHealth(prev => ({
      ...prev,
      rabbitmq: { status: 'configured', lastChecked: new Date() }
    }));

    try {
      setServiceHealth(prev => ({
        ...prev,
        userService: { status: 'configured', lastChecked: new Date() }
      }));
    } catch (err) {
      setServiceHealth(prev => ({
        ...prev,
        userService: { status: 'fail', lastChecked: new Date() }
      }));
    }

    // Check Event Service
    try {
      await healthAPI.checkEventService();
      setServiceHealth(prev => ({
        ...prev,
        eventService: { status: 'ok', lastChecked: new Date() }
      }));
    } catch (err) {
      setServiceHealth(prev => ({
        ...prev,
        eventService: { status: 'fail', lastChecked: new Date() }
      }));
    }

    // Check Notification Service
    try {
      await healthAPI.checkNotificationService();
      setServiceHealth(prev => ({
        ...prev,
        notificationService: { status: 'ok', lastChecked: new Date() }
      }));
    } catch (err) {
      setServiceHealth(prev => ({
        ...prev,
        notificationService: { status: 'fail', lastChecked: new Date() }
      }));
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const connectToSSE = () => {
    // Get user ID from user context or decode from token
    const userId = user?.id || getUserIdFromToken();
    
    if (!userId) {
      setMessage({ text: 'User ID not available for SSE connection', type: 'error' });
      console.error('User object:', user);
      return;
    }

    const sseUrl = `/api/notifications/stream?userId=${userId}`;
    console.log('Connecting to SSE:', sseUrl, 'User ID:', userId);
    const es = new EventSource(sseUrl);

    es.onopen = () => {
      console.log('SSE connection opened');
      setMessage({ text: 'Live notifications connected', type: 'success' });
    };

    es.addEventListener('notification', (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log('Received SSE notification:', notification);
        setNewNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      } catch (err) {
        console.error('Failed to parse SSE notification:', err);
      }
    });

    es.onerror = (error) => {
      console.error('SSE error:', error);
      es.close();
      setSseEnabled(false);
      setMessage({ text: 'Live notifications disconnected', type: 'info' });
    };

    setEventSource(es);
  };

  const disconnectFromSSE = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      console.log('SSE disconnected');
    }
  };

  const toggleSSE = () => {
    if (sseEnabled) {
      disconnectFromSSE();
      setSseEnabled(false);
    } else {
      connectToSSE();
      setSseEnabled(true);
    }
  };

  const handleCreateDemoEvent = async () => {
    if (!hasRole(['ORGANIZER', 'ADMIN'])) {
      setMessage({ text: 'Only organizers/admins can create events', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const now = new Date();
      const startAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const endAt = new Date(startAt.getTime() + 4 * 60 * 60 * 1000);

      const toLocalIsoWithOffset = (date) => {
        const pad = (n) => String(n).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        const tzOffset = -date.getTimezoneOffset();
        const sign = tzOffset >= 0 ? '+' : '-';
        const abs = Math.abs(tzOffset);
        const tzHours = pad(Math.floor(abs / 60));
        const tzMinutes = pad(abs % 60);
        const offset = `${sign}${tzHours}:${tzMinutes}`;
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
      };

      const demoEvent = {
        title: `Demo Event ${now.toISOString().slice(0, 16).replace('T', ' ')}`,
        description: 'Demo event for testing microservices architecture and RabbitMQ async communication. Event creation triggers event.created message.',
        startAt: toLocalIsoWithOffset(startAt),
        endAt: toLocalIsoWithOffset(endAt),
        address: 'Plac Defilad 1, Warsaw, Poland',
        city: 'Warsaw',
        capacity: 50
      };

      const response = await eventsAPI.create(demoEvent);
      const createdEventId = response.data.id;
      setDemoEventId(createdEventId);

      setMessage({
        text: `Demo event created. Event ID: ${createdEventId}. RabbitMQ message published: event.created`,
        type: 'success'
      });

      setTimeout(() => {
        fetchNotifications();
        fetchUnreadCount();
        fetchAvailableEvents();
      }, 2000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to create demo event',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDemoEvent = async () => {
    if (!hasRole(['ORGANIZER', 'ADMIN'])) {
      setMessage({ text: 'Only organizers/admins can update events', type: 'error' });
      return;
    }

    if (!demoEventId) {
      setMessage({ text: 'No demo event to update. Create a demo event first.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const now = new Date();
      await eventsAPI.update(demoEventId, {
        title: `Demo Event UPDATED ${now.toISOString().slice(0, 16).replace('T', ' ')}`
      });

      setMessage({
        text: `Demo event updated. Event ID: ${demoEventId}. RabbitMQ message published: event.updated`,
        type: 'success'
      });

      setTimeout(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 2000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to update demo event',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegisterToDemoEvent = async () => {
    if (!hasRole('USER')) {
      setMessage({ text: 'Only users can register for events', type: 'error' });
      return;
    }

    if (!demoEventId) {
      setMessage({ text: 'No demo event ID. Enter an event ID or create one as organizer.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await registrationsAPI.register(demoEventId);

      setMessage({
        text: `Registered to event ${demoEventId}. RabbitMQ message published: registration.created`,
        type: 'success'
      });

      setTimeout(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 2000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to register to demo event',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!hasRole(['ORGANIZER', 'ADMIN'])) {
      setMessage({ text: 'Only organizers/admins can send invitations', type: 'error' });
      return;
    }

    if (!demoEventId) {
      setMessage({ text: 'No demo event ID. Create a demo event first.', type: 'error' });
      return;
    }

    if (!invitationEmail || !invitationEmail.includes('@')) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await invitationsAPI.create(demoEventId, invitationEmail);

      setMessage({
        text: `Invitation sent to ${invitationEmail}. RabbitMQ message published: invitation.requested. Email will be sent via SMTP (check Mailtrap).`,
        type: 'success'
      });

      setInvitationEmail('');
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to send invitation',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll(0, 10);
      const content = response.data.content || response.data;
      setNotifications(content);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const formatTime = (date) => {
    return date ? date.toLocaleTimeString('en-US') : 'N/A';
  };

  return (
    <div className="container demo-container">
      <h1>Demo Dashboard</h1>

      <div className="demo-user-info">
        Logged in as: <strong>{user?.username}</strong> ({user?.role})
      </div>

      {message.text && (
        <div className={`alert ${message.type}`}>{message.text}</div>
      )}

      {/* SECTION A: System Overview */}
      <div className="card demo-section">
        <h2>System Architecture Overview</h2>
        <div className="architecture-diagram">
          <div className="arch-row">
            <div className="arch-box frontend">Frontend (React)</div>
          </div>
          <div className="arch-arrow">↓ HTTP/REST</div>
          <div className="arch-row">
            <div className="arch-box gateway">API Gateway (Port 18080)</div>
          </div>
          <div className="arch-arrow">↓ Routes to microservices</div>
          <div className="arch-row arch-services">
            <div className="arch-box service">
              <strong>user-service</strong>
              <span>Port 8081</span>
              <span className="service-role">Auth, JWT, Users</span>
            </div>
            <div className="arch-box service">
              <strong>event-service</strong>
              <span>Port 8082</span>
              <span className="service-role">Events, Registrations, Invitations</span>
            </div>
            <div className="arch-box service">
              <strong>notification-service</strong>
              <span>Port 8083</span>
              <span className="service-role">Notifications, SMTP Emails</span>
            </div>
          </div>
          <div className="arch-rabbitmq-flow">
            <div className="rabbitmq-connection">
              <div className="arch-arrow-horiz">→ Publishes →</div>
              <div className="arch-box rabbitmq">
                <strong>RabbitMQ</strong>
                <span>Ports 5672, 15672</span>
                <span className="service-role">AMQP Message Broker</span>
              </div>
              <div className="arch-arrow-horiz">→ Consumes →</div>
            </div>
            <div className="rabbitmq-labels">
              <span className="rabbitmq-label-left">event-service</span>
              <span className="rabbitmq-label-right">notification-service</span>
            </div>
          </div>
          <div className="arch-note">
            <strong>Async Communication:</strong> event-service publishes domain events (event.created, event.updated, 
            registration.created, invitation.requested) to RabbitMQ topic exchange (eventflow.exchange). 
            notification-service consumes messages from notification.queue and persists notifications or sends SMTP emails (Mailtrap).
          </div>
        </div>

        <div className="arch-details">
          <h3>Key Configuration</h3>
          <ul>
            <li><strong>Gateway Base URL:</strong> http://localhost:18080</li>
            <li><strong>RabbitMQ Exchange:</strong> eventflow.exchange (TopicExchange)</li>
            <li><strong>RabbitMQ Queue:</strong> notification.queue</li>
            <li><strong>Routing Keys:</strong> event.created, event.updated, event.deleted, registration.created, registration.deleted, invitation.requested</li>
            <li><strong>SMTP:</strong> Mailtrap sandbox (configured in notification-service)</li>
          </ul>
        </div>
      </div>

      {/* SECTION B: Live Status Checks */}
      <div className="card demo-section">
        <h2>Service Health Status</h2>
        <div className="health-grid">
          <div className="health-item">
            <div className="health-label">user-service</div>
            <div className={`health-status status-${serviceHealth.userService.status}`}>
              {serviceHealth.userService.status.toUpperCase()}
            </div>
            <div className="health-time">
              Last checked: {formatTime(serviceHealth.userService.lastChecked)}
            </div>
          </div>
          <div className="health-item">
            <div className="health-label">event-service</div>
            <div className={`health-status status-${serviceHealth.eventService.status}`}>
              {serviceHealth.eventService.status.toUpperCase()}
            </div>
            <div className="health-time">
              Last checked: {formatTime(serviceHealth.eventService.lastChecked)}
            </div>
          </div>
          <div className="health-item">
            <div className="health-label">notification-service</div>
            <div className={`health-status status-${serviceHealth.notificationService.status}`}>
              {serviceHealth.notificationService.status.toUpperCase()}
            </div>
            <div className="health-time">
              Last checked: {formatTime(serviceHealth.notificationService.lastChecked)}
            </div>
          </div>
          <div className="health-item">
            <div className="health-label">rabbitmq</div>
            <div className={`health-status status-${serviceHealth.rabbitmq.status}`}>
              {serviceHealth.rabbitmq.status.toUpperCase()}
            </div>
            <div className="health-time">
              Last checked: {formatTime(serviceHealth.rabbitmq.lastChecked)}
            </div>
          </div>
        </div>
        <button onClick={checkServicesHealth} className="secondary" style={{ marginTop: '1rem' }}>
          Re-check Services
        </button>
      </div>

      {/* SECTION C: Demonstrate Async RabbitMQ Flow */}
      <div className="card demo-section">
        <h2>Demonstrate Async RabbitMQ Flow</h2>
        <p className="demo-instructions">
          Follow these steps to demonstrate end-to-end async communication: Action → RabbitMQ → Consumer → Notification
        </p>

        <div className="demo-actions-grid">
          {hasRole(['ORGANIZER', 'ADMIN']) ? (
            <div className="demo-action-card">
              <h3>Step 1: Create Demo Event</h3>
              <p>Creates an event via event-service. Publishes <code>event.created</code> message to RabbitMQ.</p>
              <button 
                onClick={handleCreateDemoEvent} 
                disabled={actionLoading}
                className="demo-action-button"
              >
                {actionLoading ? 'Creating...' : 'Create Demo Event'}
              </button>
              {demoEventId && (
                <div className="demo-result">
                  Event ID: <strong>{demoEventId}</strong>
                  <Link to={`/events/${demoEventId}`} className="demo-link">View Event</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="demo-action-card disabled">
              <h3>Step 1: Create Demo Event</h3>
              <p className="demo-disabled-msg">Only ORGANIZER can create events</p>
            </div>
          )}

          {hasRole(['ORGANIZER', 'ADMIN']) ? (
            <div className="demo-action-card">
              <h3>Step 2: Update Demo Event</h3>
              <p>Updates the event. Publishes <code>event.updated</code> message to RabbitMQ.</p>
              <button 
                onClick={handleUpdateDemoEvent} 
                disabled={actionLoading || !demoEventId}
                className="demo-action-button"
              >
                {actionLoading ? 'Updating...' : 'Update Demo Event'}
              </button>
              {!demoEventId && <p className="demo-note">Create an event first</p>}
            </div>
          ) : (
            <div className="demo-action-card disabled">
              <h3>Step 2: Update Demo Event</h3>
              <p className="demo-disabled-msg">Only ORGANIZER can update events</p>
            </div>
          )}

          {hasRole('USER') ? (
            <div className="demo-action-card">
              <h3>Step 3: Register to Event</h3>
              <p>Registers user to event. Publishes <code>registration.created</code> message to RabbitMQ.</p>
              {!demoEventId && (
                <div style={{ marginBottom: '0.5rem' }}>
                  {availableEvents.length > 0 ? (
                    <select 
                      value={demoEventId || ''} 
                      onChange={(e) => setDemoEventId(e.target.value || null)}
                      className="demo-input"
                    >
                      <option value="">Select an event</option>
                      {availableEvents.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} (ID: {event.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="demo-note">No events available. Create an event first or refresh events list.</p>
                  )}
                </div>
              )}
              <button 
                onClick={handleRegisterToDemoEvent} 
                disabled={actionLoading || !demoEventId}
                className="demo-action-button"
              >
                {actionLoading ? 'Registering...' : 'Register to Event'}
              </button>
            </div>
          ) : (
            <div className="demo-action-card disabled">
              <h3>Step 3: Register to Event</h3>
              <p className="demo-disabled-msg">Only USER role can register to events</p>
            </div>
          )}

          <div className="demo-action-card">
            <h3>Step 4: Fetch Notifications</h3>
            <p>Retrieves notifications from notification-service to verify async processing.</p>
            <button 
              onClick={fetchNotifications} 
              disabled={actionLoading}
              className="demo-action-button secondary"
            >
              {actionLoading ? 'Fetching...' : 'Fetch Notifications'}
            </button>
            <div className="demo-result">
              <div>Total notifications: <strong>{notifications.length}</strong></div>
              <div>Unread count: <strong>{unreadCount}</strong></div>
            </div>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="demo-notifications-list">
            <h3>Recent Notifications (Last 10)</h3>
            <ul>
              {notifications.slice(0, 10).map((notif, idx) => (
                <li key={idx} className={!notif.read ? 'unread' : ''}>
                  <strong>{notif.type}:</strong> {notif.message}
                  {!notif.read && <span className="badge-new">NEW</span>}
                </li>
              ))}
            </ul>
            <Link to="/notifications" className="demo-link">View all notifications</Link>
          </div>
        )}

        <div className="demo-flow-explanation">
          <h3>Expected Flow:</h3>
          <ol>
            <li>User performs action (create/update event, register)</li>
            <li>Service saves data to PostgreSQL database</li>
            <li>Service publishes domain event to RabbitMQ (eventflow.exchange)</li>
            <li>RabbitMQ routes message to notification.queue via routing key</li>
            <li>notification-service @RabbitListener consumes message</li>
            <li>notification-service persists notification to PostgreSQL</li>
            <li>User fetches notifications via GET /api/notifications</li>
            <li>Notification appears in the list</li>
          </ol>
        </div>
      </div>

      <div className="card demo-section">
        <h2>Real-Time Notifications (SSE)</h2>
        <p className="demo-instructions">
          EventSource (SSE) allows real-time notification delivery without polling.
        </p>

        <div className="demo-sse-controls">
          <button 
            onClick={toggleSSE}
            className={sseEnabled ? 'secondary' : ''}
          >
            {sseEnabled ? 'Disconnect Live Updates' : 'Connect Live Updates (SSE)'}
          </button>
          <div className="demo-sse-status">
            Status: <strong>{sseEnabled ? 'CONNECTED' : 'DISCONNECTED'}</strong>
          </div>
        </div>

        {newNotifications.length > 0 && (
          <div className="demo-new-notifications">
            <h3>Live Notifications Received</h3>
            <ul>
              {newNotifications.map((notif, idx) => (
                <li key={idx}>
                  <strong>{notif.type}:</strong> {notif.message}
                  <span className="badge-live">LIVE</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="demo-note">
          SSE endpoint: GET /api/notifications/stream?userId={'{userId}'}
        </div>
      </div>

      {hasRole(['ORGANIZER', 'ADMIN']) && (
        <div className="card demo-section">
          <h2>SMTP Email Invitations (Mailtrap)</h2>
          <p className="demo-instructions">
            Send event invitations via email. RabbitMQ publishes <code>invitation.requested</code> message, 
            notification-service consumes it and sends SMTP email via Mailtrap.
          </p>

          <div className="demo-invitation-form">
            <input 
              type="email" 
              placeholder="Enter email address" 
              value={invitationEmail} 
              onChange={(e) => setInvitationEmail(e.target.value)}
              className="demo-input"
            />
            <button 
              onClick={handleSendInvitation} 
              disabled={actionLoading || !demoEventId || !invitationEmail}
              className="demo-action-button"
            >
              {actionLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>

          {!demoEventId && (
            <p className="demo-note">Create a demo event first to send invitations</p>
          )}

          <div className="demo-note">
            Invitation flow: Create invitation → RabbitMQ (invitation.requested) → notification-service → SMTP send (JavaMailSender)
          </div>
        </div>
      )}
    </div>
  );
}

export default DemoDashboard;
