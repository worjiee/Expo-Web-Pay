import axios from 'axios';
import config from '../config';

// Import the mock API as a fallback
import MockAPI from '../MockAPI';

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
  timeout: 10000 // 10 second timeout to allow for slower connections
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
    useMockAPI = !config.FORCE_REAL_API && false;
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.warn('Authentication error detected. User may need to log in again.');
      
      // If not on login page, clear token
      if (window.location.pathname !== '/login') {
        console.log('Clearing token due to auth error');
        localStorage.removeItem('token');
        
        // Redirect to login if not already there
        window.location.href = '/login';
      }
    }
    
    // If this is a connection error, set the flag to use mock API
    if (!error.response) {
      console.warn('Connection issues detected. Will use mock API for future requests.');
      // Only use mock API if we're not forcing real API
      useMockAPI = !config.FORCE_REAL_API && true;
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
      try {
        const response = await MockAPI.auth.login(data);
        console.log('Mock login response:', response);
        return response;
      } catch (err) {
        console.error('Mock login error:', err);
        throw err;
      }
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
    // For login requests, always try both methods if needed
    if (endpoint === '/auth/login') {
      try {
        console.log('Trying real API login first');
        return await realApi.post(endpoint, data);
      } catch (err) {
        console.log('Real API login failed, trying mock API');
        if (!config.FORCE_REAL_API) {
          console.log('Falling back to mock login');
          return mockApi.post(endpoint, data);
        }
        throw err;
      }
    }
    
    // For other requests, follow standard fallback logic
    if (useMockAPI && !config.FORCE_REAL_API) {
      return mockApi.post(endpoint, data);
    }
    
    try {
      return await realApi.post(endpoint, data);
    } catch (err) {
      // Only fall back to mock if not forcing real API
      if (!config.FORCE_REAL_API && !err.response && connectionIssuesDetected) {
        console.warn(`Connection error, falling back to mock implementation for ${endpoint}`);
        return mockApi.post(endpoint, data);
      }
      throw err;
    }
  },
  
  get: async (endpoint) => {
    if (useMockAPI && !config.FORCE_REAL_API) {
      return mockApi.get(endpoint);
    }
    
    try {
      return await realApi.get(endpoint);
    } catch (err) {
      // Only fall back to mock if not forcing real API
      if (!config.FORCE_REAL_API && !err.response && connectionIssuesDetected) {
        console.warn(`Connection error, falling back to mock implementation for ${endpoint}`);
        return mockApi.get(endpoint);
      }
      throw err;
    }
  },
  
  delete: async (endpoint) => {
    if (useMockAPI && !config.FORCE_REAL_API) {
      return mockApi.delete(endpoint);
    }
    
    try {
      return await realApi.delete(endpoint);
    } catch (err) {
      // Only fall back to mock if not forcing real API
      if (!config.FORCE_REAL_API && !err.response && connectionIssuesDetected) {
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