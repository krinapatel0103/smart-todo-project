// Login.jsx 
// Login page - authenticates user and stores JWT token in localStorage.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
// import { hashPassword } from '../utils/hashPassword';
import '../styles/Auth.css';

function Login() {
    // ------- State -------
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // -------- Handle Input change ------
     const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ----- Handle Submit ---------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Hash the password before sending to backend
      // const hashedPassword = await hashPassword(formData.password);
      
      // OAuth2 form-data format — FastAPI expects this for login
      const form = new FormData();
      form.append('username', formData.username);
      form.append('password', formData.password);

      const response = await axiosInstance.post('/auth/login', form);

      // Save token and username in localStorage
      localStorage.setItem('token',    response.data.access_token);
      localStorage.setItem('username', response.data.username);

      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-header">
          <h1>Smart Todo</h1>
          <p>Login to your account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;