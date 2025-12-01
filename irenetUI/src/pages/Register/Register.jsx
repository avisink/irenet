import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersAPI, organizationsAPI } from '../../services/api';
import Dropdown from '../../components/Dropdown/Dropdown';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
    organizationName: '',
    contactInfo: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState('');
  const navigate = useNavigate();

  const roleOptions = [
    { value: 'donor', label: 'Individual Donor' },
    { value: 'organization', label: 'Nonprofit Organization' },
  ];

  const validatePassword = (password) => {
    if (!password) {
      setPasswordValidation('');
      return false;
    }

    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [];
    if (!minLength) requirements.push('8 characters');
    if (!hasUpperCase) requirements.push('one uppercase letter');
    if (!hasLowerCase) requirements.push('one lowercase letter');
    if (!hasNumber) requirements.push('one number');
    if (!hasSpecialChar) requirements.push('one special character');

    if (requirements.length > 0) {
      setPasswordValidation(`Password must contain at least: ${requirements.join(', ')}`);
      return false;
    }

    setPasswordValidation('✓ Password meets all requirements');
    return true;
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: newValue,
    });

    if (e.target.name === 'password') {
      validatePassword(newValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(formData.password)) {
      setError('Please fix password requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate organization fields if role is organization
    if (formData.role === 'organization') {
      if (!formData.organizationName || !formData.contactInfo) {
        setError('Organization name and contact information are required');
        return;
      }
    }

    setLoading(true);

    try {
      // Hash password in production - for now just send it
      const response = await usersAPI.create({
        name: formData.name,
        email: formData.email,
        passwordHash: formData.password, // In production, hash this
        role: formData.role,
      });

      if (response.data.success) {
        const userId = response.data.data.userId;

        // If organization, create organization record
        if (formData.role === 'organization') {
          try {
            await organizationsAPI.create({
              userId: userId,
              orgName: formData.organizationName,
              contactInfo: formData.contactInfo,
            });
          } catch (orgErr) {
            console.error('Error creating organization:', orgErr);
            const errorMessage = orgErr.response?.data?.error || orgErr.message || 'Unknown error';
            setError(`User created but organization setup failed: ${errorMessage}. Please contact support.`);
            setLoading(false);
            return;
          }
        }

        // Store user info
        localStorage.setItem('user', JSON.stringify({
          userId: userId,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }));

        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
          <Link to="/login" className="auth-tab">Sign In</Link>
          <Link to="/register" className="auth-tab auth-tab-active">Sign Up</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>
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
            <label htmlFor="role">I am a...</label>
            <Dropdown
              id="role"
              name="role"
              options={roleOptions}
              value={formData.role}
              onChange={handleChange}
              placeholder="Select your role"
              required
            />
          </div>
          
          {formData.role === 'organization' && (
            <>
              <div className="form-group">
                <label htmlFor="organizationName">Organization Name</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="Food Bank of..."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactInfo">Contact Information</label>
                <input
                  type="text"
                  id="contactInfo"
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  placeholder="Phone, address, etc."
                  required
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              validationMessage={passwordValidation}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
