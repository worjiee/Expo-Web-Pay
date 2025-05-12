import axios from 'axios';
import config from '../config';
import { initServer } from '../remoteServer';

// Import the mock API as a fallback
import MockAPI from '../MockAPI';

console.log('Creating axios instance with baseURL:', config.API_URL);

// Flag to track if we should use mock API due to connection issues
// Set to true by default for better mobile compatibility
let useMockAPI = true; // Always use mock API by default
let connectionIssuesDetected = false;
let useBackupAPI = false;

// Initialize the remote server for local storage sync
initServer();

// Create primary axios instance
const primaryApi = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  timeout: config.CODE_VERIFICATION_TIMEOUT // Use configured timeout
});

// Create backup axios instance
const backupApi = axios.create({
  baseURL: config.BACKUP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  timeout: config.CODE_VERIFICATION_TIMEOUT // Use configured timeout
});

// Function to get the appropriate real API instance
const getRealApi = () => {
  return useBackupAPI ? backupApi : primaryApi;
};

// Add a request interceptor for authentication to both instances
[primaryApi, backupApi].forEach(api => {
  api.interceptors.request.use(
    (config) => {
      console.log('Making request to:', config.url, 'using', useBackupAPI ? 'backup API' : 'primary API');
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
  api.interceptors.response.use(
    (response) => {
      console.log('Response received:', response.status, 'from', useBackupAPI ? 'backup API' : 'primary API');
      // If we get a successful response, reset the mock API flag
      useMockAPI = !config.FORCE_REAL_API && false;
      
      // If we're using the backup API and it worked, we might want to try the primary again later
      if (useBackupAPI) {
        console.log('Backup API worked. Will try primary API again later.');
        // After a successful backup API call, schedule a check to try primary again
        setTimeout(() => {
          useBackupAPI = false;
          console.log('Switched back to primary API for future requests');
        }, 60000); // Try primary API again after 1 minute
      }
      
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
        console.warn('Connection issues detected with', useBackupAPI ? 'backup API' : 'primary API');
        // Always set connection issues detected regardless of FORCE_REAL_API
        connectionIssuesDetected = true;
        // Only use mock API if not forcing real API
        useMockAPI = !config.FORCE_REAL_API && true;
        
        // If this is the primary API failing, we should try the backup next
        if (!useBackupAPI) {
          console.log('Will try backup API for next request');
          useBackupAPI = true;
        }
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
});

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

// Helper function to determine if fallback to mock is allowed
const shouldAllowMockFallback = (endpoint) => {
  // For login requests, check if admin fallback is enabled
  if (endpoint === '/auth/login') {
    return config.ALLOW_ADMIN_FALLBACK;
  }
  
  // For admin pages, check if admin fallback is enabled
  if (window.location.pathname.includes('/admin')) {
    return config.ALLOW_ADMIN_FALLBACK;
  }
  
  // For code verification, check if public fallback is enabled
  if (endpoint === '/codes/verify') {
    return config.ALLOW_PUBLIC_FALLBACK;
  }
  
  // Default to not forcing real API
  return !config.FORCE_REAL_API;
};

// Hybrid API that tries real API first, then falls back to mock if needed
const api = {
  post: async (endpoint, data) => {
    // For code verification requests, try both APIs before giving up
    if (endpoint === '/codes/verify') {
      console.log('Handling code verification with resilient approach');
      
      // Try primary API
      try {
        console.log('Trying primary API for code verification');
        const response = await primaryApi.post(endpoint, data);
        console.log('Primary API code verification succeeded');
        return response;
      } catch (primaryErr) {
        console.error('Primary API code verification failed:', primaryErr);
        
        // Try backup API
        try {
          console.log('Trying backup API for code verification');
          const response = await backupApi.post(endpoint, data);
          console.log('Backup API code verification succeeded');
          // Set useBackupAPI to true for future requests
          useBackupAPI = true;
          return response;
        } catch (backupErr) {
          console.error('Backup API code verification failed:', backupErr);
          
          // If mock fallback is allowed for public, use it
          if (config.ALLOW_PUBLIC_FALLBACK) {
            console.log('Falling back to mock implementation for code verification');
            return mockApi.post(endpoint, data);
          }
          
          // Otherwise, rethrow the backup error
          throw backupErr;
        }
      }
    }
    
    // For login requests, always try both methods if needed
    if (endpoint === '/auth/login') {
      try {
        console.log('Trying real API login');
        return await getRealApi().post(endpoint, data);
      } catch (err) {
        console.log('Real API login failed');
        // Allow fallback to mock for login when admin fallback is enabled
        if (shouldAllowMockFallback(endpoint) && !err.response) {
          console.log('Network error during login, falling back to mock login');
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
      return await getRealApi().post(endpoint, data);
    } catch (err) {
      // Fall back to mock for admin paths or when not forcing real API
      if (shouldAllowMockFallback(endpoint) && !err.response && connectionIssuesDetected) {
        console.warn(`Connection error, falling back to mock implementation for ${endpoint}`);
        return mockApi.post(endpoint, data);
      }
      throw err;
    }
  },
  
  get: async (endpoint) => {
    // Special handling for getting codes in admin
    if (endpoint === '/codes' && window.location.pathname.includes('/admin')) {
      console.log('Getting codes for admin dashboard');
      try {
        return await getRealApi().get(endpoint);
      } catch (err) {
        console.error('Real API get codes failed:', err);
        // Allow fallback for admin UI to show codes when admin fallback is enabled
        if (config.ALLOW_ADMIN_FALLBACK && !err.response) {
          console.log('Falling back to mock implementation for admin UI');
          return mockApi.get(endpoint);
        }
        throw err;
      }
    }
    
    if (useMockAPI && !config.FORCE_REAL_API) {
      return mockApi.get(endpoint);
    }
    
    try {
      return await getRealApi().get(endpoint);
    } catch (err) {
      // Fall back to mock with appropriate permissions
      if (shouldAllowMockFallback(endpoint) && !err.response && connectionIssuesDetected) {
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
      return await getRealApi().delete(endpoint);
    } catch (err) {
      // Fall back to mock with appropriate permissions
      if (shouldAllowMockFallback(endpoint) && !err.response && connectionIssuesDetected) {
        console.warn(`Connection error, falling back to mock implementation for ${endpoint}`);
        return mockApi.delete(endpoint);
      }
      throw err;
    }
  }
};

// Expose the interceptors for compatibility
api.interceptors = primaryApi.interceptors;

// Initialize the server connection immediately
initServer();

export default api; 