import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationsAPI } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

function InviteAccept() {
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

    acceptInvitation();
  }, [token]);

  const acceptInvitation = async () => {
    try {
      setLoading(true);
      const response = await invitationsAPI.accept(token);
      setResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to accept invitation');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner.Container>Processing your invitation...</Spinner.Container>;
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
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Accepted</h2>
                <p className="text-gray-600 mb-6">{result.message}</p>
                {result.eventTitle && (
                  <p className="text-gray-700 mb-4">Event: <strong>{result.eventTitle}</strong></p>
                )}
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/')}>
                    View All Events
                  </Button>
                  {result.eventId && (
                    <Button variant="secondary" onClick={() => navigate(`/events/${result.eventId}`)}>
                      View Event Details
                    </Button>
                  )}
                </div>
              </div>
            )}

            {error && !result && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Unable to Accept Invitation</h2>
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

export default InviteAccept;
