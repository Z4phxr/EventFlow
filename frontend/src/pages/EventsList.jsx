import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api';

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    status: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.status) params.status = filters.status;
      
      const response = await eventsAPI.getAll(params);
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="container">
      <h1>Events</h1>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="FINISHED">Finished</option>
        </select>
      </div>

      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <div
              key={event.id}
              className="card event-card"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <h3>{event.title}</h3>
              <p><strong>📍 {event.city || 'N/A'}</strong></p>
              <p>🗓️ {formatDate(event.startAt)}</p>
              <p>👥 {event.availableSpots}/{event.capacity} spots available</p>
              <p>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  backgroundColor: event.status === 'PLANNED' ? '#3498db' : '#95a5a6',
                  color: 'white'
                }}>
                  {event.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventsList;
