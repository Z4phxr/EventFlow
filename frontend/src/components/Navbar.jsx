import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Button from './Button';
import Badge from './Badge';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) => `
    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'text-white bg-white/10' 
      : 'text-white/80 hover:text-white hover:bg-white/5'
    }
  `;

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-primary-700 to-primary-600 shadow-soft-lg border-b border-primary-800/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-primary-600 font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-white">EventFlow</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link to="/" className={navLinkClass('/')}>
              Events
            </Link>
            
            {user && (
              <>
                {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                  <Link to="/organizer" className={navLinkClass('/organizer')}>
                    My Dashboard
                  </Link>
                )}
                <Link to="/notifications" className={navLinkClass('/notifications')}>
                  Notifications
                </Link>
                <Link to="/demo" className={navLinkClass('/demo')}>
                  Demo
                </Link>
              </>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-medium">{user.username}</span>
                    <Badge variant={user.role === 'ORGANIZER' ? 'warning' : 'info'} className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="bg-white text-primary-600 hover:bg-gray-100">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
