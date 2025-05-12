import MockAPI from '../MockAPI';

// Create a mock API client that simulates axios
const api = {
  post: async (endpoint, data) => {
    console.log(`Making POST request to: ${endpoint}`, data);
    
    // Handle different endpoints
    if (endpoint === '/auth/login') {
      return MockAPI.auth.login(data);
    } else if (endpoint === '/codes/verify') {
      return MockAPI.codes.verify(data);
    } else if (endpoint === '/codes/generate') {
      return MockAPI.codes.generate();
    } else if (endpoint === '/codes/create-custom') {
      // Handle custom code creation
      const randomId = Math.floor(Math.random() * 10000);
      const newCode = { id: randomId, code: data.code, used: false };
      return { data: { code: newCode, message: 'Custom code created successfully' } };
    }
    
    // Default response for unhandled endpoints
    console.warn(`Unhandled POST endpoint: ${endpoint}`);
    return { data: { message: 'Operation completed' } };
  },
  
  get: async (endpoint) => {
    console.log(`Making GET request to: ${endpoint}`);
    
    // Handle different endpoints
    if (endpoint === '/codes') {
      return MockAPI.codes.getAll();
    } else if (endpoint === '/api/status') {
      return { data: { status: 'API is operational', timestamp: new Date() } };
    }
    
    // Default response for unhandled endpoints
    console.warn(`Unhandled GET endpoint: ${endpoint}`);
    return { data: [] };
  },
  
  delete: async (endpoint) => {
    console.log(`Making DELETE request to: ${endpoint}`);
    
    // Handle deletion of specific code
    if (endpoint.startsWith('/codes/')) {
      const id = parseInt(endpoint.replace('/codes/', ''));
      return MockAPI.codes.deleteCode(id);
    } else if (endpoint === '/codes/delete-all') {
      // Mock deleting all codes
      return { data: { message: 'All codes deleted successfully' } };
    }
    
    // Default response for unhandled endpoints
    console.warn(`Unhandled DELETE endpoint: ${endpoint}`);
    return { data: { message: 'Operation completed' } };
  }
};

// Simulate request interceptor for consistency with original API
api.interceptors = {
  request: {
    use: (successFn) => {
      // We don't need to do anything here since we're not making real HTTP requests
      console.log('Request interceptor registered');
    }
  },
  response: {
    use: (successFn, errorFn) => {
      // We don't need to do anything here since we're not making real HTTP requests
      console.log('Response interceptor registered');
    }
  }
};

console.log('Using mock API client (no real HTTP requests will be made)');

export default api; 