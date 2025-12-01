import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await usersAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        const userData = response.data.data;
        
        // Store user info with correct role
        localStorage.setItem('user', JSON.stringify({
          userId: userData.userId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        }));
        
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-branding">
        <div className="auth-logo">🍃</div>
        <h1 className="auth-title">ireNet</h1>
        <p className="auth-tagline">Join the fight against food waste</p>
      </div>
      
      <div className="auth-card">
        <h2 className="auth-welcome">Welcome.</h2>
        <p className="auth-subtitle">Sign in to your account or create a new one.</p>
        
        <div className="info-box">
          <span className="info-icon">ℹ️</span>
          <p>
            <strong>First time here?</strong> Click the "Sign Up" tab to create your account. 
            Already have an account? Use "Sign In" with your email and password.
          </p>
        </div>

        <div className="auth-tabs">
          <Link to="/login" className="auth-tab auth-tab-active">Sign In</Link>
          <Link to="/register" className="auth-tab">Sign Up</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary btn-full">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
