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
    
    // Set up real-time update listener
    const handleCodeUpdate = (event) => {
      const updateData = event.detail;
      console.log('Real-time code update received:', updateData);
      
      // Different actions based on the update type
      switch (updateData.type) {
        case 'code-used':
          // Update the specific code that was used
          if (updateData.code && (updateData.code.id || updateData.code._id)) {
            console.log('Updating specific code:', updateData.code);
            setCodes(prevCodes => {
              return prevCodes.map(code => {
                // Check if this is the specific code that was used
                if ((code.id && code.id === updateData.code.id) || 
                    (code._id && code._id === updateData.code._id) ||
                    (code.code && code.code === updateData.code.code)) {
                  console.log('Marking code as used:', code);
                  return {
                    ...code,
                    used: true,
                    usedAt: updateData.code.usedAt
                  };
                }
                return code;
              });
            });
            
            toast.info(`Code "${updateData.code.code}" was just used!`, {
              position: 'top-right',
              autoClose: 3000
            });
          } else {
            // If we don't have proper code details, refresh the whole list
            console.warn('Incomplete code data in update event, refreshing all codes');
            fetchCodes();
          }
          break;
          
        case 'code-generated':
        case 'code-created':
          // Refresh the entire list to be safe
          fetchCodes();
          break;
          
        case 'code-deleted':
          // Remove the deleted code from the list
          setCodes(prevCodes => 
            prevCodes.filter(code => 
              code.id !== updateData.code.id && code._id !== updateData.code._id
            )
          );
          break;
          
        case 'codes-deleted':
          // Clear all codes
          setCodes([]);
          break;
          
        default:
          // For unknown events, just refresh the list
          fetchCodes();
      }
    };
    
    // Listen for custom events for real-time updates
    window.addEventListener('code-update', handleCodeUpdate);
    
    // Listen for localStorage events (for cross-tab updates)
    const handleStorageEvent = (event) => {
      if (event.key === 'code_update_event') {
        try {
          const updateData = JSON.parse(event.newValue);
          if (updateData && updateData.type) {
            console.log('Storage event code update received:', updateData);
            
            // Apply the same logic as direct events
            switch (updateData.type) {
              case 'code-used':
                if (updateData.code && (updateData.code.id || updateData.code._id)) {
                  console.log('Updating specific code from storage event:', updateData.code);
                  setCodes(prevCodes => {
                    return prevCodes.map(code => {
                      // Check if this is the specific code that was used
                      if ((code.id && code.id === updateData.code.id) || 
                          (code._id && code._id === updateData.code._id) ||
                          (code.code && code.code === updateData.code.code)) {
                        return {
                          ...code,
                          used: true,
                          usedAt: updateData.code.usedAt
                        };
                      }
                      return code;
                    });
                  });
                  
                  toast.info(`Code "${updateData.code.code}" was just used!`, {
                    position: 'top-right',
                    autoClose: 3000
                  });
                } else {
                  // If we don't have proper code details, refresh the whole list
                  fetchCodes();
                }
                break;
                
              default:
                // For all other event types, just refresh the full list
                fetchCodes();
            }
          }
        } catch (e) {
          console.error('Error processing storage event:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener('code-update', handleCodeUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
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
      const response = await api.post('/codes/generate');
      console.log('Generate code response:', response);
      
      // Make sure the response has the expected format
      if (response && response.data) {
        if (response.data.code) {
          // If the API returns a single code object
          setCodes(prevCodes => [...prevCodes, response.data.code]);
        } else if (Array.isArray(response.data)) {
          // If the API returns an array of codes
          setCodes(prevCodes => [...prevCodes, ...response.data]);
        } else {
          // If we can't determine the format, fetch all codes
          await fetchCodes();
        }
        toast.success('Code generated successfully');
      } else {
        console.error('Invalid response format:', response);
        toast.error('Error generating code: Invalid response format');
      }
    } catch (err) {
      console.error('Error generating code:', err);
      setError('Error generating code');
      toast.error('Error generating code');
    }
  };

  const generateMultipleCodes = async () => {
    try {
      const response = await api.post('/codes/generate-multiple', { count: count });
      console.log('Generate multiple codes response:', response);
      
      // Make sure the response has the expected format
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // If the API returns an array of codes
          setCodes(prevCodes => [...prevCodes, ...response.data]);
        } else if (response.data.codes && Array.isArray(response.data.codes)) {
          // If the API returns an object with a codes array
          setCodes(prevCodes => [...prevCodes, ...response.data.codes]);
        } else {
          // If we can't determine the format, fetch all codes
          await fetchCodes();
        }
        toast.success(`${count} codes generated successfully`);
      } else {
        console.error('Invalid response format:', response);
        toast.error('Error generating codes: Invalid response format');
      }
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
      console.log(`Attempting to delete code with ID: ${id}`);
      await api.delete(`/codes/${id}`);
      
      // Refresh the codes list after deletion
      await fetchCodes();
      toast.success('Code deleted successfully');
    } catch (err) {
      console.error('Error deleting code:', err);
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
            <div className="mt-3">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Info:</strong> Codes are now persistent and will be saved in your browser.
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
                <h5>Add Custom Codes</h5>
              </div>
              <div className="card-body">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter custom code"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  />
                  <button className="btn btn-primary" onClick={createCustomCode}>
                    Create Custom Code
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Import Codes from Link</label>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Paste shared code link here"
                      onChange={(e) => {
                        const value = e.target.value;
                        // Try to extract the import parameter from the URL
                        try {
                          // Check if it's a URL or just the import parameter
                          let importParam;
                          if (value.includes('?import=')) {
                            const url = new URL(value);
                            importParam = url.searchParams.get('import');
                          } else {
                            // Assume it's just the encoded data
                            importParam = value;
                          }
                          
                          if (importParam) {
                            // Decode the base64 encoded codes
                            const codesData = JSON.parse(atob(importParam));
                            
                            if (Array.isArray(codesData) && codesData.length > 0) {
                              // Add the codes to our state
                              let added = 0;
                              const updatedCodes = [...codes];
                              
                              codesData.forEach(newCode => {
                                const codeExists = codes.some(c => c.code === newCode.code);
                                if (!codeExists) {
                                  // Convert the imported code to the format needed
                                  const codeToAdd = {
                                    id: newCode.id || Math.floor(Math.random() * 100000),
                                    code: newCode.code,
                                    used: false,
                                    createdAt: newCode.createdAt || new Date().toISOString()
                                  };
                                  updatedCodes.push(codeToAdd);
                                  added++;
                                  
                                  // Also create the code via API to ensure persistence
                                  try {
                                    api.post('/codes/create-custom', { code: codeToAdd.code });
                                  } catch (err) {
                                    console.error('Error adding imported code:', err);
                                  }
                                }
                              });
                              
                              // Update the codes state
                              setCodes(updatedCodes);
                              
                              // Show success message
                              if (added > 0) {
                                toast.success(`Successfully imported ${added} new codes.`);
                                // Clear the input
                                e.target.value = '';
                              } else {
                                toast.info('No new codes were imported. You may already have these codes.');
                              }
                            }
                          }
                        } catch (err) {
                          console.error('Error importing codes from link:', err);
                          if (value.length > 10) {
                            toast.error('Invalid code import link. Please check the format.');
                          }
                        }
                      }}
                    />
                    <button 
                      className="btn btn-info"
                      onClick={() => {
                        // Display instructions
                        toast.info(
                          <div>
                            <h6>How to Import Codes:</h6>
                            <ol className="ps-3 mb-0">
                              <li>On another device, use the "Share Codes" button.</li>
                              <li>Copy the shared link.</li>
                              <li>Paste it in the field above.</li>
                            </ol>
                          </div>, 
                          { autoClose: 8000 }
                        );
                      }}
                    >
                      <i className="fas fa-question-circle"></i>
                    </button>
                  </div>
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
                    onClick={() => {
                      // Split the text into lines and process each code
                      const codeLines = bulkCodes.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                      
                      if (codeLines.length === 0) {
                        toast.error('Please enter at least one code');
                        return;
                      }
                      
                      // Process each code
                      codeLines.forEach(async (code) => {
                        try {
                          await api.post('/codes/create-custom', { code: code.toUpperCase() });
                        } catch (err) {
                          console.error('Error adding bulk code:', code, err);
                        }
                      });
                      
                      // Clear the textarea and show success message
                      setBulkCodes('');
                      toast.success(`${codeLines.length} codes imported successfully`);
                      fetchCodes();
                    }}
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
            <div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    // Export codes as CSV
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "ID,Code,Status,CreatedAt,UsedAt\n"
                      + codes.map(c => {
                          return `${c.id || c._id},"${c.code}","${(c.used || c.isUsed) ? 'Used' : 'Available'}","${c.createdAt || 'N/A'}","${c.usedAt || 'N/A'}"`;
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
                    // Generate a shareable link with encoded codes data
                    // Only include codes that haven't been used
                    const unusedCodes = codes.filter(c => !c.used && !c.isUsed);
                    
                    if (unusedCodes.length === 0) {
                      toast.error('No unused codes available to share');
                      return;
                    }
                    
                    // Create compact version of codes for sharing (only essential data)
                    const shareCodes = unusedCodes.map(c => ({
                      id: c.id || c._id,
                      code: c.code,
                      createdAt: c.createdAt
                    }));
                    
                    // Encode the codes as a base64 string
                    const encodedCodes = btoa(JSON.stringify(shareCodes));
                    
                    // Create the share URL with the current domain
                    const shareUrl = `${window.location.origin}/?import=${encodedCodes}`;
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      toast.success('Shareable link copied to clipboard! You can send this to another device.');
                    }).catch(err => {
                      console.error('Failed to copy: ', err);
                      // Fallback: create a text area element and copy manually
                      const textArea = document.createElement("textarea");
                      textArea.value = shareUrl;
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        toast.success('Shareable link copied to clipboard! You can send this to another device.');
                      } catch (err) {
                        toast.error('Failed to copy link. Please copy it manually.');
                        console.error('Copy failed:', err);
                      }
                      document.body.removeChild(textArea);
                    });
                  }}
                  disabled={codes.filter(c => !c.used && !c.isUsed).length === 0}
                >
                  <i className="fas fa-share-alt me-2"></i>
                  Share Codes
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={deleteAllCodes}
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
                        <td>{code.createdAt ? new Date(code.createdAt).toLocaleString() : 'Invalid Date'}</td>
                        <td>
                          {code.usedAt ? new Date(code.usedAt).toLocaleString() : 'Not used yet'}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => deleteCode(code.id || code._id)}
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