import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Notifications from './pages/Notifications';
import DemoDashboard from './pages/DemoDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<EventsList />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/organizer" 
              element={
                <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/demo" 
              element={
                <ProtectedRoute>
                  <DemoDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
