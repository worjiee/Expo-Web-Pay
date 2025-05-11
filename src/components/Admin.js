import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const Admin = () => {
  const [codes, setCodes] = useState([]);
  const [count, setCount] = useState(1);
  const [customCode, setCustomCode] = useState('');
  const [bulkCodes, setBulkCodes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to access the admin dashboard', {
        position: 'top-right',
        autoClose: 3000
      });
      navigate('/login');
      return;
    }
    fetchCodes();
    setFadeIn(true);
  }, [navigate]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/codes');
      setCodes(res.data);
    } catch (err) {
      console.error('Error fetching codes:', err);
      setError('Error fetching codes');
      toast.error('Error fetching codes');
      
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000
        });
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const generateCode = async () => {
    try {
      const res = await api.post('/codes/generate');
      setCodes([...codes, res.data]);
      toast.success('Code generated successfully');
    } catch (err) {
      console.error('Error generating code:', err);
      setError('Error generating code');
      toast.error('Error generating code');
    }
  };

  const generateMultipleCodes = async () => {
    try {
      const res = await api.post('/codes/generate-multiple', { count: count });
      setCodes([...codes, ...res.data]);
      toast.success(`${count} codes generated successfully`);
    } catch (err) {
      console.error('Error generating multiple codes:', err);
      setError('Error generating codes');
      toast.error('Error generating codes');
    }
  };

  const createCustomCode = async () => {
    if (!customCode.trim()) {
      toast.error('Please enter a custom code');
      return;
    }
    
    try {
      const res = await api.post('/codes/create-custom', { code: customCode.trim() });
      setCustomCode('');
      toast.success('Custom code created successfully');
      fetchCodes();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error creating custom code';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file);
  };

  const uploadBulkCodes = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/codes/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setCodes([...codes, ...res.data]);
      setFile(null);
      toast.success('Codes imported successfully');
    } catch (err) {
      console.error('Error importing codes:', err);
      setError('Error importing codes');
      toast.error('Error importing codes');
    }
  };

  const deleteCode = async (id) => {
    if (!window.confirm('Are you sure you want to delete this code?')) {
      return;
    }
    
    try {
      await api.delete(`/codes/${id}`);
      setCodes(codes.filter(code => code._id !== id));
      toast.success('Code deleted successfully');
      fetchCodes();
    } catch (err) {
      setError('Error deleting code');
      toast.error('Error deleting code');
    }
  };

  const deleteAllCodes = async () => {
    if (!window.confirm(`WARNING: This will permanently delete ALL ${codes.length} codes. Are you absolutely sure?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete('/codes/delete-all');
      setCodes([]);
      toast.success(`Successfully deleted ${codes.length} codes`);
    } catch (err) {
      console.error('Delete all error:', err);
      setError('Error deleting all codes');
      toast.error(err.response?.data?.message || 'Error deleting all codes');
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
          
          <div className="d-flex align-items-center">
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
            
            <div 
              className="btn me-3"
              style={{
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                letterSpacing: '0.5px',
                border: 'none'
              }}
            >
              <i className="fas fa-lock me-2"></i>
              Admin Portal
            </div>
            
            <button 
              onClick={handleLogout}
              className="btn" 
              style={{
                background: 'rgba(255,70,70,0.2)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,70,70,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,70,70,0.2)';
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>
    
      <div className={`container mt-5 ${fadeIn ? 'fadeIn' : ''}`} style={{ animation: 'fadeIn 1s ease-in-out' }}>
        <ToastContainer />
        
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h2 className="mb-0">Admin Dashboard</h2>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="me-3" style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="fas fa-user-shield" style={{ fontSize: '1.5rem', color: 'white' }}></i>
              </div>
              <div>
                <h5 className="mb-0">Welcome, Admin</h5>
                <p className="text-muted mb-0">Manage your game access codes</p>
              </div>
            </div>
          </div>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Generate Random Codes</h5>
              </div>
              <div className="card-body">
                <button className="btn btn-primary me-2 mb-2" onClick={generateCode}>
                  Generate Single Code
                </button>
                <div className="input-group mb-3">
                  <input
                    type="number"
                    className="form-control"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                  />
                  <button className="btn btn-success" onClick={generateMultipleCodes}>
                    Generate Multiple Codes
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Add Custom Codes</h5>
              </div>
              <div className="card-body">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter custom code"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={createCustomCode}>
                    Create Custom Code
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Bulk Import Codes (one per line)</label>
                  <textarea
                    className="form-control mb-2"
                    rows="5"
                    placeholder="Enter codes, one per line"
                    value={bulkCodes}
                    onChange={(e) => setBulkCodes(e.target.value)}
                  ></textarea>
                  <button 
                    className="btn btn-primary w-100" 
                    onClick={uploadBulkCodes}
                    disabled={loading}
                  >
                    {loading ? 'Importing...' : 'Import Codes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Code Database</h5>
            <button 
              className="btn btn-danger" 
              onClick={deleteAllCodes}
              disabled={loading || codes.length === 0}
            >
              Delete All Codes
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Generated At</th>
                    <th>Used At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code._id}>
                      <td>{code.code}</td>
                      <td>
                        <span className={`badge ${code.isUsed ? 'bg-danger' : 'bg-success'}`}>
                          {code.isUsed ? 'Used' : 'Available'}
                        </span>
                      </td>
                      <td>{new Date(code.createdAt).toLocaleString()}</td>
                      <td>
                        {code.usedAt ? new Date(code.usedAt).toLocaleString() : 'Not used yet'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => deleteCode(code._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin; 