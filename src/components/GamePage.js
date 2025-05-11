import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Game = () => (
  <div className="text-center mt-5">
    <iframe
      src="https://www.clyoth.top/"
      width="800"
      height="600"
      title="WebGL Game"
      style={{ border: 'none' }}
      allowFullScreen
    />
  </div>
);

const GamePage = () => {
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  if (verified) {
    return <Game />;
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