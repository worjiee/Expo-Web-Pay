import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as api from '../proxyService';
// Import the Firebase verification function
import { verifyCode } from '../firebaseConfig';
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
  const commonToastStyle = {
    borderRadius: '10px',
    fontFamily: 'sans-serif',
    fontWeight: '500',
    padding: '15px 20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  };
  
  const successToastStyle = {
    ...commonToastStyle,
    backgroundColor: '#e7f7e8',
    color: '#256b2c'
  };
  
  const errorToastStyle = {
    ...commonToastStyle,
    backgroundColor: '#ffe8e8',
    color: '#cf2e2e'
  };

  useEffect(() => {
    // Add fade-in animation when component mounts
    setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    // Clear any errors on initial load
    setError('');

    // Setup the broadcast channel listener for real-time updates
    const broadcastListenerSet = api.setupBroadcastListener((message) => {
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
        default:
          // For any other updates, just refresh the timestamp
          setLastRefresh(new Date());
      }
    });
    
    // Set realtime status based on broadcast channel availability
    setRealtimeStatus(broadcastListenerSet ? 'limited' : 'offline');
    
    // Start polling for sync across devices (every 1 second for more real-time updates)
    api.startPollingSync(() => {
      console.log('Public component - polling refresh triggered');
      setLastRefresh(new Date());
      
      // Check if current input code has been used elsewhere
      if (codeInput) {
        const isUsed = api.isCodeUsedGlobally(codeInput);
        if (isUsed) {
          setError(`This code has been used on another device`);
        }
      }
    }, 1000); // Poll every second

    // Cleanup function to remove listeners when component unmounts
    return () => {
      // Stop polling when component unmounts
      api.stopPollingSync();
    };
  }, [codeInput]);

  // Verify code in localStorage (for backward compatibility)
  const verifyCodeInLocalStorage = async (codeToVerify) => {
    // First, normalize the code
    const normalizedCode = codeToVerify.toString().trim().toUpperCase();
    console.log(`Checking code "${normalizedCode}"`);
    
    try {
      // Use Firebase verification instead of localStorage
      console.log('Using Firebase for verification:', normalizedCode);
      const firebaseResult = await verifyCode(normalizedCode);
      
      if (firebaseResult.success) {
        return { success: true, code: { code: normalizedCode } };
      } else {
        console.log('Firebase verification failed:', firebaseResult.message);
        return { success: false, reason: 'invalid-code', message: firebaseResult.message };
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
      
      // Use our verification function
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
            errorMessage = result.message || 'Invalid code. Please check and try again.';
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