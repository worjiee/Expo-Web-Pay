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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { code } = codeData;
      console.log('Verifying code:', code);
      console.log('Available codes:', mockDb.codes);
      
      // Check if code exists and is not used - do a case-insensitive check
      const codeRecord = mockDb.codes.find(c => 
        c.code.toLowerCase() === code.toLowerCase()
      );
      
      console.log('Found code record:', codeRecord);
      
      if (!codeRecord) {
        console.error('Invalid code provided:', code);
        throw {
          response: {
            status: 404,
            data: { message: 'Invalid code' }
          }
        };
      }
      
      if (codeRecord.used) {
        console.error('Code already used:', code);
        throw {
          response: {
            status: 400,
            data: { message: 'Code already used' }
          }
        };
      }
      
      // Mark code as used
      codeRecord.used = true;
      codeRecord.usedAt = new Date().toISOString();
      console.log('Code marked as used:', codeRecord);
      
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a random 5-letter code
      // This creates a random 5-letter uppercase code
      const generateRandomLetters = (length) => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };
      
      const randomCode = generateRandomLetters(5);
      
      // Add to mock database
      const newId = mockDb.codes.length > 0 
        ? Math.max(...mockDb.codes.map(c => c.id)) + 1 
        : 1;
         
      const newCode = { 
        id: newId, 
        code: randomCode, 
        used: false,
        createdAt: new Date().toISOString()
      };
      
      mockDb.codes.push(newCode);
      console.log('Generated new 5-letter code:', newCode);
      console.log('Updated codes list:', mockDb.codes);
      
      // Return success response with the code in the expected format
      return {
        data: {
          code: newCode,
          message: 'Code generated successfully'
        }
      };
    },
    
    addCustomCode: async (newCode) => {
      // Add the new code to the mock database
      mockDb.codes.push(newCode);
      console.log('Added custom code to mock database:', newCode);
      console.log('Updated codes:', mockDb.codes);
      return newCode;
    },
    
    deleteAllCodes: async () => {
      // Clear the codes array
      mockDb.codes = [];
      console.log('All codes deleted from mock database');
      
      // Return success response
      return {
        data: {
          message: 'All codes deleted successfully'
        }
      };
    },
    
    deleteCode: async (id) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Deleting code with ID:', id, 'Type:', typeof id);
      
      // Handle invalid ID
      if (isNaN(id) || id === undefined) {
        console.error('Invalid ID provided for deletion:', id);
        throw {
          response: {
            status: 400,
            data: { message: 'Invalid code ID format' }
          }
        };
      }
      
      // Find code index
      const index = mockDb.codes.findIndex(c => c.id === id);
      console.log('Found code at index:', index, 'All codes:', mockDb.codes);
      
      if (index === -1) {
        console.error('Code not found with ID:', id);
        throw {
          response: {
            status: 404,
            data: { message: 'Code not found' }
          }
        };
      }
      
      // Remove from mock database
      const deletedCode = mockDb.codes[index];
      mockDb.codes.splice(index, 1);
      console.log('Deleted code with ID:', id, 'Code details:', deletedCode);
      console.log('Updated codes list:', mockDb.codes);
      
      // Return success response
      return {
        data: {
          message: 'Code deleted successfully',
          code: deletedCode
        }
      };
    }
  }
};

export default MockAPI; 