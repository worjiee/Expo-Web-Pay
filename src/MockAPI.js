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

// Helper function for error handling
const handleFirebaseError = (error, operation) => {
  console.error(`Firebase error during ${operation}:`, error);
  
  // Check for common Firebase errors
  if (error && error.code) {
    if (error.code.includes('permission-denied')) {
      console.error('Firebase permission denied. Please check Firebase security rules.');
      return 'Permission denied. Please make sure Firebase security rules allow this operation.';
    }
    
    if (error.code.includes('api-key')) {
      console.error('Firebase API key issue. Check API key configuration.');
      return 'Authentication error. Please check your Firebase API key configuration.';
    }
    
    if (error.code.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
  }
  
  return error.message || 'Unknown error occurred';
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
        const errorMessage = handleFirebaseError(error, 'code verification');
        return {
          success: false,
          message: 'Error verifying code: ' + errorMessage
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
        const errorMessage = handleFirebaseError(error, 'getting codes');
        return {
          success: false,
          message: 'Error getting codes: ' + errorMessage
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
        if (codes && codes.length > 0 && codes.some(c => c.code === standardizedCode)) {
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
        const errorMessage = handleFirebaseError(error, 'creating code');
        return {
          success: false,
          message: 'Error creating code: ' + errorMessage
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
          const exists = codes && codes.length > 0 && codes.some(c => c.code === randomCode);
          
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
        
        // Create the new code object
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
            message: 'Error saving generated code: ' + (result.error || 'Unknown error')
          };
        }
      } catch (error) {
        const errorMessage = handleFirebaseError(error, 'generating code');
        return {
          success: false,
          message: 'Error generating code: ' + errorMessage
        };
      }
    },
    
    generateMultiple: async (options) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { count = 1 } = options;
      const generatedCodes = [];
      const errors = [];
      
      try {
        // Get all existing codes first to check for duplicates
        const { data: existingCodes } = await MockAPI.codes.getAll();
        const existingCodeValues = existingCodes ? existingCodes.map(c => c.code) : [];
        
        // Generate and save codes one by one
        for (let i = 0; i < count; i++) {
          try {
            // Generate a unique code
            let randomCode;
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
              randomCode = generateRandomCode();
              
              // Check if code already exists
              const exists = existingCodeValues.includes(randomCode) || 
                             generatedCodes.some(c => c.code === randomCode);
              
              if (!exists) {
                break;
              }
              
              attempts++;
            } while (attempts < maxAttempts);
            
            if (attempts >= maxAttempts) {
              errors.push('Failed to generate a unique code after multiple attempts');
              continue;
            }
            
            // Create the new code object
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
              
              // Add to existing codes list to prevent duplicates in subsequent iterations
              existingCodeValues.push(newCode.code);
              
              // Add to result
              generatedCodes.push(newCode);
            } else {
              errors.push(`Failed to save code ${randomCode}: ${result.error || 'Unknown error'}`);
            }
          } catch (error) {
            const errorMessage = handleFirebaseError(error, `generating code ${i+1}/${count}`);
            errors.push(errorMessage);
          }
        }
        
        // Return result
        if (generatedCodes.length > 0) {
          return {
            success: true,
            data: generatedCodes,
            errors: errors.length > 0 ? errors : undefined
          };
        } else {
          return {
            success: false,
            message: 'Failed to generate any codes',
            errors
          };
        }
      } catch (error) {
        const errorMessage = handleFirebaseError(error, 'generating multiple codes');
        return {
          success: false,
          message: 'Error generating multiple codes: ' + errorMessage
        };
      }
    },
    
    delete: async (codeId) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        console.log('Deleting code with ID:', codeId);
        
        // Make sure we have a valid ID
        if (!codeId) {
          console.error('Invalid code ID provided');
          return {
            success: false,
            message: 'Invalid code ID'
          };
        }
        
        // Use Firebase to delete the code
        const result = await deleteCode(codeId);
        
        return {
          success: result.success,
          message: result.success ? 'Code deleted successfully' : (result.error || 'Failed to delete code')
        };
      } catch (error) {
        const errorMessage = handleFirebaseError(error, 'deleting code');
        return {
          success: false,
          message: 'Error deleting code: ' + errorMessage
        };
      }
    },
    
    deleteAll: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Use Firebase to delete all codes
        const result = await deleteAllCodes();
        
        return {
          success: result.success,
          message: result.success ? 'All codes deleted successfully' : (result.error || 'Failed to delete all codes')
        };
      } catch (error) {
        const errorMessage = handleFirebaseError(error, 'deleting all codes');
        return {
          success: false,
          message: 'Error deleting all codes: ' + errorMessage
        };
      }
    },
    
    update: async (codeId, updates) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      try {
        // Make sure we have valid updates
        if (!updates || typeof updates !== 'object') {
          return {
            success: false,
            message: 'Invalid updates provided'
          };
        }
        
        // Use Firebase to update the code
        const result = await updateCode(codeId, updates);
        
        return {
          success: result.success,
          message: result.success ? 'Code updated successfully' : (result.error || 'Failed to update code')
        };
      } catch (error) {
        const errorMessage = handleFirebaseError(error, 'updating code');
        return {
          success: false,
          message: 'Error updating code: ' + errorMessage
        };
      }
    }
  }
};

export default MockAPI; 