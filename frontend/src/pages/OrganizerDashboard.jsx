import { useState, useEffect } from 'react';
import { eventsAPI, registrationsAPI } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteModalEvent, setDeleteModalEvent] = useState(null);
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
  const [actionLoading, setActionLoading] = useState(false);
  
  // Registrations state
  const [registrationsCache, setRegistrationsCache] = useState({});
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationsError, setRegistrationsError] = useState('');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getMyEvents();
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setMessage({ text: 'Failed to load events', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setActionLoading(true);

    try {
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
    } finally {
      setActionLoading(false);
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
    setShowFormModal(true);
    setMessage({ text: '', type: '' });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalEvent) return;

    setActionLoading(true);
    try {
      await eventsAPI.delete(deleteModalEvent.id);
      setMessage({ text: 'Event deleted successfully', type: 'success' });
      fetchMyEvents();
      setDeleteModalEvent(null);
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Failed to delete event', 
        type: 'error' 
      });
    } finally {
      setActionLoading(false);
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
    setShowFormModal(false);
  };

  const toggleRegistrations = async (eventId) => {
    // If clicking the same event, close it
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      setRegistrationsError('');
      return;
    }

    setExpandedEventId(eventId);
    setRegistrationsError('');

    // Check cache first
    if (registrationsCache[eventId]) {
      return;
    }

    // Fetch registrations
    setRegistrationsLoading(true);
    try {
      const response = await registrationsAPI.getEventRegistrations(eventId);
      setRegistrationsCache(prev => ({
        ...prev,
        [eventId]: response.data
      }));
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setRegistrationsError(err.response?.data?.message || 'Failed to load registrations');
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const refreshRegistrations = async (eventId) => {
    setRegistrationsLoading(true);
    setRegistrationsError('');
    try {
      const response = await registrationsAPI.getEventRegistrations(eventId);
      setRegistrationsCache(prev => ({
        ...prev,
        [eventId]: response.data
      }));
    } catch (err) {
      console.error('Failed to refresh registrations:', err);
      setRegistrationsError(err.response?.data?.message || 'Failed to refresh registrations');
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const formatRegistrationDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return <Spinner.Container>Loading your events...</Spinner.Container>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your events</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowFormModal(true);
        }}>
          Create Event
        </Button>
      </div>

      {message.text && (
        <Alert 
          variant={message.type === 'success' ? 'success' : 'error'} 
          onClose={() => setMessage({ text: '', type: '' })}
        >
          {message.text}
        </Alert>
      )}

      {events.length === 0 ? (
        <Card>
          <Card.Content className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No events yet</h3>
            <p className="text-gray-600 mb-4">Create your first event to get started</p>
            <Button onClick={() => setShowFormModal(true)}>
              Create Your First Event
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isGeocoded = event.latitude != null && event.longitude != null;
            const isExpanded = expandedEventId === event.id;
            const registrations = registrationsCache[event.id] || [];
            
            return (
            <Card key={event.id} hover>
              <Card.Content className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.title}
                  </h3>
                  <div className="flex gap-1 flex-wrap justify-end">
                    <Badge variant={event.status}>
                      {event.status}
                    </Badge>
                    <Badge variant={isGeocoded ? 'geocoded' : 'not-geocoded'}>
                      {isGeocoded ? 'Geocoded' : 'Not geocoded'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.city || 'Location TBD'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDateForDisplay(event.startAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{event.availableSpots}/{event.capacity} spots available</span>
                  </div>
                </div>

                {/* Registrations Panel */}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRegistrations(event.id);
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {isExpanded ? 'Hide Registrations' : 'View Registrations'}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      {registrationsLoading && expandedEventId === event.id ? (
                        <p className="text-sm text-gray-500">Loading registrations...</p>
                      ) : registrationsError && expandedEventId === event.id ? (
                        <div className="text-sm">
                          <p className="text-red-600 mb-2">{registrationsError}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshRegistrations(event.id);
                            }}
                            className="text-primary-600 hover:underline"
                          >
                            Try again
                          </button>
                        </div>
                      ) : registrations.length === 0 ? (
                        <p className="text-sm text-gray-500">No registrations yet</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {registrations.length} attendee{registrations.length !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshRegistrations(event.id);
                              }}
                              className="text-xs text-primary-600 hover:underline"
                              disabled={registrationsLoading}
                            >
                              Refresh
                            </button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {registrations.map((reg) => (
                              <div 
                                key={reg.id} 
                                className="flex items-center justify-between py-1 px-2 bg-white rounded text-sm border border-gray-100"
                              >
                                <span className="text-gray-700 font-mono text-xs truncate" title={reg.userId}>
                                  User: {reg.userId.substring(0, 8)}...
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={reg.status} className="text-xs">
                                    {reg.status}
                                  </Badge>
                                  <span className="text-gray-400 text-xs">
                                    {formatRegistrationDate(reg.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card.Content>

              <Card.Footer className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleEdit(event)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => setDeleteModalEvent(event)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Delete
                </Button>
              </Card.Footer>
            </Card>
          )})}
        </div>
      )}

      <Modal
        isOpen={showFormModal}
        onClose={resetForm}
        title={editingEvent ? 'Edit Event' : 'Create New Event'}
        footer={
          <>
            <Button variant="ghost" onClick={resetForm} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="event-form"
              loading={actionLoading}
              disabled={actionLoading}
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </>
        }
      >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={actionLoading}
            placeholder="Event title"
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={actionLoading}
            placeholder="Event description (optional)"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              required
              disabled={actionLoading}
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              required
              disabled={actionLoading}
            />
          </div>

          <Input
            label="Address"
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            disabled={actionLoading}
            placeholder="Event address"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              disabled={actionLoading}
              placeholder="City (optional)"
            />

            <Input
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
              min="1"
              disabled={actionLoading}
              placeholder="Maximum attendees"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteModalEvent}
        onClose={() => setDeleteModalEvent(null)}
        title="Delete Event"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModalEvent(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteConfirm}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Delete Event
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteModalEvent?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

export default OrganizerDashboard;
