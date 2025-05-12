import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/axios';
import config from '../config';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setFadeIn(true);
    // Log the API URL on component mount
    console.log('Login component mounted. Using API URL:', config.API_URL);
    
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token already exists, redirecting to admin');
      navigate('/admin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
    setConnectionError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setConnectionError(false);

    console.log('Attempting login with username:', formData.username);
    
    try {
      console.log('Making login request to API with fallback...');
      
      // Show loading toast
      toast.info('Logging in...', {
        position: 'top-right',
        autoClose: 2000
      });
      
      // Try to login
      const res = await api.post('/auth/login', formData);
      console.log('Login response:', res.data);
      
      if (res.data && res.data.token) {
        // Store token
        localStorage.setItem('token', res.data.token);
        console.log('Token stored in localStorage');
        
        // Show success message
        toast.success('Login successful!', {
          position: 'top-right',
          autoClose: 2000
        });
        
        // Redirect to admin page
        navigate('/admin');
      } else {
        console.error('Invalid response format - no token in response:', res.data);
        setError('Invalid response from server');
        toast.error('Server error: Invalid response format');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Error logging in';
      
      if (err.response) {
        console.error('Server response error:', err.response.data);
        console.error('Response status:', err.response.status);
        errorMessage = err.response.data?.message || 'Invalid username or password';
      } else if (err.request) {
        console.error('No response received:', err.request);
        errorMessage = 'No response from server. Please check your connection.';
        setConnectionError(true);
      } else {
        console.error('Error setting up request:', err.message);
        errorMessage = 'Error connecting to server. Please try again.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check local storage
  const debugLocalStorage = () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Current token in localStorage:', token);
      return true;
    } catch (err) {
      console.error('Error accessing localStorage:', err);
      return false;
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{
        background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.5s ease-in-out',
        padding: '15px 0'
      }}>
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <span style={{ fontWeight: '700', letterSpacing: '1px' }}>End of The Road</span>
          </Link>
          
          <div className="d-flex">
            <Link 
              to="/" 
              className="btn me-3" 
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
            >
              <i className="fas fa-gamepad me-2"></i>
              Public Portal
            </Link>
          </div>
        </div>
      </nav>
      
      <div className={`container mt-5 ${fadeIn ? 'fadeIn' : ''}`}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow">
              <div className="card-header text-center bg-primary text-white">
                <h2 className="mb-0">Admin Login</h2>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <div style={{ 
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <i className="fas fa-user-shield" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <h3 className="card-title">Welcome Back</h3>
                  <p className="text-muted">Please login to access your admin dashboard</p>
                </div>
                
                {error && 
                  <div className={`alert ${connectionError ? 'alert-warning' : 'alert-danger'}`}>
                    {error}
                    {connectionError && (
                      <div className="mt-2 small">
                        <strong>Note:</strong> If this is your first login attempt, the server might be starting up. 
                        Please wait a moment and try again.
                      </div>
                    )}
                  </div>
                }
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="username">
                        <i className="fas fa-user me-2"></i>
                        Username
                      </label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="form-floating">
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="password">
                        <i className="fas fa-key me-2"></i>
                        Password
                      </label>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Logging in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Login to Dashboard
                      </>
                    )}
                  </button>
                  
                  {/* Help text for troubleshooting */}
                  <div className="text-center mt-3">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      Default credentials: admin / admin123
                    </small>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="footer-contact p-3 bg-light rounded">
                <p className="mb-0">
                  <i className="fas fa-question-circle me-2 text-primary"></i>
                  Need help? Contact <a href="mailto:sacayan.karl@gmail.com" className="text-primary">administrator</a>
                </p>
                <p className="mt-2 mb-0 text-muted small">
                  <i className="fas fa-copyright me-1"></i> 2023 End of The Road Game. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default Login; 