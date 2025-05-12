import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/axios';

// Hardcoded API URL to match the one in axios.js
const API_URL = 'https://q-o6boqvomj-karls-projects-fccc69ea.vercel.app/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setFadeIn(true);
    // Log the API URL on component mount
    console.log('Login component mounted. Using API URL:', API_URL);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting login with:', { username: formData.username });
    console.log('Using API URL:', API_URL);
    
    try {
      // Use the api instance from axios.js which has the correct baseURL
      const res = await api.post('/auth/login', formData);
      console.log('Login response:', res.data);
      
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        toast.success('Login successful!');
        navigate('/admin');
      } else {
        console.error('No token in response:', res.data);
        throw new Error('No token received in response');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Error logging in';
      
      if (err.response) {
        console.error('Server response:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        errorMessage = err.response.data.message || 'Invalid credentials';
      } else if (err.request) {
        console.error('No response received:', err.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        console.error('Error details:', err.message);
        errorMessage = 'Error setting up request. Please try again.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Admin Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <i className="fas fa-user"></i> Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            Login to Dashboard <i className="fas fa-sign-in-alt"></i>
          </button>
        </form>
        <div className="login-help">
          <p>Default credentials: admin / admin123</p>
          <p>Need help? Contact <a href="mailto:sacayan.karl@gmail.com">administrator</a></p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Login; 