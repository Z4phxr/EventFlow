import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setLoading(true);
      setError('');
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.status) params.status = filters.status;
      
      const response = await eventsAPI.getAll(params);
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatDateRange = (start, end) => {
    const startDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(start));
    
    const endDate = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(end));
    
    return `${startDate} - ${endDate}`;
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PLANNED', label: 'Planned' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'FINISHED', label: 'Finished' },
  ];

  if (loading) {
    return <Spinner.Container>Loading events...</Spinner.Container>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Discover Events</h1>
        <p className="text-gray-600 mt-1">Browse and register for upcoming events</p>
      </div>
      
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Filter by city..."
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              label="City"
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={statusOptions}
              label="Status"
            />
          </div>
        </Card.Content>
      </Card>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <Card.Content className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              hover
              className="cursor-pointer group"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <Card.Content className="space-y-3">
                {/* Title and Status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {event.title}
                  </h3>
                  <Badge variant={event.status}>
                    {event.status}
                  </Badge>
                </div>
                
                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.city || 'Location TBD'}</span>
                </div>
                
                {/* Date Range */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDateRange(event.startAt, event.endAt)}</span>
                </div>
                
                {/* Capacity */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{event.availableSpots}/{event.capacity}</span>
                  </div>
                  <span className={`text-xs font-medium ${event.availableSpots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {event.availableSpots > 0 ? 'Available' : 'Full'}
                  </span>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventsList;
