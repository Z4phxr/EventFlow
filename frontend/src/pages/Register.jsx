import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authAPI } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Card from '../components/Card';
import Alert from '../components/Alert';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

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
      const response = await authAPI.register(formData);
      register(response.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'USER', label: 'User (Attendee)' },
    { value: 'ORGANIZER', label: 'Organizer' },
  ];

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="animate-slide-up">
          <Card.Header>
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="text-sm text-gray-600 mt-1">Join EventFlow today</p>
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
                minLength={3}
                placeholder="Choose a username"
                helperText="At least 3 characters"
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="your.email@example.com"
              />
              
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="Create a secure password"
                helperText="At least 6 characters"
              />
              
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={roleOptions}
                helperText="Choose your account type"
              />
              
              <Button 
                type="submit" 
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Card.Content>
          
          <Card.Footer>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}

export default Register;
