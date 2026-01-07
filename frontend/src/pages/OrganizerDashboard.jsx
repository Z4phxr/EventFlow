import { useState, useEffect } from 'react';
import { eventsAPI } from '../api';

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    address: '',
    city: '',
    capacity: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      // Convert datetime-local to ISO format
      const data = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        capacity: parseInt(formData.capacity)
      };

      if (editingEvent) {
        await eventsAPI.update(editingEvent.id, data);
        setMessage({ text: 'Event updated successfully!', type: 'success' });
      } else {
        await eventsAPI.create(data);
        setMessage({ text: 'Event created successfully!', type: 'success' });
      }

      resetForm();
      fetchMyEvents();
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Operation failed', 
        type: 'error' 
      });
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startAt: new Date(event.startAt).toISOString().slice(0, 16),
      endAt: new Date(event.endAt).toISOString().slice(0, 16),
      address: event.address,
      city: event.city || '',
      capacity: event.capacity.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsAPI.delete(eventId);
      setMessage({ text: 'Event deleted successfully', type: 'success' });
      fetchMyEvents();
    } catch (err) {
      setMessage({ text: 'Failed to delete event', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      address: '',
      city: '',
      capacity: ''
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  return (
    <div className="container">
      <h1>Organizer Dashboard</h1>

      {message.text && (
        <div className={message.type}>{message.text}</div>
      )}

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Create New Event'}
      </button>

      {showForm && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2>{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Start Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                min="1"
              />
            </div>

            <div className="actions">
              <button type="submit">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
              <button type="button" onClick={resetForm} className="secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>My Events</h2>
      {events.length === 0 ? (
        <p>No events yet. Create your first event!</p>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <div key={event.id} className="card">
              <h3>{event.title}</h3>
              <p>{event.city}</p>
              <p>{new Date(event.startAt).toLocaleDateString()}</p>
              <p>Capacity: {event.capacity}</p>
              <p>Status: {event.status}</p>
              <div className="actions">
                <button onClick={() => handleEdit(event)} className="secondary">
                  Edit
                </button>
                <button onClick={() => handleDelete(event.id)} className="danger">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;
