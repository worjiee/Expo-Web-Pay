import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = () => {
  const [codes, setCodes] = useState([]);
  const [count, setCount] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/codes', {
        headers: { 'x-auth-token': token }
      });
      setCodes(res.data);
    } catch (err) {
      setError('Error fetching codes');
    }
  };

  const generateCode = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/codes/generate', {}, {
        headers: { 'x-auth-token': token }
      });
      fetchCodes();
    } catch (err) {
      setError('Error generating code');
    }
  };

  const generateMultipleCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/codes/generate-multiple', { count }, {
        headers: { 'x-auth-token': token }
      });
      fetchCodes();
    } catch (err) {
      setError('Error generating codes');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Admin Dashboard</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="row mb-4">
        <div className="col">
          <button className="btn btn-primary me-2" onClick={generateCode}>
            Generate Single Code
          </button>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <input
              type="number"
              className="form-control"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              min="1"
              max="100"
            />
            <button className="btn btn-success" onClick={generateMultipleCodes}>
              Generate Multiple Codes
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Generated At</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code._id}>
                <td>{code.code}</td>
                <td>
                  <span className={`badge ${code.isUsed ? 'bg-danger' : 'bg-success'}`}>
                    {code.isUsed ? 'Used' : 'Available'}
                  </span>
                </td>
                <td>{new Date(code.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin; 