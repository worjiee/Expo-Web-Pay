// Mock API implementation for local operation without external dependencies
// This simulates the backend responses for the main functions, using only localStorage

// Import from our updated proxy service
import { 
  generateRandomCode, 
  getLocalCodes, 
  saveLocalCodes, 
  updateCodeStatus
} from './proxyService';

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Access the mock database - this ensures we always get fresh data
const getMockDb = () => {
  return {
    codes: getLocalCodes()
  };
};

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
      throw {
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
        throw {
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
      
      // Standardize code format
      const standardizedCode = code.toString().trim().toUpperCase();
      
      // Get the latest codes directly from localStorage
      const { codes } = getMockDb();
      
      // Find exact match
      const matchingCode = codes.find(
        c => c.code.toString().trim().toUpperCase() === standardizedCode
      );
      
      if (!matchingCode) {
        console.log('No matching code found');
        throw {
          success: false,
          message: 'Invalid code'
        };
      }
      
      if (matchingCode.used) {
        console.log('Code already used:', matchingCode);
        throw {
          success: false,
          message: 'This code has already been used'
        };
      }
      
      console.log('Valid code found, marking as used:', matchingCode.code);
      
      // Mark as used in local object first
      matchingCode.used = true;
      matchingCode.usedAt = new Date().toISOString();
      
      // Then update in localStorage via the proper function
      updateCodeStatus(matchingCode.code, true);
      
      console.log('Code verified successfully:', matchingCode);
      
      return {
        success: true,
        message: 'Code verified successfully'
      };
    },
    
    getAll: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get codes from mock database
      const { codes } = getMockDb();
      
      return {
        success: true,
        data: codes
      };
    },
    
    create: async (codeData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get current codes
      const { codes } = getMockDb();
      
      // Check if code already exists
      const standardizedCode = codeData.code.toString().trim().toUpperCase();
      if (codes.some(c => c.code === standardizedCode)) {
        throw {
          success: false,
          message: 'Code already exists'
        };
      }
      
      // Create new code object
      const newId = codes.length > 0 
        ? Math.max(...codes.map(c => c.id)) + 1 
        : 1;
      
      const newCode = { 
        id: newId, 
        code: standardizedCode,
        used: false,
        generatedAt: new Date().toISOString(),
        usedAt: null
      };
      
      // Mark this as a user-initiated save
      localStorage.setItem('user_initiated_save', 'true');
      
      // Add to codes list
      codes.push(newCode);
      
      // Save to localStorage
      saveLocalCodes(codes);
      
      // Clear the flag after saving
      setTimeout(() => localStorage.removeItem('user_initiated_save'), 100);
      
      return {
        success: true,
        data: newCode
      };
    },
    generate: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get current codes
      const { codes } = getMockDb();
      
      // Generate a new unique code
      let newCode;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        // Generate a random code
        const randomCode = generateRandomCode();
        
        // Check if code already exists
        const exists = codes.some(c => c.code === randomCode);
        
        if (!exists) {
          // Create new code object
          const newId = codes.length > 0 
            ? Math.max(...codes.map(c => c.id)) + 1 
            : 1;
          
          newCode = { 
            id: newId, 
            code: randomCode,
            used: false,
            generatedAt: new Date().toISOString(),
            usedAt: null
          };
          
          break;
        }
        
        attempts++;
      } while (attempts < maxAttempts);
      
      if (!newCode) {
        throw {
          success: false,
          message: 'Failed to generate a unique code after multiple attempts'
        };
      }
      
      // Mark this as a user-initiated save
      localStorage.setItem('user_initiated_save', 'true');
      
      // Add to codes list
      codes.push(newCode);
      
      // Save to localStorage
      saveLocalCodes(codes);
      
      // Clear the flag after saving
      setTimeout(() => localStorage.removeItem('user_initiated_save'), 100);
      
      // Return the new code
      return {
        success: true,
        data: newCode
      };
    },
    generateMultiple: async ({ count }) => {
      // Validate input
      if (isNaN(count) || count < 1 || count > 100) {
        throw {
          success: false,
          message: 'Invalid count. Please provide a number between 1 and 100.'
        };
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get current codes
      const { codes } = getMockDb();
      
      // Generate multiple codes
      const newCodes = [];
      const baseId = codes.length > 0 
        ? Math.max(...codes.map(c => c.id)) + 1 
        : 1;
      
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
        newCodes.push({
          id: baseId + i,
          code: uniqueCode,
          used: false,
          generatedAt: new Date().toISOString(),
          usedAt: null
        });
      }
      
      if (newCodes.length === 0) {
        throw {
          success: false,
          message: 'Failed to generate any unique codes'
        };
      }
      
      // Mark this as a user-initiated save
      localStorage.setItem('user_initiated_save', 'true');
      
      // Add all new codes to database
      codes.push(...newCodes);
      
      // Save to localStorage
      saveLocalCodes(codes);
      
      // Clear the flag after saving
      setTimeout(() => localStorage.removeItem('user_initiated_save'), 100);
      
      // Return the new codes
      return {
        success: true,
        data: newCodes
      };
    }
  }
};

export default MockAPI; 