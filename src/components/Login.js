import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    // Add fade-in animation when component mounts
    setFadeIn(true);
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
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      toast.success('Login successful!', {
        position: 'top-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
      
      // Open admin page in a new tab
      setTimeout(() => {
        const adminUrl = window.location.origin + '/admin';
        window.open(adminUrl, '_blank');
        
        // Optionally, navigate back to the public portal in the current tab
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging in');
      toast.error(err.response?.data?.message || 'Wrong username or password!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navigation Bar with animation */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{
        background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.5s ease-in-out',
        padding: '15px 0'
      }}>
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <div style={{ 
              width: '45px',
              height: '45px',
              marginRight: '10px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <img 
                src="/company_logo.jpg" 
                alt="Company Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              <i className="fas fa-gamepad me-2"></i>
              Public Portal
            </Link>
            
            <Link 
              to="/login" 
              className="btn"
              style={{
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
            >
              <i className="fas fa-lock me-2"></i>
              Admin Portal
            </Link>
          </div>
        </div>
      </nav>
      
      <div className={`container mt-5 ${fadeIn ? 'fadeIn' : ''}`} style={{ animation: 'fadeIn 1s ease-in-out' }}>
        <ToastContainer />
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header text-center">
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
                    marginBottom: '20px',
                    animation: 'pulse 2s infinite'
                  }}>
                    <i className="fas fa-user-shield" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <h3 className="card-title text-center">Welcome Back</h3>
                  <p className="text-muted">Please login to access your admin dashboard</p>
                </div>
                
                {error && <div className="alert alert-danger">{error}</div>}
                
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
                </form>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="footer-contact" style={{
                background: 'linear-gradient(to right, rgba(58, 123, 213, 0.1), rgba(0, 210, 255, 0.1))',
                padding: '15px 20px',
                borderRadius: '10px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                animation: 'fadeIn 1s ease-in-out'
              }}>
                <p style={{ margin: 0 }}>
                  <i className="fas fa-question-circle me-2" style={{ color: '#3a7bd5' }}></i>
                  Need help? Contact <a href="mailto:sacayan.karl@gmail.com" style={{
                    color: '#3a7bd5',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#00d2ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#3a7bd5';
                  }}
                  >sacayan.karl@gmail.com</a>
                </p>
                <p className="mt-2 mb-0" style={{ fontSize: '0.8rem', color: '#888' }}>
                  <i className="fas fa-copyright me-1"></i> 2023 End of The Road Game. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login; 