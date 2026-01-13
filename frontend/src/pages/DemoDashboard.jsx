import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { eventsAPI, registrationsAPI, notificationsAPI, healthAPI } from '../api';

function DemoDashboard() {
  const { user, hasRole } = useAuth();
  const [demoEventId, setDemoEventId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsBefore, setNotificationsBefore] = useState([]);
  const [serviceHealth, setServiceHealth] = useState({
    eventService: { status: 'unknown', lastChecked: null },
    notificationService: { status: 'unknown', lastChecked: null },
    authService: { status: 'configured', lastChecked: null }
  });

  useEffect(() => {
    checkServicesHealth();
  }, []);

  const checkServicesHealth = async () => {
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

    // Auth Service (no safe GET, mark as configured)
    setServiceHealth(prev => ({
      ...prev,
      authService: { status: 'configured', lastChecked: new Date() }
    }));
  };

  const handleCreateDemoEvent = async () => {
    if (!hasRole(['ORGANIZER', 'ADMIN'])) {
      setMessage({ text: 'Only organizers can create events', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Capture notifications before action
      const beforeResponse = await notificationsAPI.getAll();
      setNotificationsBefore(beforeResponse.data);

      const now = new Date();
      const startAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const endAt = new Date(startAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

      // Use a well-known, geocodable address for reliable geocoding
      const demoEvent = {
        title: `Demo Event - ${now.toISOString().slice(0, 19)}`,
        description: 'This is a demo event to test microservices architecture and RabbitMQ async communication',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        address: 'Plac Defilad 1, 00-901 Warsaw, Poland',
        city: 'Warsaw',
        capacity: 50
      };

      const response = await eventsAPI.create(demoEvent);
      const createdEventId = response.data.id;
      setDemoEventId(createdEventId);

      // Check if geocoding succeeded
      let eventData = response.data;
      const isGeocoded = eventData.latitude != null && eventData.longitude != null;

      if (!isGeocoded) {
        // Retry: refetch after a short delay to allow backend geocoding
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
          const refetchResponse = await eventsAPI.getById(createdEventId);
          eventData = refetchResponse.data;
          
          // If still not geocoded, try updating with simplified address
          if (eventData.latitude == null || eventData.longitude == null) {
            const updatePayload = {
              ...eventData,
              address: 'Palace of Culture and Science, Warsaw, Poland'
            };
            await eventsAPI.update(createdEventId, updatePayload);
            // Refetch again after update
            await new Promise(resolve => setTimeout(resolve, 1000));
            const finalResponse = await eventsAPI.getById(createdEventId);
            eventData = finalResponse.data;
          }
        } catch (retryErr) {
          console.log('Geocoding retry failed:', retryErr);
        }
      }

      const finalGeocoded = eventData.latitude != null && eventData.longitude != null;
      setMessage({
        text: `Demo event created! Event ID: ${createdEventId}. ${finalGeocoded ? 'Location geocoded successfully.' : 'Geocoding pending.'} Expected message published to RabbitMQ: event.created`,
        type: 'success'
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to create demo event',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegisterToDemoEvent = async () => {
    if (!hasRole('USER')) {
      setMessage({ text: 'Only users (attendees) can register for events', type: 'error' });
      return;
    }

    if (!demoEventId) {
      setMessage({ text: 'No demo event ID available. Create a demo event first.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Capture notifications before action
      const beforeResponse = await notificationsAPI.getAll();
      setNotificationsBefore(beforeResponse.data);

      await registrationsAPI.register(demoEventId);

      setMessage({
        text: `Registered to demo event #${demoEventId}! Expected message published to RabbitMQ: registration.created`,
        type: 'success'
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to register to demo event',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckNotifications = async () => {
    setActionLoading(true);
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data);
      
      const newCount = response.data.length - notificationsBefore.length;
      if (newCount > 0) {
        setMessage({
          text: `Found ${newCount} new notification(s)! Check the Notifications page for details.`,
          type: 'success'
        });
      } else {
        setMessage({
          text: 'No new notifications yet. Wait a moment and try again.',
          type: 'info'
        });
      }
    } catch (err) {
      setMessage({
        text: 'Failed to check notifications',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (date) => {
    return date ? date.toLocaleTimeString('en-US') : 'N/A';
  };

  return (
    <div className="container demo-container">
      <h1>Microservices Demo Dashboard</h1>
      <p className="demo-description">
        This dashboard demonstrates the Grade 5.0 microservices architecture with RabbitMQ asynchronous communication.
      </p>

      {message.text && (
        <div className={message.type}>{message.text}</div>
      )}

      {/* System Overview Panel */}
      <div className="card demo-section">
        <h2>System Architecture Overview</h2>
        <div className="architecture-diagram">
          <div className="arch-row">
            <div className="arch-box frontend">Frontend (React)</div>
          </div>
          <div className="arch-arrow">↓ HTTP/REST</div>
          <div className="arch-row">
            <div className="arch-box gateway">API Gateway (Port 8080)</div>
          </div>
          <div className="arch-arrow">↓ Routes to services</div>
          <div className="arch-row arch-services">
            <div className="arch-box service">
              <strong>user-service</strong>
              <span>Port 8081</span>
              <span className="service-role">Auth & Users</span>
            </div>
            <div className="arch-box service">
              <strong>event-service</strong>
              <span>Port 8082</span>
              <span className="service-role">Events & Registrations</span>
            </div>
            <div className="arch-box service">
              <strong>notification-service</strong>
              <span>Port 8083</span>
              <span className="service-role">Notifications</span>
            </div>
          </div>
          <div className="arch-rabbitmq-flow">
            <div className="rabbitmq-connection">
              <div className="arch-arrow-horiz">→ Publishes →</div>
              <div className="arch-box rabbitmq">
                <strong>RabbitMQ</strong>
                <span>Port 5672</span>
                <span className="service-role">Message Broker</span>
              </div>
              <div className="arch-arrow-horiz">→ Consumes →</div>
            </div>
            <div className="rabbitmq-labels">
              <span className="rabbitmq-label-left">event-service</span>
              <span className="rabbitmq-label-right">notification-service</span>
            </div>
          </div>
          <div className="arch-note">
            <strong>Event-Driven Flow:</strong> event-service publishes domain events (event.created, registration.created, etc.) 
            to RabbitMQ. notification-service consumes these messages asynchronously and persists notifications.
          </div>
        </div>
      </div>

      {/* Live Status Panel */}
      <div className="card demo-section">
        <h2>Service Health Status</h2>
        <div className="health-grid">
          <div className="health-item">
            <div className="health-label">user-service (Auth)</div>
            <div className={`health-status status-${serviceHealth.authService.status}`}>
              {serviceHealth.authService.status.toUpperCase()}
            </div>
            <div className="health-time">
              Last checked: {formatTime(serviceHealth.authService.lastChecked)}
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
        </div>
        <button onClick={checkServicesHealth} className="secondary" style={{ marginTop: '1rem' }}>
          Refresh Health Status
        </button>
      </div>

      {/* Demo Actions Panel */}
      <div className="card demo-section">
        <h2>Demo Actions - Test Async Communication</h2>
        <p className="demo-instructions">
          Perform actions below to demonstrate the asynchronous flow: Action → RabbitMQ → Consumer → Notification
        </p>

        <div className="demo-actions-grid">
          {hasRole(['ORGANIZER', 'ADMIN']) && (
            <div className="demo-action-card">
              <h3>1. Create Demo Event (Organizer)</h3>
              <p>Creates a new event via event-service, which publishes an "event.created" message to RabbitMQ.</p>
              <button 
                onClick={handleCreateDemoEvent} 
                disabled={actionLoading}
                className="demo-action-button"
              >
                {actionLoading ? 'Processing...' : 'Create Demo Event'}
              </button>
              {demoEventId && (
                <div className="demo-result">
                  Demo Event ID: <strong>{demoEventId}</strong>
                </div>
              )}
            </div>
          )}

          {hasRole('USER') && (
            <div className="demo-action-card">
              <h3>2. Register to Demo Event (User)</h3>
              <p>Registers current user to the demo event, publishing a "registration.created" message to RabbitMQ.</p>
              {demoEventId ? (
                <button 
                  onClick={handleRegisterToDemoEvent} 
                  disabled={actionLoading}
                  className="demo-action-button"
                >
                  {actionLoading ? 'Processing...' : `Register to Event #${demoEventId}`}
                </button>
              ) : (
                <p className="demo-note">Create a demo event first, or enter an event ID below:</p>
              )}
              <input 
                type="number" 
                placeholder="Enter Event ID" 
                value={demoEventId || ''} 
                onChange={(e) => setDemoEventId(e.target.value ? parseInt(e.target.value) : null)}
                className="demo-input"
              />
            </div>
          )}

          <div className="demo-action-card">
            <h3>3. Check for New Notifications</h3>
            <p>Fetches notifications from notification-service to verify that consumed messages were persisted.</p>
            <button 
              onClick={handleCheckNotifications} 
              disabled={actionLoading}
              className="demo-action-button secondary"
            >
              {actionLoading ? 'Checking...' : 'Check Notifications'}
            </button>
            {notifications.length > 0 && (
              <div className="demo-result">
                Total notifications: <strong>{notifications.length}</strong>
                {notificationsBefore.length > 0 && (
                  <span> (was {notificationsBefore.length} before action)</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="demo-flow-explanation">
          <h3>Expected Flow:</h3>
          <ol>
            <li>Organizer creates event → <code>POST /api/events</code></li>
            <li>event-service saves event to database</li>
            <li>event-service publishes <code>EventCreated</code> to RabbitMQ exchange</li>
            <li>notification-service consumes message from RabbitMQ queue</li>
            <li>notification-service persists notification to database</li>
            <li>Click "Check Notifications" → <code>GET /api/notifications</code></li>
            <li>New notification appears in the list!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default DemoDashboard;
