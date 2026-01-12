import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { eventsAPI, registrationsAPI } from '../api';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEvent(response.data);
      
      // Try to fetch weather
      if (response.data.latitude && response.data.longitude) {
        try {
          const weatherResponse = await eventsAPI.getWeather(id);
          setWeather(weatherResponse.data);
        } catch (err) {
          console.log('Weather not available');
        }
      }
    } catch (err) {
      setMessage({ text: 'Event not found', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      await registrationsAPI.register(id);
      setMessage({ text: 'Successfully registered!', type: 'success' });
      fetchEventDetails(); // Refresh to update available spots
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Registration failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    setActionLoading(true);
    try {
      await registrationsAPI.unregister(id);
      setMessage({ text: 'Successfully unregistered', type: 'success' });
      fetchEventDetails();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Unregister failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading">Loading event...</div>;
  if (!event) return <div className="container">Event not found</div>;

  return (
    <div className="container event-detail">
      <button onClick={() => navigate('/')} className="secondary">← Back to Events</button>
      
      <div className="card">
        <h2>{event.title}</h2>
        
        {message.text && (
          <div className={message.type}>{message.text}</div>
        )}

        {event.description && (
          <p style={{ margin: '1rem 0', color: '#555' }}>{event.description}</p>
        )}

        <div className="event-info">
          <div className="event-info-item">
            <strong>Start Date</strong>
            <div>{formatDate(event.startAt)}</div>
          </div>
          <div className="event-info-item">
            <strong>End Date</strong>
            <div>{formatDate(event.endAt)}</div>
          </div>
          <div className="event-info-item">
            <strong>Location</strong>
            <div>{event.address}</div>
          </div>
          <div className="event-info-item">
            <strong>City</strong>
            <div>{event.city || 'N/A'}</div>
          </div>
          <div className="event-info-item">
            <strong>Capacity</strong>
            <div>{event.capacity} people</div>
          </div>
          <div className="event-info-item">
            <strong>Available Spots</strong>
            <div>{event.availableSpots} remaining</div>
          </div>
          <div className="event-info-item">
            <strong>Status</strong>
            <div>{event.status}</div>
          </div>
        </div>

        {weather && (
          <div className="weather-section">
            <h3>Weather Forecast</h3>
            <p>{weather.forecast}</p>
          </div>
        )}

        {user && user.role === 'USER' && event.status === 'PLANNED' && (
          <div className="actions">
            <button onClick={handleRegister} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Register for Event'}
            </button>
            <button onClick={handleUnregister} className="secondary" disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Unregister'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetail;
