import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { eventsAPI, registrationsAPI, invitationsAPI } from '../api';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import Input from '../components/Input';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isRegistered, setIsRegistered] = useState(false);
  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  // Check registration status when user is logged in
  useEffect(() => {
    if (user && id) {
      checkRegistrationStatus();
    }
  }, [user, id]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await registrationsAPI.checkRegistration(id);
      setIsRegistered(response.data);
    } catch (err) {
      // If 401/403, user not logged in or no access - that's fine
      console.log('Could not check registration status:', err);
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(id);
      setEvent(response.data);
      
      // Fetch weather if geocoded
      if (response.data.latitude && response.data.longitude) {
        fetchWeather();
      }
    } catch (err) {
      setMessage({ text: 'Event not found', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const weatherResponse = await eventsAPI.getWeather(id);
      setWeather(weatherResponse.data);
    } catch (err) {
      console.log('Weather not available:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await registrationsAPI.register(id);
      setIsRegistered(true);
      setMessage({ text: 'Successfully registered for this event!', type: 'success' });
      fetchEventDetails();
    } catch (err) {
      // If already registered, update state
      if (err.response?.status === 409 || err.response?.data?.message?.includes('already registered')) {
        setIsRegistered(true);
      }
      setMessage({ text: err.response?.data?.message || 'Registration failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await registrationsAPI.unregister(id);
      setIsRegistered(false);
      setMessage({ text: 'Successfully unregistered from this event', type: 'success' });
      fetchEventDetails();
    } catch (err) {
      // If not registered, update state
      if (err.response?.status === 404) {
        setIsRegistered(false);
      }
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

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenInvite = () => {
    setInviteEmail('');
    setShowInviteModal(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      await invitationsAPI.create(id, inviteEmail);
      setMessage({ text: 'Invitation sent successfully!', type: 'success' });
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err) {
      if (err.response?.status === 403) {
        setMessage({ 
          text: 'Access denied. Please sign in as an organizer to send invitations.', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: err.response?.data?.message || 'Failed to send invitation', 
          type: 'error' 
        });
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // Get weather icon based on weather code or condition
  const getWeatherIcon = (code, condition) => {
    if (code !== undefined && code !== null) {
      if (code === 0) return '☀️';
      if (code === 1) return '🌤️';
      if (code === 2) return '⛅';
      if (code === 3) return '☁️';
      if (code >= 45 && code <= 48) return '🌫️';
      if (code >= 51 && code <= 57) return '🌦️';
      if (code >= 61 && code <= 67) return '🌧️';
      if (code >= 71 && code <= 77) return '❄️';
      if (code >= 80 && code <= 82) return '🌧️';
      if (code >= 85 && code <= 86) return '🌨️';
      if (code >= 95) return '⛈️';
    }
    // Fallback to condition text
    const cond = (condition || '').toLowerCase();
    if (cond.includes('clear') || cond.includes('sunny')) return '☀️';
    if (cond.includes('partly')) return '⛅';
    if (cond.includes('cloud') || cond.includes('overcast')) return '☁️';
    if (cond.includes('rain') || cond.includes('drizzle')) return '🌧️';
    if (cond.includes('snow')) return '❄️';
    if (cond.includes('thunder') || cond.includes('storm')) return '⛈️';
    if (cond.includes('fog')) return '🌫️';
    return '🌡️';
  };

  // Get weather advisory based on conditions
  const getWeatherAdvisory = (weather) => {
    if (!weather) return null;
    
    const code = weather.weatherCode;
    const rainChance = weather.humidity || 0;
    const windSpeed = weather.windSpeed || 0;
    
    // Thunderstorm warning
    if (code >= 95) {
      return {
        icon: '⚠️',
        message: 'Thunderstorm expected! Consider indoor alternatives.',
        bgClass: 'bg-red-50 border border-red-200',
        textClass: 'text-red-700'
      };
    }
    
    // Heavy rain warning
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82) || rainChance > 70) {
      return {
        icon: '🌧️',
        message: 'Rain is likely. Bring an umbrella or rain gear!',
        bgClass: 'bg-blue-50 border border-blue-200',
        textClass: 'text-blue-700'
      };
    }
    
    // Snow warning
    if (code >= 71 && code <= 86) {
      return {
        icon: '❄️',
        message: 'Snowy conditions expected. Dress warmly!',
        bgClass: 'bg-indigo-50 border border-indigo-200',
        textClass: 'text-indigo-700'
      };
    }
    
    // High wind warning
    if (windSpeed > 40) {
      return {
        icon: '💨',
        message: 'Strong winds expected. Secure loose items.',
        bgClass: 'bg-amber-50 border border-amber-200',
        textClass: 'text-amber-700'
      };
    }
    
    // Perfect weather
    if (code <= 1 && rainChance < 20) {
      return {
        icon: '✨',
        message: 'Great weather expected! Perfect for the event.',
        bgClass: 'bg-green-50 border border-green-200',
        textClass: 'text-green-700'
      };
    }
    
    return null;
  };

  // Build OpenStreetMap embed URL
  const getMapEmbedUrl = (lat, lon) => {
    const zoom = 15;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.005},${lon + 0.01},${lat + 0.005}&layer=mapnik&marker=${lat},${lon}`;
  };

  if (loading) {
    return <Spinner.Container>Loading event details...</Spinner.Container>;
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="error">Event not found</Alert>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/events')}>
          Back to Events
        </Button>
      </div>
    );
  }

  const isGeocoded = event.latitude != null && event.longitude != null;
  const spotsPercentage = event.capacity > 0 ? ((event.capacity - event.availableSpots) / event.capacity) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button and Invite Button Row */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200 hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
        </button>
        
        {/* Organizer Invite Button */}
        {user && (user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <button
            onClick={handleOpenInvite}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Invite by Email
          </button>
        )}
      </div>

      {/* Header Section */}
      <Card>
        <Card.Content>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              {event.description && (
                <p className="text-gray-600 max-w-2xl">{event.description}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Badge variant={event.status}>{event.status}</Badge>
              <Badge variant={isGeocoded ? 'geocoded' : 'not-geocoded'}>
                {isGeocoded ? 'Geocoded' : 'Not geocoded'}
              </Badge>
            </div>
          </div>
          </Card.Content>
      </Card>

      {/* Message */}
      {message.text && (
        <Alert 
          variant={message.type === 'success' ? 'success' : 'error'} 
          onClose={() => setMessage({ text: '', type: '' })}
        >
          {message.text}
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information Card */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">Event Information</h2>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date/Time */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Start
                  </div>
                  <p className="text-gray-900">{formatDate(event.startAt)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    End
                  </div>
                  <p className="text-gray-900">{formatDate(event.endAt)}</p>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Address
                  </div>
                  <p className="text-gray-900">{event.address || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    City
                  </div>
                  <p className="text-gray-900">{event.city || 'Not specified'}</p>
                </div>
              </div>

              {/* Capacity */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Capacity</span>
                  <span className="text-sm text-gray-900">
                    {event.capacity - event.availableSpots} / {event.capacity} registered
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${spotsPercentage >= 90 ? 'bg-red-500' : spotsPercentage >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${spotsPercentage}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {event.availableSpots > 0 
                    ? `${event.availableSpots} spots remaining`
                    : 'This event is fully booked'}
                </p>
              </div>

              {/* Registration Actions */}
              {user && user.role === 'USER' && event.status === 'PLANNED' && (
                <div className="pt-4 border-t border-gray-200">
                  {isRegistered ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">You are registered for this event</span>
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={handleUnregister}
                          disabled={actionLoading}
                          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Processing...' : 'Unregister'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <button
                        onClick={handleRegister}
                        disabled={actionLoading || event.availableSpots === 0}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:bg-sky-600 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? 'Processing...' : 'Register for Event'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Weather Card */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Weather Forecast</h2>
              </div>
            </Card.Header>
            <Card.Content>
              {weatherLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Spinner size="sm" />
                  <span>Loading weather data...</span>
                </div>
              ) : weather ? (
                <div className="space-y-4">
                  {/* Main Weather Display */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-xl border border-sky-100">
                    {/* Weather Icon & Condition */}
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">
                        {getWeatherIcon(weather.weatherCode, weather.condition)}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">{weather.condition || 'Weather data'}</p>
                        <p className="text-sm text-gray-500">
                          {formatShortDate(event.startAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Temperature */}
                    <div className="text-right">
                      <div className="text-4xl font-bold text-gray-900">
                        {weather.temperature != null ? `${Math.round(weather.temperature)}°` : '--'}
                      </div>
                      {weather.temperatureMax != null && weather.temperatureMin != null && (
                        <p className="text-sm text-gray-500">
                          {Math.round(weather.temperatureMin)}° / {Math.round(weather.temperatureMax)}°
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Weather Details Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Rain Probability */}
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl mb-1">💧</div>
                      <p className="text-lg font-semibold text-gray-900">
                        {weather.humidity != null ? `${weather.humidity}%` : '--'}
                      </p>
                      <p className="text-xs text-gray-500">Rain chance</p>
                    </div>
                    
                    {/* Wind Speed */}
                    <div className="text-center p-3 bg-cyan-50 rounded-lg">
                      <div className="text-2xl mb-1">💨</div>
                      <p className="text-lg font-semibold text-gray-900">
                        {weather.windSpeed != null ? `${Math.round(weather.windSpeed)}` : '--'}
                        <span className="text-xs text-gray-500 ml-1">km/h</span>
                      </p>
                      <p className="text-xs text-gray-500">Wind</p>
                    </div>
                    
                    {/* Precipitation */}
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-2xl mb-1">🌧️</div>
                      <p className="text-lg font-semibold text-gray-900">
                        {weather.precipitation != null ? `${weather.precipitation}` : '--'}
                        <span className="text-xs text-gray-500 ml-1">mm</span>
                      </p>
                      <p className="text-xs text-gray-500">Precipitation</p>
                    </div>
                  </div>

                  {/* Weather Advisory */}
                  {getWeatherAdvisory(weather) && (
                    <div className={`p-3 rounded-lg ${getWeatherAdvisory(weather).bgClass}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getWeatherAdvisory(weather).icon}</span>
                        <p className={`text-sm font-medium ${getWeatherAdvisory(weather).textClass}`}>
                          {getWeatherAdvisory(weather).message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : isGeocoded ? (
                <p className="text-gray-500">Weather data is currently unavailable for this location.</p>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 font-medium">Weather forecast unavailable</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Weather data requires a geocoded location. The event address could not be resolved to coordinates.
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Right Column - Map and Coordinates */}
        <div className="space-y-6">
          {/* Map Card */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Location Map</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-0">
              {isGeocoded ? (
                <div className="relative">
                  <iframe
                    title="Event Location Map"
                    src={getMapEmbedUrl(event.latitude, event.longitude)}
                    className="w-full h-72 rounded-b-xl border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="p-4">
                  <div className="bg-gray-100 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-600 font-medium">Map unavailable</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Location could not be geocoded
                    </p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Coordinates Card */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">Coordinates</h2>
            </Card.Header>
            <Card.Content>
              {isGeocoded ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Latitude</span>
                    <span className="font-mono text-gray-900">{event.latitude.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Longitude</span>
                    <span className="font-mono text-gray-900">{event.longitude.toFixed(5)}</span>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=16/${event.latitude}/${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2"
                  >
                    Open in OpenStreetMap
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-gray-500 text-sm">
                    Coordinates not available
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Address could not be geocoded
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Not Geocoded Warning */}
          {!isGeocoded && (
            <Alert variant="warning">
              <div className="space-y-1">
                <p className="font-medium">Location not geocoded</p>
                <p className="text-sm">
                  The address could not be resolved to map coordinates. Map and weather features are unavailable.
                </p>
              </div>
            </Alert>
          )}
        </div>
      </div>
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        email={inviteEmail}
        setEmail={setInviteEmail}
        onSend={handleSendInvite}
        loading={inviteLoading}
      />
    </div>
  );
}

// Invite Modal component placed at end of file for local state
function InviteModal({ isOpen, onClose, email, setEmail, onSend, loading }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Email Invitation"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="invite-form" loading={loading} disabled={loading}>Send Invitation</Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={onSend} className="space-y-4">
        <p className="text-sm text-gray-600">Enter the email address of the person you want to invite. They will receive an email with accept/decline links.</p>
        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} placeholder="someone@example.com" />
      </form>
    </Modal>
  );
}

export { InviteModal };

// Render the invite modal using local state
const _ = null; // placeholder to keep lint happy if needed
export default EventDetail;

// Attach modal usage via a small wrapper (modal uses EventDetail's state via props)
// Note: EventDetail manages `showInviteModal`, `inviteEmail`, `inviteLoading` and handlers.
