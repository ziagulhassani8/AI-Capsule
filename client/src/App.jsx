import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <div>
      <nav className="navbar">
        <span className="brand">🧠 AI Capsule</span>
        <div className="links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/login" className={isActive('/login')}>Login</Link>
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}