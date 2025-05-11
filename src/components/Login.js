import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../config';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL || config.API_URL;
  console.log('Login component using API URL:', apiUrl);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Attempting login with:', { username });
      console.log('Login request will be sent to:', `${apiUrl}/auth/login`);

      const response = await axios.post(`${apiUrl}/auth/login`, {
        username,
        password
      });

      console.log('Login response:', response.data);

      localStorage.setItem('token', response.data.token);
      toast.success('Login successful!');
      navigate('/admin-dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.message || 'Authentication failed');
        toast.error(err.response.data.message || 'Authentication failed');
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection.');
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Request error:', err.message);
        setError('Error setting up request. Please try again later.');
        toast.error('Error setting up request. Please try again later.');
      }
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
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