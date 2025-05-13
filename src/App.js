import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './components/Admin';
import Public from './components/Public';
import Login from './components/Login';
import GamePage from './components/GamePage';
import Debug from './components/Debug';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import { setupTestCodes } from './setupTestCodes';

function App() {
  useEffect(() => {
    // Initialize test codes for easier testing
    const codesAdded = setupTestCodes();
    if (codesAdded) {
      console.log('Test codes have been added for verification testing');
    }
    
    // Check if there is an import parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const importParam = urlParams.get('import');
    
    if (importParam) {
      try {
        // Decode the base64 encoded codes
        const codesData = JSON.parse(atob(importParam));
        console.log('Found codes to import:', codesData);
        
        if (Array.isArray(codesData) && codesData.length > 0) {
          // Get current codes from localStorage
          let existingCodes = [];
          try {
            const storedCodes = localStorage.getItem('mockDb_codes');
            existingCodes = storedCodes ? JSON.parse(storedCodes) : [];
          } catch (e) {
            console.error('Error loading stored codes:', e);
          }
          
          // Add the new codes, ignoring duplicates
          let added = 0;
          codesData.forEach(newCode => {
            const codeExists = existingCodes.some(c => c.code === newCode.code);
            if (!codeExists) {
              // Convert the imported code to the format needed
              const codeToAdd = {
                id: newCode.id || Math.floor(Math.random() * 100000),
                code: newCode.code,
                used: false,
                generatedAt: newCode.generatedAt || newCode.createdAt || new Date().toISOString(),
                usedAt: null
              };
              existingCodes.push(codeToAdd);
              added++;
            }
          });
          
          // Save the updated codes list
          localStorage.setItem('mockDb_codes', JSON.stringify(existingCodes));
          
          // Show success message
          if (added > 0) {
            toast.success(`Successfully imported ${added} new codes.`, {
              position: 'top-center',
              autoClose: 3000
            });
          } else {
            toast.info('No new codes were imported. You may already have these codes.', {
              position: 'top-center',
              autoClose: 3000
            });
          }
          
          // Remove the import parameter from the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error('Error importing codes:', err);
        toast.error('Failed to import codes. The link may be invalid.', {
          position: 'top-center',
          autoClose: 3000
        });
        
        // Remove the import parameter from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);
  
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Public />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/debug" element={<Debug />} />
      </Routes>
    </Router>
  );
}

export default App;
