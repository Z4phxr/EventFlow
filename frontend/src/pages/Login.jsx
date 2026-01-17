import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authAPI, invitationsAPI } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import Alert from '../components/Alert';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  
  const invitationToken = location.state?.invitationToken;
  const eventId = location.state?.eventId;

  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      setError('Session expired. Please log in again.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      login(response.data);
      
      // If coming from invitation, accept and register
      if (invitationToken) {
        try {
          const inviteResponse = await invitationsAPI.acceptAndRegister(invitationToken);
          navigate(`/events/${inviteResponse.data.eventId}`, {
            state: { message: inviteResponse.data.message }
          });
        } catch (inviteErr) {
          setError(inviteErr.response?.data?.error || inviteErr.response?.data?.message || 'Failed to accept invitation');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="animate-slide-up">
          <Card.Header>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
          </Card.Header>
          
          <Card.Content className="space-y-4">
            {error && (
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="Enter your username"
              />
              
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Enter your password"
              />
              
              <Button 
                type="submit" 
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Card.Content>
          
          <Card.Footer>
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Create one
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}

export default Login;
