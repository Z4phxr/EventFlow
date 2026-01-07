import { Link } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  return (
    <nav>
      <h1><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>EventFlow</Link></h1>
      <div className="nav-links">
        <Link to="/">Events</Link>
        {user ? (
          <>
            {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
              <Link to="/organizer">My Events</Link>
            )}
            <span style={{ opacity: 0.8 }}>Welcome, {user.username}</span>
            <button onClick={onLogout} className="secondary">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
