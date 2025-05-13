import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Simple debug component to identify issues with code verification on mobile
const Debug = () => {
  const [codeInput, setCodeInput] = useState('');
  const [storedCodes, setStoredCodes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifyLog, setVerifyLog] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [fixedCodesCount, setFixedCodesCount] = useState(0);

  useEffect(() => {
    loadCodesFromStorage();
    collectDeviceInfo();
    normalizeAllCodes();
  }, []);

  const collectDeviceInfo = () => {
    try {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        connection: navigator.connection ? {
          type: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        } : 'Not available'
      };
      
      setDeviceInfo(info);
      console.log('Device info collected:', info);
      
      // Log this to the debug panel too
      addToLog(`Device: ${info.platform}, Screen: ${info.screenWidth}x${info.screenHeight}, Browser: ${info.vendor}`);
    } catch (err) {
      console.error('Error collecting device info:', err);
    }
  };

  const loadCodesFromStorage = () => {
    try {
      // Try to get codes from localStorage
      const rawData = localStorage.getItem('mockDb_codes');
      addToLog(`Raw localStorage data length: ${rawData ? rawData.length : 0} bytes`);
      
      if (rawData) {
        try {
          const parsedCodes = JSON.parse(rawData);
          
          if (Array.isArray(parsedCodes)) {
            // Fix any field name inconsistencies
            const fixedCodes = parsedCodes.map(code => {
              const fixedCode = {...code};
              
              // Convert createdAt to generatedAt if needed
              if ('createdAt' in fixedCode && !('generatedAt' in fixedCode)) {
                fixedCode.generatedAt = fixedCode.createdAt;
                delete fixedCode.createdAt;
              }
              
              if (!('usedAt' in fixedCode)) {
                fixedCode.usedAt = fixedCode.used ? new Date().toISOString() : null;
              }
              
              return fixedCode;
            });
            
            // Save the fixed codes back to localStorage
            localStorage.setItem('mockDb_codes', JSON.stringify(fixedCodes));
            
            setStoredCodes(fixedCodes);
            addToLog(`Loaded and fixed ${fixedCodes.length} codes from localStorage`);
            
            // Log a sample of codes
            if (fixedCodes.length > 0) {
              const sampleCode = fixedCodes[0];
              addToLog(`Sample code: ${JSON.stringify(sampleCode)}`);
            }
          } else {
            addToLog(`Invalid codes format: not an array`);
            setErrorMessage('Invalid codes format in localStorage');
            setStoredCodes([]);
          }
        } catch (err) {
          setErrorMessage(`Error parsing localStorage data: ${err.message}`);
          addToLog(`JSON parse error: ${err.message}`);
        }
      } else {
        setErrorMessage('No codes found in localStorage');
        addToLog('No codes found in localStorage');
      }
    } catch (err) {
      setErrorMessage(`Error accessing localStorage: ${err.message}`);
      addToLog(`localStorage access error: ${err.message}`);
    }
  };

  const normalizeAllCodes = () => {
    try {
      // Get current codes
      const storedData = localStorage.getItem('mockDb_codes');
      
      if (!storedData) {
        toast.error('No codes found in localStorage');
        return;
      }
      
      // Parse the codes
      const codes = JSON.parse(storedData);
      let fixedCount = 0;
      
      // Normalize all codes - converting any createdAt to generatedAt
      const normalizedCodes = codes.map(code => {
        const updatedCode = {...code};
        
        // Fix field name inconsistencies
        if ('createdAt' in updatedCode && !('generatedAt' in updatedCode)) {
          updatedCode.generatedAt = updatedCode.createdAt;
          delete updatedCode.createdAt;
          fixedCount++;
        }
        
        // Ensure usedAt field exists
        if (!('usedAt' in updatedCode)) {
          updatedCode.usedAt = updatedCode.used ? new Date().toISOString() : null;
        }
        
        return updatedCode;
      });
      
      // Save normalized codes back to localStorage
      localStorage.setItem('mockDb_codes', JSON.stringify(normalizedCodes));
      
      // Update state
      setStoredCodes(normalizedCodes);
      setFixedCodesCount(fixedCount);
      
      addToLog(`Normalized ${fixedCount} codes with incorrect field names`);
      toast.success(`Fixed ${fixedCount} codes with field name inconsistencies`);
    } catch (err) {
      setErrorMessage(`Error normalizing codes: ${err.message}`);
      addToLog(`Normalize codes error: ${err.message}`);
    }
  };

  const addToLog = (message) => {
    setVerifyLog((prevLog) => {
      const newLog = [`[${new Date().toLocaleTimeString()}] ${message}`, ...prevLog];
      return newLog.slice(0, 20); // Keep log limited to 20 entries
    });
    console.log(message);
  };

  const generateTestCode = () => {
    // Generate a random 5-letter code
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    try {
      // Create new code object with standard fields
      const newCode = {
        id: storedCodes.length > 0 ? Math.max(...storedCodes.map(c => c.id || 0)) + 1 : 1,
        code: result,
        used: false,
        generatedAt: new Date().toISOString(),
        usedAt: null
      };
      
      // Add to codes array
      const updatedCodes = [...storedCodes, newCode];
      
      // Save to localStorage
      localStorage.setItem('mockDb_codes', JSON.stringify(updatedCodes));
      
      // Update state
      setStoredCodes(updatedCodes);
      setCodeInput(result);
      
      addToLog(`Generated test code: ${result}`);
      toast.success(`Generated code: ${result}`);
    } catch (err) {
      setErrorMessage(`Error generating code: ${err.message}`);
      addToLog(`Generate code error: ${err.message}`);
    }
  };

  const verifyCode = () => {
    if (!codeInput.trim()) {
      toast.error('Please enter a code to verify');
      return;
    }
    
    const standardizedInput = codeInput.trim().toUpperCase();
    addToLog(`Verifying code: ${standardizedInput}`);
    
    try {
      // Check if the code exists
      const matchingCodeIndex = storedCodes.findIndex(c => {
        const storedCode = (c.code || '').toString().trim().toUpperCase();
        const inputCode = standardizedInput.toString().trim().toUpperCase();
        const isMatch = storedCode === inputCode;
        
        addToLog(`Comparing: "${storedCode}" with "${inputCode}" = ${isMatch}`);
        
        return isMatch;
      });
      
      if (matchingCodeIndex === -1) {
        addToLog(`No matching code found for: ${standardizedInput}`);
        toast.error('Invalid code - not found');
        return;
      }
      
      const matchingCode = storedCodes[matchingCodeIndex];
      
      // Check if the code is already used
      if (matchingCode.used) {
        addToLog(`Code ${standardizedInput} is already used`);
        toast.error('Code already used');
        return;
      }
      
      // Mark as used
      const updatedCodes = [...storedCodes];
      updatedCodes[matchingCodeIndex] = {
        ...matchingCode,
        used: true,
        usedAt: new Date().toISOString()
      };
      
      // Save back to localStorage
      localStorage.setItem('mockDb_codes', JSON.stringify(updatedCodes));
      
      // Update state
      setStoredCodes(updatedCodes);
      
      addToLog(`Successfully verified code: ${standardizedInput}`);
      toast.success('Code verified successfully!');
    } catch (err) {
      setErrorMessage(`Error verifying code: ${err.message}`);
      addToLog(`Verify error: ${err.message}`);
    }
  };

  const clearAllCodes = () => {
    if (window.confirm('Are you sure you want to delete ALL codes? This cannot be undone!')) {
      localStorage.setItem('mockDb_codes', JSON.stringify([]));
      setStoredCodes([]);
      addToLog('All codes cleared from localStorage');
      toast.info('All codes cleared');
    }
  };

  const resetAllCodes = () => {
    if (window.confirm('Reset all codes to unused?')) {
      const resetCodes = storedCodes.map(code => ({
        ...code,
        used: false,
        usedAt: null
      }));
      localStorage.setItem('mockDb_codes', JSON.stringify(resetCodes));
      setStoredCodes(resetCodes);
      addToLog('All codes reset to unused');
      toast.info('All codes reset to unused');
    }
  };

  return (
    <div style={{
      backgroundImage: `url('/bg_game_moving.gif')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'auto'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1,
        overflow: 'auto'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'rgba(1, 22, 57, 0.9)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '15px 0',
          position: 'relative',
          zIndex: 10
        }}>
          <div className="container d-flex justify-content-between align-items-center">
            <Link to="/" className="d-flex align-items-center text-decoration-none">
              <img 
                src="/company_logo.jpg" 
                alt="End of The Road" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%',
                  marginRight: '10px',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }} 
              />
              <span style={{ 
                color: 'white', 
                fontSize: '1.4rem', 
                fontWeight: '600',
                letterSpacing: '0.5px'
              }}>
                End of The Road
              </span>
            </Link>
            
            <div className="d-flex">
              <Link 
                to="/" 
                className="text-white text-decoration-none d-flex align-items-center me-3"
                style={{ fontSize: '1rem' }}
              >
                <i className="fas fa-gamepad me-2"></i>
                <span className="d-none d-sm-inline">Public Portal</span>
              </Link>
              
              <Link 
                to="/login" 
                className="text-white text-decoration-none d-flex align-items-center me-3"
                style={{ fontSize: '1rem' }}
              >
                <i className="fas fa-lock me-2"></i>
                <span className="d-none d-sm-inline">Admin Portal</span>
              </Link>
              
              <Link 
                to="/debug" 
                className="text-white text-decoration-none d-flex align-items-center"
                style={{ 
                  fontSize: '1rem',
                  backgroundColor: 'rgba(255, 69, 69, 0.2)',
                  padding: '5px 10px',
                  borderRadius: '4px'
                }}
              >
                <i className="fas fa-bug me-2"></i>
                <span className="d-none d-sm-inline">Debug</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="container my-4">
          <div className="card shadow-lg border-0" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div className="card-header bg-primary text-white">
              <h2 className="m-0 py-2">Code Verification Debug Tool</h2>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <strong>Debug Tool:</strong> This page helps diagnose code verification issues on mobile devices. Use it to test and troubleshoot code verification.
              </div>
              
              {fixedCodesCount > 0 && (
                <div className="alert alert-success mb-4">
                  <h4 className="alert-heading"><i className="fas fa-check-circle me-2"></i>Field Name Consistency Fixed!</h4>
                  <p>We detected and fixed {fixedCodesCount} codes with incorrect field name format. The issue was:</p>
                  <ul>
                    <li>Test codes were using <code>generatedAt</code> field</li>
                    <li>Generated codes were using <code>createdAt</code> field</li>
                  </ul>
                  <p className="mb-0">This inconsistency was causing verification to fail on some devices. All codes now use <code>generatedAt</code> for timestamp consistency.</p>
                </div>
              )}
              
              {errorMessage && (
                <div className="alert alert-danger">
                  <strong>Error:</strong> {errorMessage}
                </div>
              )}
              
              <div className="row mb-4">
                <div className="col-12 col-md-6 mb-4 mb-md-0">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-secondary text-white">Test Code Verification</div>
                    <div className="card-body">
                      <div className="input-group mb-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter code to verify"
                          value={codeInput}
                          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        />
                        <button className="btn btn-primary" onClick={verifyCode}>
                          <i className="fas fa-check me-2"></i>
                          Verify
                        </button>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <button className="btn btn-success me-2 mb-2" onClick={generateTestCode}>
                          <i className="fas fa-plus me-2"></i>
                          Generate Test Code
                        </button>
                        
                        <button className="btn btn-warning me-2 mb-2" onClick={resetAllCodes}>
                          <i className="fas fa-sync me-2"></i>
                          Reset All Codes
                        </button>
                        
                        <button className="btn btn-info me-2 mb-2" onClick={normalizeAllCodes}>
                          <i className="fas fa-magic me-2"></i>
                          Fix All Codes
                        </button>
                        
                        <button className="btn btn-danger mb-2" onClick={clearAllCodes}>
                          <i className="fas fa-trash me-2"></i>
                          Clear All Codes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-12 col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-info text-white">Device Information</div>
                    <div className="card-body">
                      <div className="device-info small">
                        <div className="mb-2">
                          <strong>Browser:</strong> {deviceInfo.vendor || 'Unknown'}<br />
                          <strong>Platform:</strong> {deviceInfo.platform || 'Unknown'}<br />
                          <strong>User Agent:</strong> <span className="text-muted small" style={{wordBreak: 'break-all'}}>{deviceInfo.userAgent || 'Unknown'}</span>
                        </div>
                        
                        <div className="mb-2">
                          <strong>Screen:</strong> {deviceInfo.screenWidth}x{deviceInfo.screenHeight}px ({deviceInfo.pixelRatio}x)<br />
                          <strong>Viewport:</strong> {deviceInfo.viewportWidth}x{deviceInfo.viewportHeight}px<br />
                          <strong>Language:</strong> {deviceInfo.language || 'Unknown'}
                        </div>
                        
                        <div className="mb-2">
                          <strong>Storage:</strong> LocalStorage {deviceInfo.localStorage ? '✓' : '✗'}, 
                          SessionStorage {deviceInfo.sessionStorage ? '✓' : '✗'}, 
                          Cookies {deviceInfo.cookiesEnabled ? '✓' : '✗'}<br />
                        </div>
                        
                        {deviceInfo.connection && deviceInfo.connection !== 'Not available' && (
                          <div>
                            <strong>Connection:</strong> {deviceInfo.connection.type || 'Unknown'}<br />
                            <strong>Downlink:</strong> {deviceInfo.connection.downlink || 'Unknown'} Mbps<br />
                            <strong>Latency (RTT):</strong> {deviceInfo.connection.rtt || 'Unknown'} ms<br />
                            <strong>Data Saver:</strong> {deviceInfo.connection.saveData ? 'On' : 'Off'}<br />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row mt-4">
                <div className="col-12 col-md-6 mb-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-success text-white">Storage Statistics</div>
                    <div className="card-body">
                      <p><strong>Total Codes:</strong> {storedCodes.length}</p>
                      <p><strong>Used Codes:</strong> {storedCodes.filter(c => c.used).length}</p>
                      <p><strong>Available Codes:</strong> {storedCodes.filter(c => !c.used).length}</p>
                      
                      <div className="mt-3">
                        <button className="btn btn-info w-100" onClick={loadCodesFromStorage}>
                          <i className="fas fa-sync me-2"></i>
                          Refresh Code Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-dark text-white">Verification Log</div>
                <div className="card-body p-0">
                  <div 
                    style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      backgroundColor: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '0 0 5px 5px',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}
                  >
                    {verifyLog.length > 0 ? (
                      <div>
                        {verifyLog.map((log, index) => (
                          <div key={index} style={{ 
                            marginBottom: '5px',
                            borderBottom: index < verifyLog.length - 1 ? '1px dashed #eee' : 'none',
                            paddingBottom: '5px'
                          }}>
                            {log}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted text-center py-3">No log entries yet</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Link to="/" className="btn btn-primary">
                  <i className="fas fa-home me-2"></i>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer position="top-right" />
    </div>
  );
};

export default Debug; 