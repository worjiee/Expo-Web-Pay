// Mock API implementation for local operation without external dependencies
// This simulates the backend responses for the main functions, using only localStorage

// Import from our updated proxy service
import { 
  generateRandomCode, 
  getLocalCodes, 
  saveLocalCodes, 
  updateCodeStatus,
  exportCodesAsText,
  importCodesFromText
} from './proxyService';

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Create or get our mock database 
const initMockDb = () => {
  // Always initialize from localStorage to ensure we're always up-to-date
  const storedCodes = localStorage.getItem('mockDb_codes');
  return {
    codes: storedCodes ? JSON.parse(storedCodes) : []
  };
};

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
      // Simulate network delay - shorter for mobile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { code } = codeData;
      console.log('Verifying code:', code);
      
      // ENHANCED: More robust standardization of code format
      const standardizedCode = code.toString().trim().toUpperCase();
      console.log('Standardized code for verification:', standardizedCode);
      
      // Get the latest codes directly from localStorage
      const { codes } = getMockDb();
      console.log('Found codes for verification:', codes.length);
      
      // ENHANCED: Log sample codes for debugging
      if (codes.length > 0) {
        console.log('Sample codes:');
        codes.slice(0, Math.min(3, codes.length)).forEach((c, i) => {
          console.log(`Code ${i}: ${c.code} (Used: ${c.used ? 'Yes' : 'No'})`);
        });
      }
      
      // ENHANCED: Find exact match with more robust case handling
      const matchingCode = codes.find(
        c => c.code.toString().trim().toUpperCase() === standardizedCode
      );
      
      if (!matchingCode) {
        console.log('No matching code found');
        // Try to find similar codes to provide better error messages
        const similarCodes = codes
          .filter(c => 
            c.code.toUpperCase().includes(standardizedCode) || 
            standardizedCode.includes(c.code.toUpperCase())
          )
          .map(c => c.code);
          
        if (similarCodes.length > 0) {
          console.log('Similar codes found:', similarCodes);
          throw {
            success: false,
            message: `Invalid code. Did you mean ${similarCodes[0]}?`
          };
        }
        
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
      
      // ENHANCED: More reliable status update
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get codes from mock database
      const { codes } = getMockDb();
      
      return {
        success: true,
        data: codes
      };
    },
    
    generate: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a random 5-letter code
      const randomCode = generateRandomCode();
      
      // Get current codes from mock database
      const { codes } = getMockDb();
      
      // Add to mock database
      const newId = codes.length > 0 
        ? Math.max(...codes.map(c => c.id)) + 1 
        : 1;
      
      const newCode = { 
        id: newId, 
        code: randomCode,
        used: false,
        generatedAt: new Date().toISOString(),
        usedAt: null
      };
      
      // Add to mock database
      codes.push(newCode);
      
      // Save to localStorage
      saveLocalCodes(codes);
      
      return {
        success: true,
        data: newCode
      };
    },
    
    updateStatus: async (codeData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { code, used } = codeData;
      
      // Update code status
      const success = updateCodeStatus(code, used);
      
      if (!success) {
        throw {
          success: false,
          message: 'Code not found'
        };
      }
      
      return {
        success: true,
        message: `Code ${used ? 'marked as used' : 'unmarked as used'}`
      };
    },
    
    delete: async (codeData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { code } = codeData;
      
      // Get codes from mock database
      const { codes } = getMockDb();
      
      // Find the code
      const codeIndex = codes.findIndex(c => c.code === code);
      
      if (codeIndex === -1) {
        throw {
          success: false,
          message: 'Code not found'
        };
      }
      
      // Remove the code
      codes.splice(codeIndex, 1);
      
      // Save to localStorage
      saveLocalCodes(codes);
      
      return {
        success: true,
        message: 'Code deleted'
      };
    },
    
    deleteAll: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Clear all codes
      saveLocalCodes([]);
      
      return {
        success: true,
        message: 'All codes deleted'
      };
    },
    
    generateMultiple: async (countData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { count } = countData;
      const codeCount = parseInt(count, 10);
      
      if (isNaN(codeCount) || codeCount < 1 || codeCount > 100) {
        throw {
          success: false,
          message: 'Invalid count. Please provide a number between 1 and 100'
        };
      }
      
      // Get existing codes
      const { codes } = getMockDb();
      
      // Start with the highest existing ID
      let nextId = codes.length > 0 
        ? Math.max(...codes.map(c => c.id)) + 1 
        : 1;
      
      const newCodes = [];
      
      // Generate multiple codes
      for (let i = 0; i < codeCount; i++) {
        let randomCode;
        let attempts = 0;
        
        // Ensure uniqueness
        do {
          randomCode = generateRandomCode();
          attempts++;
          
          // Prevent infinite loops
          if (attempts > 100) {
            throw {
              success: false,
              message: 'Failed to generate unique codes'
            };
          }
        } while (codes.some(c => c.code === randomCode) || 
                newCodes.some(c => c.code === randomCode));
        
        const newCode = {
          id: nextId++,
          code: randomCode,
          used: false,
          generatedAt: new Date().toISOString(),
          usedAt: null
        };
        
        newCodes.push(newCode);
        codes.push(newCode);
      }
      
      // Save to localStorage
      saveLocalCodes(codes);
      
      return {
        success: true,
        data: newCodes,
        message: `Generated ${newCodes.length} new codes`
      };
    },
    
    exportCodes: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get codes from mock database
      const { codes } = getMockDb();
      
      // Get only unused codes
      const unusedCodes = codes.filter(code => !code.used);
      
      if (unusedCodes.length === 0) {
        throw {
          success: false,
          message: 'No unused codes to export'
        };
      }
      
      // Export codes as text
      const exportedData = exportCodesAsText(unusedCodes);
      
      if (!exportedData) {
        throw {
          success: false,
          message: 'Failed to export codes'
        };
      }
      
      return {
        success: true,
        data: exportedData,
        count: unusedCodes.length
      };
    },
    
    importCodes: async (importData) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { importText } = importData;
      
      if (!importText || importText.trim() === '') {
        throw {
          success: false,
          message: 'No import data provided'
        };
      }
      
      // Import codes from text
      const result = importCodesFromText(importText.trim());
      
      if (!result.success) {
        throw {
          success: false,
          message: `Import failed: ${result.error}`
        };
      }
      
      return {
        success: true,
        totalImported: result.totalImported,
        newCodesAdded: result.newCodesAdded,
        message: `Imported ${result.newCodesAdded} new codes out of ${result.totalImported} total`
      };
    }
  }
};

// Initialize the mock database on load
initMockDb();

export default MockAPI; 