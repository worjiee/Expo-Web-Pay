import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import MockAPI from '../MockAPI';
import '../styles/Admin.css';

const Admin = () => {
  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [multipleCount, setMultipleCount] = useState(1);
  const [newCustomCode, setNewCustomCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetchCodes();
    
    // Listen for code updates from other tabs/windows
    const handleCodeUpdate = () => {
      fetchCodes();
    };
    
    window.addEventListener('code-update', handleCodeUpdate);
    
    return () => {
      window.removeEventListener('code-update', handleCodeUpdate);
    };
  }, []);

  const fetchCodes = async () => {
    try {
      setIsLoading(true);
      const response = await MockAPI.codes.getAll();
      setCodes(response.data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching codes:', error);
      toast.error('Failed to load codes');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      setIsGenerating(true);
      
      // Generate a random 5-letter code - using same format as setupTestCodes
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let newCode = '';
      for (let i = 0; i < 5; i++) {
        newCode += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      
      console.log(`Generated new code: ${newCode}`);
      
      // Get existing codes
      const existingCodes = await MockAPI.codes.getAll();
      
      // Add new code using EXACT same format as test codes
      const codeObject = {
        id: existingCodes.data.length > 0 ? Math.max(...existingCodes.data.map(c => c.id || 0)) + 1 : 1,
        code: newCode,
        used: false,
        generatedAt: new Date().toISOString(),
        usedAt: null
      };
      
      // Save the new code
      await MockAPI.codes.add(codeObject);
      
      toast.success('New code generated successfully!');
      fetchCodes();
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Error generating code');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMultipleCodes = async () => {
    try {
      setIsGenerating(true);
      
      for (let i = 0; i < multipleCount; i++) {
        await generateCode();
      }
      
      toast.success(`Generated ${multipleCount} codes successfully!`);
    } catch (error) {
      console.error('Error generating multiple codes:', error);
      toast.error('Error generating codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const addCustomCode = async () => {
    if (!newCustomCode.trim()) {
      toast.error('Please enter a code');
      return;
    }
    
    try {
      // Get existing codes
      const existingCodes = await MockAPI.codes.getAll();
      
      // Check if code already exists
      if (existingCodes.data.some(c => c.code.toLowerCase() === newCustomCode.toUpperCase())) {
        toast.error('This code already exists');
        return;
      }
      
      // Add new code using EXACT same format as test codes
      const codeObject = {
        id: existingCodes.data.length > 0 ? Math.max(...existingCodes.data.map(c => c.id || 0)) + 1 : 1,
        code: newCustomCode.toUpperCase(),
        used: false,
        generatedAt: new Date().toISOString(),
        usedAt: null
      };
      
      // Save the new code
      await MockAPI.codes.add(codeObject);
      
      toast.success('New code added successfully!');
      setNewCustomCode('');
      fetchCodes();
    } catch (error) {
      console.error('Error adding custom code:', error);
      toast.error('Error adding code');
    }
  };

  const deleteCode = async (id) => {
    try {
      await MockAPI.codes.deleteCode(id);
      toast.success('Code deleted successfully!');
      fetchCodes();
    } catch (error) {
      console.error('Error deleting code:', error);
      toast.error('Error deleting code');
    }
  };

  const deleteAllCodes = async () => {
    if (window.confirm('Are you sure you want to delete ALL codes? This action cannot be undone.')) {
      try {
        await MockAPI.codes.deleteAllCodes();
        toast.success('All codes deleted successfully!');
        fetchCodes();
      } catch (error) {
        console.error('Error deleting all codes:', error);
        toast.error('Error deleting codes');
      }
    }
  };

  const exportCodes = () => {
    try {
      const exportData = JSON.stringify(codes, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `codes_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Codes exported successfully!');
    } catch (error) {
      console.error('Error exporting codes:', error);
      toast.error('Error exporting codes');
    }
  };

  const forceSync = () => {
    fetchCodes();
    toast.info('Forced sync completed');
  };

  // Filter codes based on search query
  const filteredCodes = searchQuery
    ? codes.filter(code => 
        code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (code.usedAt && code.usedAt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (code.generatedAt && code.generatedAt.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : codes;

  // Stats calculations
  const totalCodes = codes.length;
  const availableCodes = codes.filter(code => !code.used).length;
  const usedCodes = codes.filter(code => code.used).length;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-user-info">
          <div className="admin-avatar">
            <span>A</span>
          </div>
          <div className="admin-welcome">
            <p>Welcome, Admin</p>
          </div>
          <button className="sync-button" onClick={forceSync}>
            <i className="fas fa-sync"></i> Force Sync
          </button>
        </div>
      </div>

      <div className="info-banner">
        <i className="fas fa-info-circle"></i>
        <span>Codes are automatically synchronized across all your devices.</span>
        <span className="firebase-badge">Firebase Sync Active</span>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h2>{totalCodes}</h2>
          <p>Total Codes</p>
        </div>
        <div className="stat-card available">
          <h2>{availableCodes}</h2>
          <p>Available Codes</p>
        </div>
        <div className="stat-card used">
          <h2>{usedCodes}</h2>
          <p>Used Codes</p>
        </div>
      </div>

      <div className="action-panels">
        <div className="panel generate-panel">
          <h3>Generate Random Codes</h3>
          <div className="generate-actions">
            <button 
              className="generate-single-btn" 
              onClick={generateCode} 
              disabled={isGenerating}
            >
              Generate Single Code
            </button>
            <div className="generate-multiple">
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={multipleCount} 
                onChange={(e) => setMultipleCount(Math.max(1, parseInt(e.target.value) || 1))} 
              />
              <button 
                className="generate-multiple-btn" 
                onClick={generateMultipleCodes} 
                disabled={isGenerating}
              >
                Generate Multiple Codes
              </button>
            </div>
          </div>
        </div>

        <div className="panel add-panel">
          <h3>Add New Code</h3>
          <div className="add-code-form">
            <input 
              type="text" 
              placeholder="Enter custom code" 
              value={newCustomCode} 
              onChange={(e) => setNewCustomCode(e.target.value)} 
            />
            <button 
              className="add-code-btn" 
              onClick={addCustomCode}
            >
              Add Code
            </button>
          </div>
          <p className="add-code-info">Added codes will work on all devices immediately.</p>
        </div>
      </div>

      <div className="code-database">
        <div className="database-header">
          <h3>Code Database</h3>
          <p className="last-updated">Last updated: {lastUpdated}</p>
          <div className="database-actions">
            <button className="export-btn" onClick={exportCodes}>
              <i className="fas fa-download"></i> Export Codes
            </button>
            <button className="delete-all-btn" onClick={deleteAllCodes}>
              <i className="fas fa-trash-alt"></i> Delete All Codes
            </button>
          </div>
        </div>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search codes..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        <div className="codes-table-container">
          <table className="codes-table">
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
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="loading-cell">Loading codes...</td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    {searchQuery ? 'No matching codes found' : 'No codes available'}
                  </td>
                </tr>
              ) : (
                filteredCodes.map(code => (
                  <tr key={code.id}>
                    <td>{code.code}</td>
                    <td>
                      <span className={`status-badge ${code.used ? 'used' : 'available'}`}>
                        {code.used ? 'Used' : 'Available'}
                      </span>
                    </td>
                    <td>{new Date(code.generatedAt).toLocaleString()}</td>
                    <td>{code.usedAt ? new Date(code.usedAt).toLocaleString() : 'Not used yet'}</td>
                    <td>
                      <button 
                        className="delete-code-btn" 
                        onClick={() => deleteCode(code.id)}
                        title="Delete Code"
                      >
                        <i className="fas fa-trash"></i>
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
  );
};

export default Admin;