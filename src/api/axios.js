import axios from 'axios';
import config from '../config';

// Import the mock API as a fallback
import MockAPI from './MockAPI';

console.log('Creating axios instance with baseURL:', config.API_URL);

// Flag to track if we should use mock API due to connection issues
let useMockAPI = false;
let connectionIssuesDetected = false;

// Create real axios instance
const realApi = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  timeout: 8000 // 8 second timeout
});

// Add a request interceptor for authentication
realApi.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
realApi.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    // If we get a successful response, reset the mock API flag
    useMockAPI = false;
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // If this is a connection error, set the flag to use mock API
    if (!error.response) {
      console.warn('Connection issues detected. Will use mock API for future requests.');
      useMockAPI = true;
      connectionIssuesDetected = true;
    }
    
    if (error.response) {
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Create the mock API implementation
const mockApi = {
  post: async (endpoint, data) => {
    console.log(`Using MOCK API for POST ${endpoint}`);
    // Handle different endpoints
    if (endpoint === '/auth/login') {
      return MockAPI.auth.login(data);
    } else if (endpoint === '/codes/verify') {
      return MockAPI.codes.verify(data);
    } else if (endpoint === '/codes/generate') {
      return MockAPI.codes.generate();
    } else if (endpoint === '/codes/create-custom') {
      const randomId = Math.floor(Math.random() * 10000);
      const newCode = { id: randomId, code: data.code, used: false };
      return { data: { code: newCode, message: 'Custom code created successfully' } };
    }
    return { data: { message: 'Operation completed' } };
  },
  
  get: async (endpoint) => {
    console.log(`Using MOCK API for GET ${endpoint}`);
    if (endpoint === '/codes') {
      return MockAPI.codes.getAll();
    } else if (endpoint === '/api/status') {
      return { data: { status: 'API is operational (MOCK)', timestamp: new Date() } };
    }
    return { data: [] };
  },
  
  delete: async (endpoint) => {
    console.log(`Using MOCK API for DELETE ${endpoint}`);
    if (endpoint.startsWith('/codes/')) {
      const id = parseInt(endpoint.replace('/codes/', ''));
      return MockAPI.codes.deleteCode(id);
    } else if (endpoint === '/codes/delete-all') {
      return { data: { message: 'All codes deleted successfully' } };
    }
    return { data: { message: 'Operation completed' } };
  }
};

// Hybrid API that tries real API first, then falls back to mock if needed
const api = {
  post: async (endpoint, data) => {
    if (useMockAPI) {
      return mockApi.post(endpoint, data);
    }
    
    try {
      return await realApi.post(endpoint, data);
    } catch (err) {
      // If we get a connection error, try using the mock API
      if (!err.response && connectionIssuesDetected) {
        console.warn(`Connection error, falling back to mock implementation for ${endpoint}`);
        return mockApi.post(endpoint, data);
      }
      throw err;
    }
  },
  
  get: async (endpoint) => {
    if (useMockAPI) {
      return mockApi.get(endpoint);
    }
    
    try {
      return await realApi.get(endpoint);
    } catch (err) {
      // If we get a connection error, try using the mock API
      if (!err.response && connectionIssuesDetected) {
        console.warn(`Connection error, falling back to mock implementation for ${endpoint}`);
        return mockApi.get(endpoint);
      }
      throw err;
    }
  },
  
  delete: async (endpoint) => {
    if (useMockAPI) {
      return mockApi.delete(endpoint);
    }
    
    try {
      return await realApi.delete(endpoint);
    } catch (err) {
      // If we get a connection error, try using the mock API
      if (!err.response && connectionIssuesDetected) {
        console.warn(`Connection error, falling back to mock implementation for ${endpoint}`);
        return mockApi.delete(endpoint);
      }
      throw err;
    }
  }
};

// Expose the interceptors for compatibility
api.interceptors = realApi.interceptors;

export default api; 