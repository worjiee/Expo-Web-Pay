import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Game = ({ onLivesEnded }) => {
  const iframeRef = useRef(null);
  
  // Function to send messages to the Unity game
  const sendMessageToUnity = (functionName, parameter) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UnityMessage',
        functionName,
        parameter
      }, '*');
    }
  };
  
  // Listen for messages from the Unity game
  useEffect(() => {
    const handleMessage = (event) => {
      // Check if the message is from Unity
      if (event.data && event.data.type === 'UnityEvent') {
        // If the player has run out of lives
        if (event.data.eventName === 'LivesEnded') {
          onLivesEnded();
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onLivesEnded]);

  return (
    <div className="text-center mt-5">
      <iframe
        ref={iframeRef}
        src="https://www.clyoth.top/"
        width="800"
        height="600"
        title="WebGL Game"
        style={{ border: 'none' }}
        allowFullScreen
      />
    </div>
  );
};

const GamePage = () => {
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gameLocked, setGameLocked] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await api.post('/codes/verify', { code });
      setVerified(true);
      setSuccess(true);
      toast.success('Code verified successfully!');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Invalid code');
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleLivesEnded = () => {
    setGameLocked(true);
    toast.error('You have run out of lives! Enter an unlock code to continue.');
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/codes/verify', { code: unlockCode });
      setGameLocked(false);
      setUnlockCode('');
      toast.success('Game unlocked successfully!');
    } catch (err) {
      console.error('Unlock error:', err);
      setError(err.response?.data?.message || 'Invalid unlock code');
      toast.error(err.response?.data?.message || 'Invalid unlock code');
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    if (gameLocked) {
      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title text-center mb-4">Game Locked</h2>
                  <p className="text-center">You have run out of lives. Enter an unlock code to continue playing.</p>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <form onSubmit={handleUnlock}>
                    <div className="mb-3">
                      <label htmlFor="unlockCode" className="form-label">Enter Unlock Code</label>
                      <input
                        type="text"
                        className="form-control"
                        id="unlockCode"
                        value={unlockCode}
                        onChange={e => setUnlockCode(e.target.value.toUpperCase())}
                        placeholder="Enter your unlock code"
                        required
                        disabled={loading}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                      {loading ? 'Unlocking...' : 'Unlock Game'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return <Game onLivesEnded={handleLivesEnded} />;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Enter Code to Play</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="code" className="form-label">Enter Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="code"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter your code"
                    required
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Play'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage; 