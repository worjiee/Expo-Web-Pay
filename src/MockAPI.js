// Mock API implementation that now uses Firebase for database operations
// while maintaining the same API interface for backward compatibility

// Import Firebase functions
import firebaseService, {
  getAllCodes,
  saveCode,
  updateCode,
  deleteCode,
  deleteAllCodes,
  verifyCode
} from './firebaseConfig';

// Import from our proxy service for backward compatibility
import { generateRandomCode } from './proxyService';

// Admin credentials - consider moving these to Firebase Authentication in the future
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Mock API functions
const MockAPI = {
  // Authentication endpoints
  auth: {
    login: async (credentials) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { username, password } = credentials;
      
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate mock JWT token - not a real JWT, just for simulation
        const token = `ey${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
        
        // Store in localStorage for persistent login
        localStorage.setItem('auth_token', token);
        
        return {
          success: true,
          token,
          message: 'Login successful'
        };
      }
      
      // Authentication failed
      return {
        success: false,
        message: 'Invalid credentials'
      };
    },
    logout: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove auth token
      localStorage.removeItem('auth_token');
      
      return {
        success: true,
        message: 'Logout successful'
      };
    },
    validateToken: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if token exists in localStorage
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return {
          success: false,
          message: 'Invalid or expired token'
        };
      }
      
      return {
        success: true,
        message: 'Token is valid'
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
      
      try {
        // Use Firebase to verify the code
        const result = await verifyCode(code);
        console.log('Verification result:', result);
        
        return result;
      } catch (error) {
        console.error('Error verifying code:', error);
        return {
          success: false,
          message: 'Error verifying code: ' + error.message
        };
      }
    },
    
    getAll: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Use Firebase to get all codes
        const codes = await getAllCodes();
        
        return {
          success: true,
          data: codes
        };
      } catch (error) {
        console.error('Error getting codes:', error);
        return {
          success: false,
          message: 'Error getting codes: ' + error.message
        };
      }
    },
    
    create: async (codeData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Get current codes to check for duplicates
        const { data: codes } = await MockAPI.codes.getAll();
        
        // Check if code already exists
        const standardizedCode = codeData.code.toString().trim().toUpperCase();
        if (codes.some(c => c.code === standardizedCode)) {
          return {
            success: false,
            message: 'Code already exists'
          };
        }
        
        // Create new code object
        const newCode = { 
          code: standardizedCode,
          used: false,
          generatedAt: new Date().toISOString(),
          usedAt: null
        };
        
        // Save to Firebase
        const result = await saveCode(newCode);
        
        if (result.success) {
          // Add the ID to the new code
          newCode.id = result.id;
          
          return {
            success: true,
            data: newCode
          };
        } else {
          return {
            success: false,
            message: 'Error saving code: ' + (result.error || 'Unknown error')
          };
        }
      } catch (error) {
        console.error('Error creating code:', error);
        return {
          success: false,
          message: 'Error creating code: ' + error.message
        };
      }
    },
    
    generate: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Get current codes to check for duplicates
        const { data: codes } = await MockAPI.codes.getAll();
        
        // Generate a new unique code
        let randomCode;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
          // Generate a random code
          randomCode = generateRandomCode();
          
          // Check if code already exists
          const exists = codes.some(c => c.code === randomCode);
          
          if (!exists) {
            break;
          }
          
          attempts++;
        } while (attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
          return {
            success: false,
            message: 'Failed to generate a unique code after multiple attempts'
          };
        }
        
        // Create new code object
        const newCode = { 
          code: randomCode,
          used: false,
          generatedAt: new Date().toISOString(),
          usedAt: null
        };
        
        // Save to Firebase
        const result = await saveCode(newCode);
        
        if (result.success) {
          // Add the ID to the new code
          newCode.id = result.id;
          
          return {
            success: true,
            data: newCode
          };
        } else {
          return {
            success: false,
            message: 'Error saving code: ' + (result.error || 'Unknown error')
          };
        }
      } catch (error) {
        console.error('Error generating code:', error);
        return {
          success: false,
          message: 'Error generating code: ' + error.message
        };
      }
    },
    
    generateMultiple: async ({ count }) => {
      // Validate input
      if (isNaN(count) || count < 1 || count > 100) {
        return {
          success: false,
          message: 'Invalid count. Please provide a number between 1 and 100.'
        };
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Get current codes to check for duplicates
        const { data: codes } = await MockAPI.codes.getAll();
        
        // Generate multiple codes
        const newCodes = [];
        
        for (let i = 0; i < count; i++) {
          let uniqueCode;
          let attempts = 0;
          const maxAttempts = 10;
          
          // Try to generate a unique code
          do {
            const randomCode = generateRandomCode();
            
            // Check if code already exists in DB or in newly generated codes
            const existsInDB = codes.some(c => c.code === randomCode);
            const existsInNew = newCodes.some(c => c.code === randomCode);
            
            if (!existsInDB && !existsInNew) {
              uniqueCode = randomCode;
              break;
            }
            
            attempts++;
          } while (attempts < maxAttempts);
          
          if (!uniqueCode) {
            continue; // Skip if we couldn't generate a unique code after max attempts
          }
          
          // Create the new code object
          const newCode = {
            code: uniqueCode,
            used: false,
            generatedAt: new Date().toISOString(),
            usedAt: null
          };
          
          // Save to Firebase
          const result = await saveCode(newCode);
          
          if (result.success) {
            // Add the ID to the new code
            newCode.id = result.id;
            newCodes.push(newCode);
          }
        }
        
        if (newCodes.length === 0) {
          return {
            success: false,
            message: 'Failed to generate any unique codes'
          };
        }
        
        return {
          success: true,
          data: newCodes
        };
      } catch (error) {
        console.error('Error generating multiple codes:', error);
        return {
          success: false,
          message: 'Error generating codes: ' + error.message
        };
      }
    },
    
    delete: async ({ code }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Get all codes to find the ID
        const { data: codes } = await MockAPI.codes.getAll();
        
        // Find the code by its value
        const codeObj = codes.find(c => c.code === code);
        
        if (!codeObj) {
          return {
            success: false,
            message: 'Code not found'
          };
        }
        
        // Delete from Firebase using the ID
        const result = await deleteCode(codeObj.id);
        
        return {
          success: result.success,
          message: result.success ? 'Code deleted successfully' : 'Error deleting code'
        };
      } catch (error) {
        console.error('Error deleting code:', error);
        return {
          success: false,
          message: 'Error deleting code: ' + error.message
        };
      }
    },
    
    deleteAll: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Delete all codes from Firebase
        const result = await deleteAllCodes();
        
        return {
          success: result.success,
          message: result.success ? 'All codes deleted successfully' : 'Error deleting all codes'
        };
      } catch (error) {
        console.error('Error deleting all codes:', error);
        return {
          success: false,
          message: 'Error deleting all codes: ' + error.message
        };
      }
    }
  }
};

export default MockAPI; 