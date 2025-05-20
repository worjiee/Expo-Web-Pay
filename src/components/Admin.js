import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import MockAPI from '../MockAPI'; // We're keeping the same API interface
import { Link } from 'react-router-dom';
import { listenForCodeChanges } from '../firebaseConfig'; // Import Firebase listener

const Admin = () => {
  const [codes, setCodes] = useState([]);
  const [count, setCount] = useState(1);
  const [customCode, setCustomCode] = useState('');
  const [bulkCodes, setBulkCodes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [file, setFile] = useState(null);
  const [syncLink, setSyncLink] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const navigate = useNavigate();
  
  // Add state for last update timestamp
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Add state for real-time update status
  const [realtimeStatus, setRealtimeStatus] = useState('initializing');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast.error('Please log in to access the admin dashboard', {
        position: 'top-right',
        autoClose: 3000
      });
      navigate('/login');
      return;
    }
    
    // Initial fetch
    fetchCodes();
    setFadeIn(true);
    
    // Setup Firebase real-time listener
    const unsubscribe = listenForCodeChanges((updatedCodes) => {
      console.log('Received real-time code update from Firebase:', updatedCodes);
      setCodes(updatedCodes);
      setLastUpdated(new Date());
      setRealtimeStatus('connected');
    });
    
    // Set realtime status based on Firebase connection
    setRealtimeStatus('connected');
    
    // Clean up Firebase listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigate]);

  const fetchCodes = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      // Use MockAPI which now uses Firebase
      const response = await MockAPI.codes.getAll();
      if (response.success && response.data) {
        setCodes(response.data);
        // Update the last updated timestamp
        setLastUpdated(new Date());
      } else {
        console.error('Error in fetchCodes response format:', response);
        setError('Error fetching codes: ' + (response.message || 'Invalid response format'));
      }
    } catch (err) {
      console.error('Error fetching codes:', err);
      setError('Error fetching codes: ' + (err.message || 'Unknown error'));
      
      if (!showLoading) {
        // Don't show toast for background refreshes
        return;
      }
      
      toast.error('Error fetching codes');
      
      // If it's an authentication error
      if (err.message && err.message.includes('Invalid or expired token')) {
        localStorage.removeItem('auth_token');
        toast.error('Session expired. Please log in again.', {
          position: 'top-right',
          autoClose: 3000
        });
        navigate('/login');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await MockAPI.auth.logout();
      toast.info('Logged out successfully');
      navigate('/login');
    } catch (err) {
      console.error('Error during logout:', err);
      localStorage.removeItem('auth_token');
      navigate('/login');
    }
  };

  const generateCode = async () => {
    try {
      setLoading(true);
      const response = await MockAPI.codes.generate();
      console.log('Generate code response:', response);
      
      if (response.success && response.data) {
        // Add new code to state - now handled by Firebase real-time updates
        
        // Show success toast
        toast.success(
          <div>
            <div>Generated new code: <strong>{response.data.code}</strong></div>
            <small>Code has been saved to the database and synced to all devices</small>
          </div>,
          {
            position: 'top-center',
            autoClose: 3000
          }
        );
        
        // Update the sync status briefly
        setSyncStatus('Syncing...');
        setTimeout(() => {
          setSyncStatus('');
        }, 2000);
      } else {
        console.error('Invalid response from code generation:', response);
        toast.error('Error generating code: ' + (response.message || 'Invalid response format'));
      }
    } catch (err) {
      console.error('Error generating code:', err);
      toast.error(`Error generating code: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateMultipleCodes = async () => {
    try {
      // Ensure count is a positive integer
      const countValue = parseInt(count) || 1;
      if (isNaN(countValue) || countValue < 1 || countValue > 100) {
        toast.error('Please enter a valid count (1-100)');
        return;
      }
      
      setLoading(true);
      console.log(`Generating ${countValue} codes...`);
      const response = await MockAPI.codes.generateMultiple({ count: countValue });
      console.log('Generate multiple codes response:', response);
      
      if (response.success && response.data) {
        // Generate a list of codes for display
        const codesList = response.data.map(c => c.code).join(', ');
        
        // Show success toast with sync information
        toast.success(
          <div>
            <div>Generated {response.data.length} new codes</div>
            <div style={{ 
              maxHeight: '60px', 
              overflowY: 'auto', 
              fontSize: '0.8em',
              marginTop: '5px',
              padding: '5px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '3px' 
            }}>
              {codesList}
            </div>
            <small>Codes have been saved to the database and synced to all devices</small>
          </div>,
          {
            position: 'top-center',
            autoClose: 5000
          }
        );
        
        // Reset count
        setCount(1);
        
        // Update the sync status briefly
        setSyncStatus('Syncing...');
        setTimeout(() => {
          setSyncStatus('');
        }, 2000);
      } else {
        console.error('Invalid response from multiple code generation:', response);
        toast.error('Error generating codes: ' + (response.message || 'Invalid response format'));
      }
    } catch (err) {
      console.error('Error generating multiple codes:', err);
      toast.error(`Error generating codes: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createCustomCode = async () => {
    if (!customCode) {
      toast.error('Please enter a custom code', { 
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Execute the create code API call - now uses Firebase
      const response = await MockAPI.codes.create({ 
        code: customCode.trim().toUpperCase(),
      });
      
      if (response.success) {
        // Clear input
        setCustomCode('');
        
        // Show success message
        toast.success('Custom code created successfully', { 
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        toast.error(response.message || 'Error creating custom code', { 
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Error creating custom code:', err);
      toast.error(err.message || 'Error creating custom code', { 
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to clear all codes from database
  const clearAllCodes = async () => {
    if (window.confirm('Are you sure you want to delete ALL codes from the database? This cannot be undone!')) {
      try {
        setLoading(true);
        
        // Delete all codes from Firebase
        const response = await MockAPI.codes.deleteAll();
        
        if (response.success) {
          // Show success message
          toast.success('All codes have been permanently erased from the database', {
            position: 'top-right',
            autoClose: 3000
          });
        } else {
          toast.error('Error clearing all codes: ' + (response.message || 'Unknown error'), {
            position: 'top-right',
            autoClose: 3000
          });
        }
      } catch (err) {
        console.error('Error clearing codes:', err);
        toast.error('Error clearing codes: ' + err.message, {
          position: 'top-right',
          autoClose: 3000
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteCode = async (codeId) => {
    try {
      // Make sure we have a valid code ID
      if (!codeId) {
        toast.error('Invalid code ID');
        return;
      }
      
      const response = await MockAPI.codes.delete(codeId);
      
      if (response.success) {
        toast.success('Code deleted successfully', {
          position: 'top-right',
          autoClose: 3000
        });
        
        // Refresh the codes list
        fetchCodes();
      } else {
        console.error('Error deleting code:', response);
        toast.error(`Error deleting code: ${response.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting code:', err);
      toast.error(`Error deleting code: ${err.message || 'Unknown error'}`);
    }
  };

  // Function to manually trigger sync
  const forceSync = () => {
    // Fetch fresh codes
    fetchCodes();
    
    // Show a toast notification
    toast.info('Syncing codes with all devices...', {
      position: 'top-right',
      autoClose: 2000
    });
    
    // Update sync status
    setSyncStatus('Syncing...');
    setTimeout(() => {
      setSyncStatus('');
    }, 2000);
  };

  return (
    <>
      {/* Navigation Bar with animation */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
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
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
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
    
      <div 
        className={`container mt-5 ${fadeIn ? 'fadeIn' : ''}`} 
        style={{ 
          animation: 'fadeIn 1s ease-in-out',
          background: '#0d1117',
          color: '#c9d1d9',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <ToastContainer />
        
        <div className="card mb-4" style={{ background: '#161b22', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}>
          <div className="card-header" style={{ background: '#21262d', borderBottom: '1px solid #30363d', color: 'white' }}>
            <h2 className="mb-0">Admin Dashboard</h2>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="me-3" style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="fas fa-user-shield" style={{ fontSize: '1.5rem', color: 'white' }}></i>
              </div>
              <div>
                <h5 className="mb-0" style={{ color: 'white' }}>Welcome, Admin</h5>
                <p className="text-muted mb-0">Manage your game access codes</p>
                </div>
              </div>
              <div>
                <div>
                  <button 
                    className="btn"
                    onClick={forceSync}
                    disabled={syncStatus === 'Syncing...'}
                    style={{
                      background: '#238636',
                      color: 'white',
                      border: 'none',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    {syncStatus || 'Force Sync'}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="alert" style={{ background: '#0d1b2a', color: '#93c5fd', border: '1px solid #1e40af' }}>
                <i className="fas fa-info-circle me-2"></i>
                <strong>Info:</strong> Codes are automatically synchronized across all your devices.
                {realtimeStatus === 'connected' && (
                  <span className="ms-2 badge" style={{ background: '#065f46', color: 'white' }}>
                    <i className="fas fa-cloud-upload-alt me-1"></i>
                    Firebase Sync Active
                  </span>
                )}
                {realtimeStatus === 'offline' && (
                  <span className="ms-2 badge" style={{ background: '#92400e', color: 'white' }}>
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Firebase Offline
                  </span>
                )}
              </div>
              <div className="row mt-3">
                <div className="col">
                  <div className="card" style={{ background: '#21262d', border: 'none', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)' }}>
                    <div className="card-body text-center">
                      <h3 className="display-4" style={{ color: 'white' }}>{codes.length}</h3>
                      <p style={{ color: '#8b949e' }}>Total Codes</p>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card" style={{ background: '#21262d', border: 'none', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)' }}>
                    <div className="card-body text-center">
                      <h3 className="display-4" style={{ color: '#4ade80' }}>{codes.filter(c => !c.used && !c.isUsed).length}</h3>
                      <p style={{ color: '#8b949e' }}>Available Codes</p>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card" style={{ background: '#21262d', border: 'none', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)' }}>
                    <div className="card-body text-center">
                      <h3 className="display-4" style={{ color: '#f87171' }}>{codes.filter(c => c.used || c.isUsed).length}</h3>
                      <p style={{ color: '#8b949e' }}>Used Codes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card" style={{ background: '#161b22', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}>
              <div className="card-header" style={{ background: '#21262d', borderBottom: '1px solid #30363d', color: 'white' }}>
                <h5 style={{ color: 'white' }}>Generate Random Codes</h5>
              </div>
              <div className="card-body">
                <button className="btn me-2 mb-2" style={{ background: '#1f6feb', color: 'white', border: 'none' }} onClick={generateCode}>
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
                    style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d' }}
                  />
                  <button 
                    className="btn" 
                    style={{ background: '#238636', color: 'white', border: 'none' }} 
                    onClick={generateMultipleCodes}
                    disabled={loading}
                  >
                    {loading ? 'Generating...' : 'Generate Multiple Codes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card" style={{ background: '#161b22', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}>
              <div className="card-header" style={{ background: '#21262d', borderBottom: '1px solid #30363d', color: 'white' }}>
                <h5 style={{ color: 'white' }}>Add New Code</h5>
              </div>
              <div className="card-body">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter code (5 letters recommended)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d' }}
                  />
                  <button className="btn" style={{ background: '#1f6feb', color: 'white', border: 'none' }} onClick={createCustomCode}>
                    Add Code
                  </button>
                </div>
                <small style={{ color: '#8b949e' }}>Added codes will work on all devices immediately.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#161b22', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}>
          <div className="card-header d-flex justify-content-between align-items-center" style={{ background: '#21262d', borderBottom: '1px solid #30363d', color: 'white' }}>
            <div>
            <h5 style={{ color: 'white' }}>Code Database</h5>
              {lastUpdated && (
                <small style={{ color: '#8b949e' }}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </small>
              )}
            </div>
            <div>
              <div className="btn-group">
                <button
                  className="btn"
                  onClick={() => {
                    // Export codes as CSV
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "ID,Code,Status,GeneratedAt,UsedAt\n"
                      + codes.map(c => {
                          return `${c.id || c._id},"${c.code}","${(c.used || c.isUsed) ? 'Used' : 'Available'}","${c.generatedAt || c.createdAt || 'N/A'}","${c.usedAt || 'N/A'}"`;
                        }).join("\n");
                    
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "codes.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    toast.success('Codes exported successfully');
                  }}
                  disabled={codes.length === 0}
                  style={{ background: '#1f6feb', color: 'white', border: 'none', marginRight: '5px' }}
                >
                  <i className="fas fa-download me-2"></i>
                  Export Codes
                </button>
                <button 
                  className="btn" 
                  onClick={clearAllCodes}
                  disabled={loading || codes.length === 0}
                  style={{ background: '#da3633', color: 'white', border: 'none' }}
                >
                  <i className="fas fa-trash-alt me-2"></i>
                  Delete All Codes
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search codes..."
                onChange={(e) => {
                  // Filter codes based on search query
                  const searchQuery = e.target.value.toLowerCase();
                  if (searchQuery) {
                    // Filter locally for search
                    fetchCodes().then(() => {
                      setCodes(prevCodes => prevCodes.filter(c => 
                        c.code.toLowerCase().includes(searchQuery) ||
                        (c.id && c.id.toString().includes(searchQuery)) ||
                        (c._id && c._id.toString().includes(searchQuery))
                      ));
                    });
                  } else {
                    // If search query is empty, fetch all codes
                    fetchCodes();
                  }
                }}
                style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d' }}
              />
            </div>
            <div className="table-responsive">
              <table className="table" style={{ color: '#c9d1d9' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #30363d' }}>
                    <th style={{ color: '#8b949e' }}>Code</th>
                    <th style={{ color: '#8b949e' }}>Status</th>
                    <th style={{ color: '#8b949e' }}>Generated At</th>
                    <th style={{ color: '#8b949e' }}>Used At</th>
                    <th style={{ color: '#8b949e' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-3" style={{ color: '#8b949e' }}>
                        <i className="fas fa-info-circle me-2"></i>
                        No codes available. Generate some codes to get started.
                      </td>
                    </tr>
                  ) : (
                    codes.map((code) => (
                      <tr key={code.id || code._id} style={{ borderBottom: '1px solid #30363d' }}>
                        <td>
                          <strong style={{ color: 'white' }}>{code.code}</strong>
                        </td>
                        <td>
                          <span className={`badge ${code.used || code.isUsed ? 'bg-danger' : ''}`} style={{ 
                            background: code.used || code.isUsed ? '#da3633' : '#238636',
                            color: 'white'
                          }}>
                            {code.used || code.isUsed ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td style={{ color: '#8b949e' }}>
                          {code.generatedAt ? new Date(code.generatedAt).toLocaleString() : 'Invalid Date'}
                        </td>
                        <td style={{ color: '#8b949e' }}>
                          {code.usedAt ? new Date(code.usedAt).toLocaleString() : 'Not used yet'}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm" 
                            onClick={() => deleteCode(code.id || code._id)}
                            style={{ background: '#da3633', color: 'white', border: 'none' }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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