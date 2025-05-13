import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/axios';
import { 
  getLocalCodes, 
  saveLocalCodes, 
  updateSyncTimestamp, 
  markCodeAsUsedGlobally,
  isCodeUsedGlobally,
  setupBroadcastListener,
  startPollingSync,
  stopPollingSync,
  getAllGloballyUsedCodes,
  setupFirebaseSync
} from '../proxyService';
import FirebaseSync from '../firebaseConfig';
import config from '../config';

const Public = () => {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [verificationLog, setVerificationLog] = useState([]);
  // Add state for last refresh time
  const [lastRefresh, setLastRefresh] = useState(new Date());
  // Add state to track if real-time updates are working
  const [realtimeStatus, setRealtimeStatus] = useState('initializing');
  
  // Game URL - where to redirect after successful verification
  const gameUrl = 'https://www.clyoth.top/'; // Unity WebGL game URL
  
  // Toast styling
  const successToastStyle = {
    backgroundColor: '#28a745',
    color: 'white'
  };
  
  const errorToastStyle = {
    backgroundColor: '#dc3545',
    color: 'white'
  };

  useEffect(() => {
    // Add fade-in animation when component mounts
    setFadeIn(true);
    // Clear any errors on initial load
    setError('');

    // Setup the broadcast channel listener for real-time updates
    const broadcastListenerSet = setupBroadcastListener((message) => {
      console.log('Broadcast message received in Public component:', message);
      
      // Handle different message types
      switch (message.action) {
        case 'CODE_USED_GLOBALLY':
        case 'CODE_STATUS_CHANGED':
          // Check if this affects the current input
          if (codeInput && message.data.code === codeInput.trim().toUpperCase()) {
            // Update the UI to show the code is already used
            setError(`This code has been used on another device at ${new Date(message.data.usedAt).toLocaleString()}`);
            
            // Show a toast notification
            toast.error(`The code you entered (${message.data.code}) was just used on another device!`, {
            position: 'top-center',
              autoClose: 5000
            });
          }
          break;
        case 'SYNC_TIMESTAMP_UPDATED':
          // Only show a discreet notification for background syncs
          setLastRefresh(new Date());
          break;
        case 'CODES_UPDATED':
          // Show notification for code database updates
          toast.info(`Code database has been updated on another device.`, {
            position: 'top-right',
            autoClose: 3000
          });
          setLastRefresh(new Date());
          break;
        case 'FIREBASE_SYNC':
          // Firebase sync updates
          if (message.data.type === 'usage_update') {
            toast.info('Received code usage update from another device', {
              position: 'top-right',
              autoClose: 3000
            });
          }
          setLastRefresh(new Date());
          setRealtimeStatus('connected');
          break;
        default:
          // For any other updates, just refresh the timestamp
          setLastRefresh(new Date());
      }
    });
    
    // Setup Firebase for cross-device sync - always enable automatically
    const initFirebase = async () => {
      // Always initialize Firebase automatically
      console.log('Auto-enabling Firebase sync...');
      
      const firebaseInitialized = await setupFirebaseSync((message) => {
        console.log('Firebase sync message in Public component:', message);
        
        // Set status to connected
        setRealtimeStatus('connected');
        
        // Handle Firebase sync events
        if (message.action === 'FIREBASE_SYNC') {
          // Update local timestamp
          setLastRefresh(new Date());
          
          // If current input matches a used code, update error state
          if (codeInput) {
            const isUsed = isCodeUsedGlobally(codeInput);
            if (isUsed) {
              setError(`This code has been used on another device`);
            }
          }
        }
      });
      
      setRealtimeStatus(firebaseInitialized ? 'connected' : broadcastListenerSet ? 'limited' : 'offline');
    };
    
    // Initialize Firebase sync
    initFirebase();
    
    // Start polling for sync across devices (every 1 second for more real-time updates)
    startPollingSync(() => {
      console.log('Public component - polling refresh triggered');
      setLastRefresh(new Date());
      
      // Check if current input code has been used elsewhere
      if (codeInput) {
        const isUsed = isCodeUsedGlobally(codeInput);
        if (isUsed) {
          setError(`This code has been used on another device`);
        }
      }
    }, 1000); // Poll every second instead of 2 seconds

    // Cleanup function to remove listeners when component unmounts
    return () => {
      // Stop polling when component unmounts
      stopPollingSync();
    };
  }, [codeInput]);

  // Function to check Firebase directly for the most up-to-date status
  const checkCodeInFirebase = async (code) => {
    try {
      // Normalize code to ensure consistency
      const normalizedCode = code.toString().trim().toUpperCase();
      
      // Import Firebase functions
      const { initializeApp } = await import('firebase/app');
      const { getDatabase, ref, get, child } = await import('firebase/database');
      
      // Firebase configuration (same as in other files)
      const firebaseConfig = {
        apiKey: "AIzaSyDltP_6QMX-9h5X7Z8Q7xSW1X5M4iV8sHo",
        authDomain: "codesync-demo.firebaseapp.com",
        projectId: "codesync-demo",
        storageBucket: "codesync-demo.appspot.com",
        messagingSenderId: "432019689101",
        appId: "1:432019689101:web:7d8cfe0c1a77d15b4c6f83",
        databaseURL: "https://codesync-demo-default-rtdb.firebaseio.com"
      };
      
      console.log('Checking code using Firebase URL:', firebaseConfig.databaseURL);
      
      // Initialize Firebase if needed
      let app;
      try {
        app = initializeApp(firebaseConfig);
      } catch (err) {
        // Already initialized, ignore
        console.log('Firebase already initialized in checkCodeInFirebase');
      }
      
      // Get database reference
      const database = getDatabase();
      const dbRef = ref(database);
      
      // First check Firebase for the code in master_usage
      console.log(`Checking code ${normalizedCode} directly in Firebase master_usage`);
      
      try {
        // Use a timeout promise with a longer timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase check timed out')), config.FIREBASE_TIMEOUT || 15000) // Use config value
        );
        
        const fetchPromise = get(child(dbRef, `master_usage/${normalizedCode}`));
        
        // Race between the fetch and the timeout
        const snapshot = await Promise.race([fetchPromise, timeoutPromise])
          .catch(err => {
            console.error('Firebase master_usage check failed or timed out:', err);
            throw err;
          });
          
        if (snapshot && snapshot.exists()) {
          const data = snapshot.val();
          console.log(`Firebase check result for ${normalizedCode}:`, data);
          
          // If used, return the usage data
          if (data && data.used === true) {
            return data;
          }
        } else if (snapshot) { // snapshot exists but data doesn't
          console.log(`Code ${normalizedCode} not found in Firebase master_usage`);
        }
      } catch (masterUsageError) {
        console.warn('Error checking master_usage, falling back to codes collection:', masterUsageError);
      }
      
      // Also check in the codes collection as fallback
      try {
        console.log('Falling back to codes collection check');
        const codesSnapshot = await get(child(dbRef, 'codes/codes'))
          .catch(err => {
            console.warn('Fallback Firebase codes check failed:', err);
            return null;
          });
          
        if (codesSnapshot && codesSnapshot.exists()) {
          const codesData = codesSnapshot.val();
          
          if (Array.isArray(codesData)) {
            const matchingCode = codesData.find(c => 
              c && c.code && c.code.toString().trim().toUpperCase() === normalizedCode && c.used
            );
            
            if (matchingCode) {
              console.log(`Code ${normalizedCode} found as used in Firebase codes collection`);
              return { used: true, usedAt: matchingCode.usedAt || new Date().toISOString() };
            }
          }
        }
      } catch (fallbackErr) {
        console.warn('Error in fallback Firebase check:', fallbackErr);
      }
      
      // Not used or not found
      return null;
    } catch (err) {
      console.error('Error checking Firebase for code:', err);
      // Return null instead of throwing to allow fallback to local storage
      return null;
    }
  };

  // Simple verification function focused on localStorage but also checking Firebase
  const verifyCodeInLocalStorage = async (codeToVerify) => {
    // First, normalize the code
    const normalizedCode = codeToVerify.toString().trim().toUpperCase();
    console.log(`Checking code "${normalizedCode}"`);
    
    try {
      // Add this code to skip Firebase checks during development to prevent timeouts
      let isUsedInFirebase = null;
      
      try {
        // Try to check Firebase directly first for the most reliable status
        console.log('Checking Firebase for the most up-to-date status...');
        isUsedInFirebase = await checkCodeInFirebase(normalizedCode);
      } catch (firebaseError) {
        console.warn('Firebase check failed, continuing with local check:', firebaseError);
      }
      
      if (isUsedInFirebase) {
        console.log(`Code ${normalizedCode} is marked as used in Firebase`);
        // Update local storage to match Firebase status for future reference
        try {
          const allCodes = getLocalCodes();
          const codeToUpdate = allCodes.find(c => c.code.toUpperCase().trim() === normalizedCode);
          if (codeToUpdate && !codeToUpdate.used) {
            codeToUpdate.used = true;
            codeToUpdate.usedAt = isUsedInFirebase.usedAt || new Date().toISOString();
            saveLocalCodes(allCodes);
            console.log('Updated local code to match Firebase status');
          }
        } catch (localUpdateErr) {
          console.error('Error updating local code status:', localUpdateErr);
        }
        
        return { 
          success: false, 
          reason: 'already-used-globally',
          usedAt: isUsedInFirebase.usedAt || new Date().toISOString()
        };
      }
      
      // Continue with local checks if not used in Firebase
      // Get all codes from localStorage
      const allCodes = getLocalCodes();
      console.log(`Checking code "${normalizedCode}" against ${allCodes.length} codes in localStorage`);
      
      if (!allCodes || allCodes.length === 0) {
        return { success: false, reason: 'no-codes' };
      }
      
      // Local check for global usage (backup check)
      if (isCodeUsedGlobally(normalizedCode)) {
        console.log(`Code ${normalizedCode} is already used globally (localStorage)`);
        
        // Get the usage details for better user feedback
        const globalUsageData = getAllGloballyUsedCodes();
        let usedAtTime = null;
        
        if (globalUsageData && globalUsageData[normalizedCode]) {
          usedAtTime = globalUsageData[normalizedCode].usedAt;
        }
        
        return { 
          success: false, 
          reason: 'already-used-globally',
          usedAt: usedAtTime
        };
      }
      
      // Look for the matching code (case insensitive)
      const matchingCode = allCodes.find(c => 
        c.code.toUpperCase().trim() === normalizedCode && 
        !c.used
      );
              
      // Check if the code exists but has been used
      const usedMatchingCode = allCodes.find(c => 
        c.code.toUpperCase().trim() === normalizedCode && 
        c.used
      );
              
      if (matchingCode) {
        console.log('Found valid unused code - marking as used:', matchingCode.code);
        
        // Mark the code as used
        matchingCode.used = true;
        matchingCode.usedAt = new Date().toISOString();
        
        try {
          // Save back to localStorage immediately
          localStorage.setItem('mockDb_codes', JSON.stringify(allCodes));
          console.log('Successfully updated localStorage with used code status');
          
          // Double-check: Also use the saveLocalCodes utility function as a backup
          saveLocalCodes(allCodes);
          
          // CRITICAL: Update the sync timestamp to trigger updates on other devices
          updateSyncTimestamp();
          console.log('Updated sync timestamp to trigger refresh on other devices');
          
          // CRITICAL: Mark the code as used globally
          markCodeAsUsedGlobally(matchingCode.code);
          console.log('Marked code as used globally for cross-device sync');
          
          // Update status display
          setRealtimeStatus('connected');
          
          // Force immediate Firebase sync
          try {
            await import('../firebaseConfig').then(module => {
              if (module && module.syncCodesNow) {
                console.log('Triggering immediate Firebase sync');
                module.syncCodesNow();
              }
            });
          } catch (syncErr) {
            console.error('Error during immediate Firebase sync:', syncErr);
          }
        } catch (err) {
          console.error('Error saving code status to localStorage:', err);
        }
        
        return { success: true, code: matchingCode };
      } else if (usedMatchingCode) {
        return { success: false, reason: 'already-used', code: usedMatchingCode };
      } else {
        return { success: false, reason: 'invalid-code' };
      }
    } catch (err) {
      console.error('Error in verification process:', err);
      return { success: false, reason: 'verification-error', error: err.message };
    }
  };

  // Redirect to game after successful verification
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = gameUrl;
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, gameUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setVerifying(true);
    setError('');
    setSuccess(false);
    
    // Get the trimmed code
    const codeToVerify = codeInput.trim();
    
    // Add to verification log
    const timestamp = new Date();
    setVerificationLog(prev => [
      {
        id: prev.length + 1,
        code: codeToVerify,
        timestamp: timestamp.toISOString(),
        result: 'pending'
      },
      ...prev
    ]);
    
    try {
      // Validate input
      if (!codeToVerify) {
        throw new Error('Please enter a code');
      }
      
      console.log('Verifying code:', codeToVerify);
      
      // Use our enhanced verification function that checks Firebase
      const result = await verifyCodeInLocalStorage(codeToVerify);
      
      if (result.success) {
        // Code is valid and has been marked as used
        console.log('Code verified successfully:', result.code);
        setVerificationLog(prev => 
          prev.map(log => 
            log.code === codeToVerify 
              ? { ...log, result: 'success', method: 'verification' } 
              : log
          )
        );
        setSuccess(true);
        setShowConfetti(true);
        
        // Show success toast
        toast.success(`Code "${codeToVerify}" verified successfully! Redirecting to game...`, {
          position: 'top-center',
          autoClose: 3000
        });
      } else {
        // Code verification failed
        console.log('Code verification failed:', result.reason);
        
        let errorMessage;
        switch (result.reason) {
          case 'already-used':
            errorMessage = `This code has already been used${result.code?.usedAt ? ` at ${new Date(result.code.usedAt).toLocaleString()}` : ''}`;
            break;
          case 'already-used-globally':
            errorMessage = `This code has already been used${result.usedAt ? ` at ${new Date(result.usedAt).toLocaleString()}` : ''}`;
            break;
          case 'no-codes':
            errorMessage = 'No codes found in the system. Please contact support.';
            break;
          case 'verification-error':
            errorMessage = `Error during verification: ${result.error || 'Unknown error'}`;
            break;
          case 'invalid-code':
          default:
            errorMessage = 'Invalid code. Please check and try again.';
        }
        
        setVerificationLog(prev => 
          prev.map(log => 
            log.code === codeToVerify 
              ? { ...log, result: 'error', reason: result.reason } 
            : log
          )
        );
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'An error occurred while verifying your code');
      
      // Show error toast
      toast.error(err.message || 'Verification failed', {
        position: 'top-center',
        autoClose: 5000
      });
    } finally {
      setVerifying(false);
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
      overflow: 'auto', // Ensure scrolling works properly on mobile
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker overlay for better readability on mobile
        zIndex: 1,
        overflow: 'auto', // Enable scrolling on this layer
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Navigation Bar with animation */}
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
                className="text-white text-decoration-none d-flex align-items-center"
                style={{ fontSize: '1rem' }}
              >
                <i className="fas fa-lock me-2"></i>
                <span className="d-none d-sm-inline">Admin Portal</span>
              </Link>
            </div>
          </div>
        </header>
        
        <div className={`container mt-4 mt-md-5 px-3 px-sm-auto ${fadeIn ? 'fadeIn' : ''}`} style={{ 
          animation: 'fadeIn 1s ease-in-out',
          position: 'relative',
          zIndex: 2,
          marginBottom: '30px' // Add bottom margin to ensure there's space at the bottom on mobile
        }}>
          <ToastContainer 
            position="top-center"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="card" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden'
              }}>
                <div className="card-header text-center" style={{
                  background: 'linear-gradient(135deg, #2980b9 0%, #2ecc71 100%)',
                  borderBottom: 'none'
                }}>
                  <h2 className="mb-0" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Game Access</h2>
                </div>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <img 
                      src="/logo_game.png" 
                      alt="Game Logo" 
                      style={{ 
                        width: 'min(150px, 40vw)', // Responsive width 
                        height: 'min(150px, 40vw)', // Responsive height
                        marginBottom: '20px', 
                        animation: 'pulse 2s infinite',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #3a7bd5'
                      }}
                    />
                    <h1 className="text-center mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                      <i className="fas fa-unlock-alt me-2"></i>
                      Enter Access Code
                    </h1>
                    <p className="text-muted">Please enter your access code to play the game</p>
                    
                    {/* Add status indicator for real-time updates */}
                    <div className="d-flex justify-content-center align-items-center mb-2">
                      <span className="badge bg-secondary me-2 d-flex align-items-center">
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          marginRight: '5px',
                          backgroundColor: realtimeStatus === 'connected' ? '#28a745' : 
                                           realtimeStatus === 'limited' ? '#ffc107' : '#dc3545'
                        }}></div>
                        Real-time updates {realtimeStatus === 'connected' ? 'active' : 
                                         realtimeStatus === 'limited' ? 'limited' : 'inactive'}
                      </span>
                      <small className="text-muted">
                        Last refreshed: {lastRefresh.toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                  
                  {error && <div className="alert alert-danger">{error}</div>}
                  
                  {success ? (
                    <div className="text-center verification-success">
                      <div className="checkmark-circle mb-4">
                        <i className="fas fa-check-circle" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', color: '#5cb85c' }}></i>
                      </div>
                      <h4 className="mt-2 mb-3" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)' }}>Code verified successfully!</h4>
                      <p>
                        <i className="fas fa-gamepad me-2"></i>
                        Redirecting to game...
                      </p>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">
                        If you are not redirected automatically, 
                        <a href={gameUrl} className="btn btn-link">
                          <i className="fas fa-external-link-alt me-1"></i>
                          click here
                        </a>.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <div className="form-floating">
                          <input
                            type="text"
                            className="form-control"
                            id="code"
                            value={codeInput}
                            onChange={(e) => {
                              setCodeInput(e.target.value.toUpperCase());
                              setError(''); // Clear error when user starts typing
                            }}
                            placeholder="Enter your code"
                            required
                            disabled={verifying}
                            style={{ 
                              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                              letterSpacing: '2px',
                              height: 'auto',
                              padding: '1.25rem 0.75rem 0.625rem 0.75rem'
                            }}
                          />
                          <label htmlFor="code" style={{ padding: '0.75rem 0.75rem' }}>
                            <i className="fas fa-key me-2"></i>
                            Access Code
                          </label>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-primary w-100 py-3" // Taller button for better touch targets
                        disabled={verifying}
                        style={{
                          background: 'linear-gradient(135deg, #2980b9 0%, #2ecc71 100%)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                          fontSize: 'clamp(0.9rem, 3vw, 1rem)'
                        }}
                      >
                        {verifying ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-unlock-alt me-2"></i>
                            Unlock Game Access
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Navigation Bar */}
        <footer className="footer py-4" style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          zIndex: 10,
          backgroundColor: 'rgba(0, 12, 36, 0.85)',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
          width: '100%',
          marginTop: 'auto',
          animation: 'fadeIn 0.5s ease-in-out'
        }}>
          <div className="container">
            <div className="d-flex flex-column flex-md-row justify-content-center align-items-center">
              <div className="text-white text-center mb-2 mb-md-0 me-md-4" style={{
                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                opacity: '0.9'
              }}>
                <span>© 2025 End of The Road - Creating immersive pixel adventures</span>
              </div>
              <div className="d-flex">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white mx-2" style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                  opacity: '0.8',
                  transition: 'opacity 0.2s',
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} 
                   onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-white mx-2" style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                  opacity: '0.8',
                  transition: 'opacity 0.2s',
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} 
                   onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                  <i className="fab fa-discord"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white mx-2" style={{
                  fontSize: 'clamp(1.1rem, 4vw, 1.3rem)',
                  opacity: '0.8',
                  transition: 'opacity 0.2s',
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} 
                   onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </footer>
        
        {/* CSS Animations */}
        <style jsx="true">{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Public; 