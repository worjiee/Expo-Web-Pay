import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MockAPI from '../MockAPI'; // Use MockAPI directly
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
    
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
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
      // Show loading toast
      toast.info('Logging in...', {
        position: 'top-right',
        autoClose: 2000
      });
      
      // Use MockAPI directly for login
      const response = await MockAPI.auth.login(formData);
      console.log('Login response:', response);
      
      if (response.success && response.token) {
        // Token is already stored in localStorage by MockAPI
        console.log('Login successful, token stored');
        
        // Show success message
        toast.success('Login successful!', {
          position: 'top-right',
          autoClose: 2000
        });
        
        // Redirect to admin page
        navigate('/admin');
      } else {
        console.error('Invalid response format - unexpected response:', response);
        setError('Invalid response from server');
        toast.error('Server error: Invalid response format');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = err.message || 'Invalid username or password';
      
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setLoading(false);
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
                  
                  {/* Help text */}
                  <div className="text-center mt-3">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      Default credentials: admin / admin123
                    </small>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="card mt-4 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <i className="fas fa-question-circle text-info me-3" style={{ fontSize: '2rem' }}></i>
                  <div>
                    <h5 className="mb-1">Need help?</h5>
                    <p className="mb-0 small text-muted">
                      This is a demo application for managing access codes. Use the default credentials to log in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default Login; 