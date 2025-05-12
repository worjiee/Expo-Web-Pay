import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setupTestCodes, resetTestCodes, verifyTestCode } from '../setupTestCodes';

const Debug = () => {
  const [codes, setCodes] = useState([]);
  const [testCode, setTestCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  
  useEffect(() => {
    loadCodes();
  }, []);
  
  const loadCodes = () => {
    try {
      const storedCodes = localStorage.getItem('mockDb_codes');
      if (storedCodes) {
        setCodes(JSON.parse(storedCodes));
      } else {
        setCodes([]);
      }
    } catch (err) {
      console.error('Error loading codes:', err);
      setCodes([]);
    }
  };
  
  const handleInitializeTestCodes = () => {
    const added = setupTestCodes();
    if (added) {
      toast.success('Test codes initialized!');
    } else {
      toast.info('Test codes already exist');
    }
    loadCodes();
  };
  
  const handleResetCodes = () => {
    resetTestCodes();
    toast.success('All codes reset to unused');
    loadCodes();
  };
  
  const handleTestVerify = () => {
    if (!testCode.trim()) {
      toast.error('Please enter a code to verify');
      return;
    }
    
    const result = verifyTestCode(testCode.trim());
    setVerifyResult(result);
    
    if (result.success) {
      toast.success('Code verified successfully');
    } else {
      toast.error(result.message);
    }
    
    loadCodes();
  };
  
  const handleClearStorage = () => {
    localStorage.removeItem('mockDb_codes');
    toast.info('Local storage cleared');
    loadCodes();
  };
  
  return (
    <div className="container mt-5">
      <ToastContainer position="top-center" />
      
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Debug & Testing Tools</h4>
        </div>
        <div className="card-body">
          <div className="d-flex mb-4 flex-wrap gap-2">
            <button 
              onClick={handleInitializeTestCodes}
              className="btn btn-success"
            >
              Initialize Test Codes
            </button>
            
            <button 
              onClick={handleResetCodes}
              className="btn btn-warning"
            >
              Reset All Codes
            </button>
            
            <button 
              onClick={handleClearStorage}
              className="btn btn-danger"
            >
              Clear Storage
            </button>
            
            <Link to="/" className="btn btn-secondary">
              Go to Public Page
            </Link>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Test Code Verification</h5>
            </div>
            <div className="card-body">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter code to test"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleTestVerify}
                >
                  Verify
                </button>
              </div>
              
              {verifyResult && (
                <div className={`alert ${verifyResult.success ? 'alert-success' : 'alert-danger'}`}>
                  <strong>{verifyResult.success ? 'Success:' : 'Error:'}</strong> {verifyResult.message}
                </div>
              )}
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Available Codes in localStorage</h5>
            </div>
            <div className="card-body">
              {codes.length === 0 ? (
                <div className="alert alert-warning">No codes found in localStorage</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Used</th>
                        <th>Created</th>
                        <th>Used At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map(code => (
                        <tr key={code.id}>
                          <td>{code.id}</td>
                          <td>
                            <code style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                              {code.code}
                            </code>
                          </td>
                          <td>
                            <span className={`badge ${code.used ? 'bg-danger' : 'bg-success'}`}>
                              {code.used ? 'Used' : 'Available'}
                            </span>
                          </td>
                          <td>{new Date(code.createdAt).toLocaleString()}</td>
                          <td>{code.usedAt ? new Date(code.usedAt).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Debug Information</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <h6>User Agent:</h6>
            <code className="d-block p-2 bg-light">{navigator.userAgent}</code>
          </div>
          
          <div className="mb-3">
            <h6>Is Mobile:</h6>
            <code className="d-block p-2 bg-light">
              {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Yes' : 'No'}
            </code>
          </div>
          
          <div>
            <h6>localStorage Available:</h6>
            <code className="d-block p-2 bg-light">
              {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug; 