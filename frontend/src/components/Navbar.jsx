import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api';
import Badge from './Badge';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      
      const handleNotificationUpdate = () => {
        fetchUnreadCount();
      };
      
      window.addEventListener('notification-marked-read', handleNotificationUpdate);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notification-marked-read', handleNotificationUpdate);
      };
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      if (error.response?.status === 403) {
        setUnreadCount(0);
      } else if (error.response?.status === 401) {
        setUnreadCount(0);
      } else {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) => `
    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out
    ${isActive(path) 
      ? 'bg-white text-sky-600 shadow-lg shadow-sky-900/20 scale-105' 
      : 'bg-white/30 text-white border border-white/10 backdrop-blur-sm shadow-lg shadow-sky-700/20 hover:bg-white/40 hover:scale-105'
    }
  `;

  const buttonClass = `
    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out
    bg-white/20 border-2 border-white/40 text-white
    hover:bg-white hover:text-sky-600 hover:border-white hover:shadow-lg hover:shadow-white/20 hover:scale-105
    active:scale-95
  `;

  const primaryButtonClass = `
    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out
    bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30
    hover:shadow-xl hover:shadow-sky-500/40 hover:scale-105
    active:scale-95
  `;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 shadow-xl shadow-sky-500/20 backdrop-blur-sm">
      <div className="w-full px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 py-2">
          <Link to="/" className="flex items-center gap-3 group mr-20">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-sky-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <span className="text-sky-500 font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              EventFlow
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className={navLinkClass('/')}>
                Events
              </Link>
              
              {user && (
                <>
                  {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                    <Link to="/organizer" className={navLinkClass('/organizer')}>
                      Dashboard
                    </Link>
                  )}
                  <Link to="/notifications" className={`${navLinkClass('/notifications')} relative`}>
                    Notifications
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/demo" className={navLinkClass('/demo')}>
                    Demo
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button onClick={handleLogout} className={buttonClass}>
                    Logout
                  </button>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sky-500 font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-semibold">{user.username}</span>
                      <Badge variant={user.role === 'ORGANIZER' ? 'warning' : 'info'} className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className={navLinkClass('/login')}>
                    Login
                  </Link>
                  <Link to="/register" className={navLinkClass('/register')}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
