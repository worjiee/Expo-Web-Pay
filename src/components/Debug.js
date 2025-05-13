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

  useEffect(() => {
    loadCodesFromStorage();
  }, []);

  const loadCodesFromStorage = () => {
    try {
      // Try to get codes from localStorage
      const rawData = localStorage.getItem('mockDb_codes');
      addToLog(`Raw localStorage data length: ${rawData ? rawData.length : 0} bytes`);
      
      if (rawData) {
        try {
          const parsedCodes = JSON.parse(rawData);
          setStoredCodes(parsedCodes || []);
          addToLog(`Loaded ${parsedCodes.length} codes from localStorage`);
          
          // Log a sample of codes
          if (parsedCodes && parsedCodes.length > 0) {
            const sampleCode = parsedCodes[0];
            addToLog(`Sample code: ${JSON.stringify(sampleCode)}`);
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
      // Create new code object
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

  return (
    <div className="container mt-5">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h2>Debug - Code Verification</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <strong>Debug Tool:</strong> This page helps diagnose code verification issues on mobile devices.
          </div>
          
          {errorMessage && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          
          <div className="row mb-4">
            <div className="col-12 col-md-6">
              <div className="card h-100">
                <div className="card-header">Test Code Verification</div>
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
                  
                  <div className="mt-3">
                    <button className="btn btn-success me-2" onClick={generateTestCode}>
                      <i className="fas fa-plus me-2"></i>
                      Generate Test Code
                    </button>
                    
                    <button className="btn btn-danger" onClick={clearAllCodes}>
                      <i className="fas fa-trash me-2"></i>
                      Clear All Codes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-md-6 mt-3 mt-md-0">
              <div className="card h-100">
                <div className="card-header">Storage Info</div>
                <div className="card-body">
                  <p><strong>Total Codes:</strong> {storedCodes.length}</p>
                  <p><strong>Used Codes:</strong> {storedCodes.filter(c => c.used).length}</p>
                  <p><strong>Available Codes:</strong> {storedCodes.filter(c => !c.used).length}</p>
                  
                  <hr />
                  
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
          
          <div className="card">
            <div className="card-header">Verification Log</div>
            <div className="card-body">
              <div 
                style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}
              >
                {verifyLog.length > 0 ? (
                  <div>
                    {verifyLog.map((log, index) => (
                      <div key={index} style={{ marginBottom: '5px' }}>{log}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted">No log entries yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Link to="/" className="btn btn-primary mb-5">
        <i className="fas fa-home me-2"></i>
        Back to Home
      </Link>
      
      <ToastContainer position="top-right" />
    </div>
  );
};

export default Debug; 