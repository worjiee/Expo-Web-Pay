import React, { useState } from 'react';
import axios from 'axios';

const Public = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/codes/verify', { code });
      setMessage(res.data.message);
      setError('');
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying code');
      setMessage('');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Verify Code</h2>
              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="code" className="form-label">Enter Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter your code"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Verify Code
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Public; 