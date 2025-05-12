import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import MockAPI from '../MockAPI'; // Use MockAPI directly
import { Link } from 'react-router-dom';
import { getLocalCodes, saveLocalCodes } from '../proxyService';

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
  const navigate = useNavigate();

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
    fetchCodes();
    setFadeIn(true);
    
    // Set up a simple interval to refresh codes every 10 seconds
    const refreshInterval = setInterval(() => {
      fetchCodes();
    }, 10000);
    
    // Clean up interval when component unmounts
    return () => {
      clearInterval(refreshInterval);
    };
  }, [navigate]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      // Use MockAPI directly
      const response = await MockAPI.codes.getAll();
      if (response.success && response.data) {
        setCodes(response.data);
      } else {
        console.error('Error in fetchCodes response format:', response);
        setError('Error fetching codes: Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching codes:', err);
      setError('Error fetching codes: ' + (err.message || 'Unknown error'));
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
      setLoading(false);
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
      const response = await MockAPI.codes.generate();
      console.log('Generate code response:', response);
      
      if (response.success && response.data) {
        // Add new code to state
        setCodes(prevCodes => [...prevCodes, response.data]);
        toast.success(`Generated new code: ${response.data.code}`, {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        console.error('Invalid response from code generation:', response);
        toast.error('Error generating code: Invalid response format');
      }
    } catch (err) {
      console.error('Error generating code:', err);
      toast.error(`Error generating code: ${err.message || 'Unknown error'}`);
    }
  };

  const generateMultipleCodes = async () => {
    try {
      if (isNaN(count) || count < 1 || count > 100) {
        toast.error('Please enter a valid count (1-100)');
        return;
      }
      
      const response = await MockAPI.codes.generateMultiple({ count });
      
      if (response.success && response.data) {
        // Add new codes to state
        setCodes(prevCodes => [...prevCodes, ...response.data]);
        toast.success(`Generated ${response.data.length} new codes`, {
          position: 'top-right',
          autoClose: 3000
        });
        setCount(1); // Reset count
      } else {
        console.error('Invalid response from multiple code generation:', response);
        toast.error('Error generating codes: Invalid response format');
      }
    } catch (err) {
      console.error('Error generating multiple codes:', err);
      toast.error(`Error generating codes: ${err.message || 'Unknown error'}`);
    }
  };

  const createCustomCode = async () => {
    try {
      if (!customCode || customCode.trim() === '') {
        toast.error('Please enter a valid code');
        return;
      }
      
      // Create custom code in correct format
      const formattedCode = customCode.trim().toUpperCase();
      
      // Check if code already exists
      const existingCode = codes.find(c => c.code.toUpperCase() === formattedCode);
      if (existingCode) {
        toast.error(`Code "${formattedCode}" already exists!`);
        return;
      }
      
      // Create new code object
      const newCode = {
        id: codes.length > 0 ? Math.max(...codes.map(c => c.id)) + 1 : 1,
        code: formattedCode,
        used: false,
        generatedAt: new Date().toISOString(),
        usedAt: null
      };
      
      // Add to codes array
      const updatedCodes = [...codes, newCode];
      
      // Save to localStorage
      saveLocalCodes(updatedCodes);
      
      // Update state
      setCodes(updatedCodes);
      
      // Clear input
      setCustomCode('');
      
      toast.success(`Created custom code: ${formattedCode}`);
    } catch (err) {
      console.error('Error creating custom code:', err);
      toast.error(`Error creating custom code: ${err.message || 'Unknown error'}`);
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
                                    MockAPI.codes.create(codeToAdd);
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
                          await MockAPI.codes.create({ code: code.toUpperCase() });
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
                    // Implementation for sharing codes between devices
                    console.log('Implement sharing codes between devices');
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