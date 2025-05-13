import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { verifyCode } from '../firebaseConfig'; // Import Firebase verification function
import config from '../config';

const Public = () => {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  
  const gameUrl = config.gameUrl || '#';
  
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
  }, []);

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
    
    try {
      // Validate input
      if (!codeToVerify) {
        throw new Error('Please enter a code');
      }
      
      console.log('Verifying code with Firebase:', codeToVerify);
      
      // Use Firebase to verify the code
      const result = await verifyCode(codeToVerify);
      console.log('Firebase verification result:', result);
      
      if (result.success) {
        // Code verified successfully
        setSuccess(true);
        
        // Show success toast
        toast.success(`Code verified successfully! Redirecting to game...`, {
          position: 'top-center',
          autoClose: 3000
        });
      } else {
        // Code verification failed
        throw new Error(result.message || 'Invalid code. Please check and try again.');
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

  // Handle code input change
  const handleCodeChange = (e) => {
    setCodeInput(e.target.value);
    // Clear any errors as the user types
    if (error) setError('');
  };

  return (
    <div className={`public-page-container ${fadeIn ? 'fade-in' : ''}`}>
      <div className="game-access-container">
        <h1>Game Access</h1>
        
        <div className="game-logo">
          <img src="/game-logo.png" alt="Game Logo" className="game-logo-img" />
        </div>
        
        <div className="access-form-container">
          <h2>
            <i className="fas fa-lock"></i> Enter Access Code
          </h2>
          
          <p className="access-instructions">
            Please enter your access code to play the game
          </p>
          
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          
          {success ? (
            <div className="success-message">
              <i className="fas fa-check-circle"></i> Code verified! Redirecting to game...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="code-input-group">
                <input
                  type="text"
                  value={codeInput}
                  onChange={handleCodeChange}
                  placeholder="Enter your code"
                  disabled={verifying}
                  className="code-input"
                  autoComplete="off"
                  autoFocus
                />
                
                <button
                  type="submit"
                  disabled={verifying || !codeInput.trim()}
                  className="submit-btn"
                >
                  {verifying ? (
                    <span>
                      <i className="fas fa-spinner fa-spin"></i> Verifying
                    </span>
                  ) : (
                    <span>
                      <i className="fas fa-unlock"></i> Unlock Game Access
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
};

export default Public; 