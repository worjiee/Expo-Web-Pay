import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import MockAPI from '../MockAPI'; // Use MockAPI directly
import { Link } from 'react-router-dom';
import { 
  getLocalCodes, 
  saveLocalCodes, 
  getCodeSyncChannel, 
  getSyncTimestamp, 
  isSyncNeeded,
  setupBroadcastListener,
  startPollingSync,
  stopPollingSync,
  updateSyncTimestamp
} from '../proxyService';

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
  
  // Add state for last sync check timestamp
  const [lastSyncCheck, setLastSyncCheck] = useState(null);
  
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
    
    // Set initial sync timestamp
    setLastSyncCheck(getSyncTimestamp());
    
    // Setup the broadcast channel listener for real-time updates
    const broadcastListenerSet = setupBroadcastListener((message) => {
      console.log('Broadcast message received in Admin component:', message);
      
      // Handle different message types
      switch (message.action) {
        case 'CODE_USED_GLOBALLY':
          // Show a toast notification when a code is used
          toast.info(`Code ${message.data.code} was verified on another device`, {
            position: 'top-right',
            autoClose: 3000
          });
          // Refresh codes list when a code status changes
          console.log('Code status changed, refreshing codes list');
          fetchCodes(false); // Don't show loading indicator for automatic refreshes
          break;
        case 'CODE_STATUS_CHANGED':
          // Show a toast notification for status changes
          toast.info(`Code ${message.data.code} status changed to ${message.data.used ? 'used' : 'unused'}`, {
            position: 'top-right',
            autoClose: 3000
          });
          // Refresh codes list
          fetchCodes(false);
          break;
        case 'SYNC_TIMESTAMP_UPDATED':
          // Silent update for timestamp changes
          setLastSyncCheck(getSyncTimestamp());
          break;
        case 'CODES_UPDATED':
          toast.info('Code database updated', {
            position: 'top-right',
            autoClose: 3000
          });
          fetchCodes(false);
          break;
        case 'CODE_ADDED':
          toast.success(`New code ${message.data.code} added`, {
            position: 'top-right',
            autoClose: 3000
          });
          fetchCodes(false);
          break;
        case 'CODES_IMPORTED':
          if (message.data.count > 0) {
            toast.success(`${message.data.count} codes imported on another device`, {
              position: 'top-right',
              autoClose: 3000
            });
          }
          fetchCodes(false);
          break;
        default:
          // For any other updates, check if sync is needed
          if (isSyncNeeded(lastSyncCheck)) {
            console.log('Sync needed based on timestamp, refreshing codes list');
            fetchCodes(false);
            setLastSyncCheck(getSyncTimestamp());
          }
      }
    });
    
    // Set realtime status based on broadcast channel availability
    setRealtimeStatus(broadcastListenerSet ? 'connected' : 'offline');
    
    // Start polling for sync across devices (every 1 second for more real-time updates)
    startPollingSync(() => {
      console.log('Admin component - polling refresh triggered');
      fetchCodes(false);
    }, 1000); // Poll every second instead of 2 seconds
    
    // Clean up interval when component unmounts
    return () => {
      // Stop polling when component unmounts
      stopPollingSync();
    };
  }, [navigate, lastSyncCheck]);

  const fetchCodes = async (showLoading = true) => {
    try {
      if (showLoading) {
      setLoading(true);
      }
      // Use MockAPI directly
      const response = await MockAPI.codes.getAll();
      if (response.success && response.data) {
        setCodes(response.data);
        // Update the last updated timestamp
        setLastUpdated(new Date());
        // Update the last sync check timestamp
        setLastSyncCheck(getSyncTimestamp());
      } else {
        console.error('Error in fetchCodes response format:', response);
        setError('Error fetching codes: Invalid response format');
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
        // Add new code to state
        setCodes(prevCodes => [...prevCodes, response.data]);
        
        // Update the last sync check timestamp
        setLastSyncCheck(getSyncTimestamp());
        
        // Show success toast with sync information
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
        toast.error('Error generating code: Invalid response format');
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
      if (isNaN(count) || count < 1 || count > 100) {
        toast.error('Please enter a valid count (1-100)');
        return;
      }
      
      setLoading(true);
      const response = await MockAPI.codes.generateMultiple({ count });
      
      if (response.success && response.data) {
        // Add new codes to state
        setCodes(prevCodes => [...prevCodes, ...response.data]);
        
        // Update the last sync check timestamp
        setLastSyncCheck(getSyncTimestamp());
        
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
        toast.error('Error generating codes: Invalid response format');
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
      
      // Execute the create code API call
      await MockAPI.codes.create({ 
        code: customCode.trim().toUpperCase(),
      });
      
      // Refresh codes list
      fetchCodes();
      
      // Clear input
      setCustomCode('');
      
      // Show success message
      toast.success('Custom code created successfully', { 
        position: 'top-right',
        autoClose: 3000
      });
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

  // Function to clear all codes from localStorage
  const clearAllCodes = () => {
    if (window.confirm('Are you sure you want to delete ALL codes from the database? This cannot be undone!')) {
      try {
        // Clear codes directly from localStorage
        localStorage.setItem('mockDb_codes', JSON.stringify([]));
        
        // Refresh codes list
        fetchCodes();
        
        // Show success message
        toast.success('All codes have been deleted', {
          position: 'top-right',
          autoClose: 3000
        });
    } catch (err) {
        console.error('Error clearing codes:', err);
        toast.error('Error clearing codes: ' + err.message, {
          position: 'top-right',
          autoClose: 3000
        });
      }
    }
  };

  const deleteCode = async (codeToDelete) => {
    try {
      const response = await MockAPI.codes.delete({ code: codeToDelete });
      
      if (response.success) {
        // Remove code from state
        setCodes(prevCodes => prevCodes.filter(c => c.code !== codeToDelete));
        toast.success(`Deleted code: ${codeToDelete}`, {
          position: 'top-right',
          autoClose: 3000
        });
        } else {
        console.error('Error deleting code:', response);
        toast.error(`Error deleting code: ${response.message || 'Unknown error'}`);
        }
      } catch (err) {
      console.error('Error deleting code:', err);
      toast.error(`Error deleting code: ${err.message || 'Unknown error'}`);
    }
  };

  const deleteAllCodes = async () => {
    if (window.confirm('Are you sure you want to delete ALL codes? This cannot be undone!')) {
    try {
        const response = await MockAPI.codes.deleteAll();
        
        if (response.success) {
      setCodes([]);
          toast.success('All codes deleted successfully', {
            position: 'top-right',
            autoClose: 3000
          });
        } else {
          console.error('Error deleting all codes:', response);
          toast.error(`Error deleting all codes: ${response.message || 'Unknown error'}`);
        }
    } catch (err) {
        console.error('Error deleting all codes:', err);
        toast.error(`Error deleting all codes: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Function to manually trigger sync
  const forceSync = () => {
    // Update the timestamp to trigger sync on other devices
    updateSyncTimestamp();
    
    // Fetch fresh codes
    fetchCodes();
    
    // Show a toast notification
    toast.info('Syncing codes with all devices...', {
      position: 'top-right',
      autoClose: 2000
    });
    
    // Update sync status
    setSyncStatus('Syncing...');
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
            <div className="d-flex align-items-center justify-content-between">
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
              <div>
                <div>
                  <button 
                    className="btn btn-info"
                    onClick={forceSync}
                    disabled={syncStatus === 'Syncing...'}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    {syncStatus || 'Force Sync'}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Info:</strong> Codes are automatically synchronized across all your devices.
                {realtimeStatus === 'connected' && (
                  <span className="ms-2 badge bg-success">
                    <i className="fas fa-cloud-upload-alt me-1"></i>
                    Realtime Sync Active
                  </span>
                )}
                {realtimeStatus === 'offline' && (
                  <span className="ms-2 badge bg-warning text-dark">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Offline
                  </span>
                )}
              </div>
              <div className="row mt-3">
                <div className="col">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h3 className="display-4">{codes.length}</h3>
                      <p className="text-muted">Total Codes</p>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h3 className="display-4">{codes.filter(c => !c.used && !c.isUsed).length}</h3>
                      <p className="text-muted">Available Codes</p>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h3 className="display-4">{codes.filter(c => c.used || c.isUsed).length}</h3>
                      <p className="text-muted">Used Codes</p>
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
                <h5>Add New Code</h5>
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
                  />
                  <button className="btn btn-primary" onClick={createCustomCode}>
                    Add Code
                  </button>
                </div>
                <small className="text-muted">Added codes will work on all devices.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
            <h5>Code Database</h5>
              {lastUpdated && (
                <small className="text-muted">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </small>
              )}
            </div>
            <div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary"
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
                >
                  <i className="fas fa-download me-2"></i>
                  Export Codes
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    // Implementation for sharing codes between devices
                    try {
                      // Filter only unused codes for sharing
                      const unusedCodes = codes.filter(c => !c.used && !c.isUsed);
                      
                      if (unusedCodes.length === 0) {
                        toast.error('No unused codes available to share');
                        return;
                      }
                      
                      // Convert the codes to a shareable format
                      const shareCodes = unusedCodes.map(c => ({
                        id: c.id,
                        code: c.code,
                        used: false,
                        generatedAt: c.generatedAt
                      }));
                      
                      // Convert to Base64 string for sharing
                      const encodedCodes = btoa(JSON.stringify(shareCodes));
                      
                      // Create a shareable link
                      const shareLink = `${window.location.origin}?import=${encodedCodes}`;
                      
                      // Copy to clipboard
                      navigator.clipboard.writeText(shareLink)
                        .then(() => {
                          toast.success('Share link copied to clipboard! Paste this link on your other device.');
                        })
                        .catch(err => {
                          console.error('Could not copy to clipboard:', err);
                          // Show the link in a modal as fallback
                          toast.info(
                            <div>
                              <p>Copy this link manually:</p>
                              <input 
                                type="text"
                                className="form-control form-control-sm mt-2"
                                value={shareLink}
                                onClick={(e) => e.target.select()}
                                readOnly
                              />
                            </div>,
                            { autoClose: 10000 }
                          );
                        });
                    } catch (err) {
                      console.error('Error sharing codes:', err);
                      toast.error('Error creating share link');
                    }
                  }}
                  disabled={codes.filter(c => !c.used && !c.isUsed).length === 0}
                >
                  <i className="fas fa-share-alt me-2"></i>
                  Share Codes
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={clearAllCodes}
                  disabled={loading || codes.length === 0}
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
                    setCodes(codes.filter(c => 
                      c.code.toLowerCase().includes(searchQuery) ||
                      (c.id && c.id.toString().includes(searchQuery)) ||
                      (c._id && c._id.toString().includes(searchQuery))
                    ));
                  } else {
                    // If search query is empty, fetch all codes
                    fetchCodes();
                  }
                }}
              />
            </div>
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
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        <i className="fas fa-info-circle me-2"></i>
                        No codes available. Generate some codes to get started.
                      </td>
                    </tr>
                  ) : (
                    codes.map((code) => (
                      <tr key={code.id || code._id}>
                        <td>
                          <strong>{code.code}</strong>
                        </td>
                        <td>
                          <span className={`badge ${code.used || code.isUsed ? 'bg-danger' : 'bg-success'}`}>
                            {code.used || code.isUsed ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td>{code.generatedAt ? new Date(code.generatedAt).toLocaleString() : 'Invalid Date'}</td>
                        <td>
                          {code.usedAt ? new Date(code.usedAt).toLocaleString() : 'Not used yet'}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => deleteCode(code.code)}
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