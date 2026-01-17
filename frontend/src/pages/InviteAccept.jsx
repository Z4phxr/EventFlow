import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { invitationsAPI, authAPI } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { formatDateForDisplay } from '../utils/date';

function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eventInfo, setEventInfo] = useState(null);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', role: 'USER' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(3);
  const [registeredSuccessfully, setRegisteredSuccessfully] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - missing token');
      setLoading(false);
      return;
    }

    verifyInvitation();
  }, [token]);

  useEffect(() => {
    // Handle user authentication state
    if (user && eventInfo && !registering && !registeredSuccessfully && !loggingOut) {
      if (user.email && user.email.toLowerCase() === eventInfo.inviteeEmail.toLowerCase()) {
        acceptAndRegister();
      } else {
        setLoggingOut(true);
        setShowLoginForm(false);
        setShowRegisterForm(false);
        logout();
        setTimeout(() => {
          setLoggingOut(false);
          verifyInvitation(true);
        }, 500);
      }
    }
  }, [user, eventInfo]);


  useEffect(() => {
    if (registeredSuccessfully && successCountdown > 0) {
      const timer = setTimeout(() => {
        setSuccessCountdown(successCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (registeredSuccessfully && successCountdown === 0) {
      navigate(`/events/${eventInfo.eventId}`);
    }
  }, [registeredSuccessfully, successCountdown, eventInfo, navigate]);

  const verifyInvitation = async (forceShowForm = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await invitationsAPI.verify(token);
      setEventInfo(response.data);
      if (!user || forceShowForm) {
        if (response.data.userExists) {
          setShowLoginForm(true);
          setShowRegisterForm(false);
        } else {
          setRegisterData({ 
            username: '', 
            email: response.data.inviteeEmail,
            password: '',
            role: 'USER'
          });
          setShowRegisterForm(true);
          setShowLoginForm(false);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message;
      if (err.response?.status === 400) {
        if (errorMessage?.includes('expired')) {
          setError('This invitation has expired. Please contact the event organizer for a new invitation.');
        } else if (errorMessage?.includes('Invalid')) {
          setError('This invitation link is not valid. Please check the link or contact the event organizer.');
        } else {
          setError(errorMessage || 'This invitation is no longer valid.');
        }
      } else {
        setError('Unable to load invitation details. Please try again or contact the event organizer.');
      }
      setEventInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const acceptAndRegister = async () => {
    if (eventInfo) {
      const status = (eventInfo.status || eventInfo.eventStatus || eventInfo.event?.status || '').toString().toUpperCase();
      const spots = eventInfo.availableSpots ?? eventInfo.spotsRemaining ?? eventInfo.available ?? null;
      if (status === 'CANCELLED' || status === 'FINISHED') {
        setError(`This event is ${status.toLowerCase()} and cannot accept registrations.`);
        return;
      }
      if (spots !== null && Number(spots) <= 0) {
        setError('This event is full and cannot accept more registrations.');
        return;
      }
    }

    try {
      setRegistering(true);
      setError(null);
      const response = await invitationsAPI.acceptAndRegister(token);
      setRegisteredSuccessfully(true);
      setSuccessCountdown(3);
    } catch (err) {
      const status = err.response?.status;
      const errorMessage = (err.response?.data?.error || err.response?.data?.message || '').toString();

      if (status === 409) {
        if (errorMessage.toLowerCase().includes('already')) {
          setAlreadyRegistered(true);
          setRegisteredSuccessfully(true);
          setSuccessCountdown(3);
        } else {
          setError('This event is full and cannot accept more registrations.');
        }
      } else if (status === 410 || errorMessage.toLowerCase().includes('expired')) {
        setError('This invitation has expired. Please contact the event organizer.');
      } else if (errorMessage.toLowerCase().includes('email')) {
        setError('This invitation was sent to a different email address. Please sign in with the invited email.');
        logout();
        setShowLoginForm(true);
      } else if (errorMessage.toLowerCase().includes('cancel') || errorMessage.toLowerCase().includes('finish')) {
        setError('This event is no longer accepting registrations.');
      } else {
        setError(errorMessage || 'Failed to complete registration. Please try again.');
      }

      setRegistering(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await authAPI.login(loginData);
      login(response.data);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const response = await authAPI.register(registerData);
      register(response.data);

      try {
        await acceptAndRegister();
      } catch (err) {
        console.error('acceptAndRegister after registration failed', err);
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleShowRegisterForm = () => {
    setRegisterData({ 
      ...registerData, 
      email: eventInfo.inviteeEmail,
      role: 'USER'
    });
    setShowLoginForm(false);
    setShowRegisterForm(true);
    setAuthError('');
  };

  const handleShowLoginForm = () => {
    setShowRegisterForm(false);
    setShowLoginForm(true);
    setAuthError('');
  };

  const roleOptions = [
    { value: 'USER', label: 'User (Attendee)' },
    { value: 'ORGANIZER', label: 'Organizer' },
  ];

  if (loading) {
    return <Spinner.Container>Verifying invitation...</Spinner.Container>;
  }

  if (loggingOut) {
    return <Spinner.Container>Switching accounts...</Spinner.Container>;
  }

  if (registering) {
    return <Spinner.Container>Registering you for the event...</Spinner.Container>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <Card.Header>
            <h1 className="text-2xl font-bold text-gray-900">Event Invitation</h1>
          </Card.Header>
          <Card.Content>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {registeredSuccessfully && eventInfo && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {alreadyRegistered ? "You're Already Registered!" : "Successfully Registered!"}
                </h2>
                <p className="text-gray-600 mb-4">
                  {alreadyRegistered 
                    ? <>You're already registered for <strong>{eventInfo.eventTitle}</strong></>
                    : <>You've been registered for <strong>{eventInfo.eventTitle}</strong></>
                  }
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-900">
                    Redirecting to event page in <strong>{successCountdown}</strong> seconds...
                  </p>
                </div>
                <Button onClick={() => navigate(`/events/${eventInfo.eventId}`)}>
                  Go to Event Now
                </Button>
              </div>
            )}

            {eventInfo && !registeredSuccessfully && (
              <div className="py-6">
                {/* Event Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{eventInfo.eventTitle}</h3>
                      {eventInfo.eventDescription && (
                        <p className="text-gray-600 text-sm mb-2">{eventInfo.eventDescription}</p>
                      )}
                      {eventInfo.eventAddress && (
                        <p className="text-sm text-gray-600 mb-1">
                          📍 {eventInfo.eventAddress}
                        </p>
                      )}
                      {eventInfo.eventDate && (
                        <p className="text-sm text-gray-600">
                          🕐 {formatDateForDisplay(eventInfo.eventDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Login Form */}
                {showLoginForm && !user && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      Log in to accept invitation
                    </h3>
                    {authError && (
                      <Alert variant="error" className="mb-4" onClose={() => setAuthError('')}>
                        {authError}
                      </Alert>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                      <Input
                        label="Username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                        placeholder="Enter your username"
                      />
                      <Input
                        label="Password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        placeholder="Enter your password"
                      />
                      <Button type="submit" className="w-full" disabled={authLoading}>
                        {authLoading ? 'Logging in...' : 'Log In'}
                      </Button>
                    </form>
                    {!eventInfo.userExists && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          Don't have an account?{' '}
                          <button
                            onClick={handleShowRegisterForm}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Create one
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Register Form */}
                {showRegisterForm && !user && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      Create account to accept invitation
                    </h3>
                    {authError && (
                      <Alert variant="error" className="mb-4" onClose={() => setAuthError('')}>
                        {authError}
                      </Alert>
                    )}
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Email:</strong> {eventInfo.inviteeEmail}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Your account will be created for this email address
                        </p>
                      </div>
                      <Input
                        label="Username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                        minLength={3}
                        placeholder="Choose a username"
                      />
                      <Input
                        label="Password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Choose a password"
                      />
                      <Button type="submit" className="w-full" disabled={authLoading}>
                        {authLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                    {eventInfo.userExists && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          Already have an account?{' '}
                          <button
                            onClick={handleShowLoginForm}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Log in
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 text-center">
                  <Button variant="secondary" onClick={() => navigate('/')}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {error && !eventInfo && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Invitation Issue</h2>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/')}>
                    Go to Events
                  </Button>
                  <Button variant="secondary" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

export default InviteAccept;
