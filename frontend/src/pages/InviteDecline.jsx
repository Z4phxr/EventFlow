import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationsAPI } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

function InviteDecline() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    declineInvitation();
  }, [token]);

  const declineInvitation = async () => {
    try {
      setLoading(true);
      const response = await invitationsAPI.decline(token);
      setResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to decline invitation');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner.Container>Processing your response...</Spinner.Container>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <Card.Header>
            <h1 className="text-2xl font-bold text-gray-900">Invitation Response</h1>
          </Card.Header>
          <Card.Content>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {result && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Declined</h2>
                <p className="text-gray-600 mb-6">{result.message}</p>
                <Button onClick={() => navigate('/')}>
                  View All Events
                </Button>
              </div>
            )}

            {error && !result && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Unable to Decline Invitation</h2>
                <Button onClick={() => navigate('/')}>
                  Go to Events
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

export default InviteDecline;
