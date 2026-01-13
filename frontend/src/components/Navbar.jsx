import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Badge from './Badge';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) => `
    px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-out
    ${isActive(path) 
      ? 'bg-white text-sky-600 shadow-lg shadow-sky-900/20 scale-105' 
      : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105 hover:shadow-md'
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
    bg-white text-sky-600 border-2 border-white shadow-lg shadow-sky-900/30
    hover:bg-sky-50 hover:shadow-xl hover:shadow-sky-900/40 hover:scale-105
    active:scale-95
  `;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 shadow-xl shadow-sky-500/20 backdrop-blur-sm">
      <div className="w-full px-8 lg:px-12">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Left Side - Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group mr-20">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-sky-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <span className="text-sky-500 font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              EventFlow
            </span>
          </Link>

          {/* Right Side - Navigation + Buttons + User */}
          <div className="flex items-center gap-6">
            {/* Navigation Links */}
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
                  <Link to="/notifications" className={navLinkClass('/notifications')}>
                    Notifications
                  </Link>
                  <Link to="/demo" className={navLinkClass('/demo')}>
                    Demo
                  </Link>
                </>
              )}
            </div>

            {/* Auth Buttons / Logout */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button onClick={logout} className={buttonClass}>
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
                  <Link to="/login">
                    <button className={buttonClass}>
                      Login
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className={primaryButtonClass}>
                      Get Started
                    </button>
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
