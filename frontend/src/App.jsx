import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import OrganizerDashboard from './pages/OrganizerDashboard';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    if (token && username && role) {
      setUser({ username, role });
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('role', userData.role);
    setUser({ username: userData.username, role: userData.role });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<EventsList />} />
        <Route path="/events/:id" element={<EventDetail user={user} />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" /> : <Register onRegister={handleLogin} />} 
        />
        <Route 
          path="/organizer" 
          element={
            user && (user.role === 'ORGANIZER' || user.role === 'ADMIN') 
              ? <OrganizerDashboard /> 
              : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
