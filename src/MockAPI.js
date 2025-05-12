// Mock API implementation to bypass CORS issues
// This simulates the backend responses for the main functions

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Mock database
const mockDb = {
  users: [
    { 
      id: 1, 
      username: ADMIN_USERNAME, 
      password: ADMIN_PASSWORD, 
      role: 'admin'
    }
  ],
  codes: [
    { id: 1, code: 'FREE2023', used: false },
    { id: 2, code: 'GAMEPASS', used: false },
    { id: 3, code: 'WELCOME', used: true }
  ]
};

// Helper to generate JWT-like tokens (simplified)
const generateToken = (userData) => {
  // This is just a placeholder, not a real JWT
  return btoa(JSON.stringify({ 
    id: userData.id, 
    username: userData.username, 
    role: userData.role,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours expiry
  }));
};

// Mock API functions
const MockAPI = {
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { username, password } = credentials;
      
      // Check if user exists and password matches
      const user = mockDb.users.find(u => u.username === username);
      
      if (!user || user.password !== password) {
        throw {
          response: {
            status: 401,
            data: { message: 'Invalid credentials' }
          }
        };
      }
      
      // Return success response with token
      return {
        data: {
          token: generateToken(user),
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          },
          message: 'Login successful'
        }
      };
    }
  },
  
  // Codes endpoints
  codes: {
    verify: async (codeData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { code } = codeData;
      
      // Check if code exists and is not used
      const codeRecord = mockDb.codes.find(c => c.code === code);
      
      if (!codeRecord) {
        throw {
          response: {
            status: 404,
            data: { message: 'Invalid code' }
          }
        };
      }
      
      if (codeRecord.used) {
        throw {
          response: {
            status: 400,
            data: { message: 'Code already used' }
          }
        };
      }
      
      // Mark code as used
      codeRecord.used = true;
      
      // Return success response
      return {
        data: {
          message: 'Code verified successfully'
        }
      };
    },
    
    getAll: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return all codes
      return {
        data: mockDb.codes
      };
    },
    
    generate: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate a random code
      const randomCode = `CODE${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Add to mock database
      const newCode = { 
        id: mockDb.codes.length + 1, 
        code: randomCode, 
        used: false 
      };
      
      mockDb.codes.push(newCode);
      
      // Return success response
      return {
        data: {
          code: newCode,
          message: 'Code generated successfully'
        }
      };
    },
    
    deleteCode: async (id) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Find code index
      const index = mockDb.codes.findIndex(c => c.id === id);
      
      if (index === -1) {
        throw {
          response: {
            status: 404,
            data: { message: 'Code not found' }
          }
        };
      }
      
      // Remove from mock database
      mockDb.codes.splice(index, 1);
      
      // Return success response
      return {
        data: {
          message: 'Code deleted successfully'
        }
      };
    }
  }
};

export default MockAPI; 