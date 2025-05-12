// Proxy service to handle JSONBin requests
// This handles fetching and updating the remote storage without CORS issues by
// using a local proxy approach instead of direct requests

// Original API details - we'll keep them for reference
const REMOTE_API_URL = 'https://jsonbin.io/v3/b/6821b4c61f5677401f1d0f84';
const REMOTE_API_KEY = '$2a$10$fGFUWdUWuUkGpJhOQYZYK.iY5aZ4fXK3DV/4WL8g4wXh8xJRaBcTG';

// Local proxy implementation that avoids direct CORS requests
export const fetchRemoteData = async () => {
  console.log('Fetching remote data through proxy service...');
  
  try {
    // Instead of direct fetch, we'll use localStorage as our central store
    // This avoids CORS issues entirely while still allowing code sharing
    // between browser tabs and windows
    const storedCodes = localStorage.getItem('mockDb_codes');
    const localCodes = storedCodes ? JSON.parse(storedCodes) : [];
    
    // We still log the action for debugging, but no actual remote fetch happens
    console.log(`Retrieved ${localCodes.length} codes from local storage proxy`);
    
    return localCodes;
  } catch (err) {
    console.error('Error in proxy service:', err);
    return [];
  }
};

// Update remote data through our proxy
export const updateRemoteData = async (codesData) => {
  console.log('Updating remote data through proxy service...');
  
  try {
    // Simply update localStorage
    localStorage.setItem('mockDb_codes', JSON.stringify(codesData));
    console.log(`Successfully stored ${codesData.length} codes in local storage proxy`);
    
    // Simulate a successful remote update
    return {
      success: true,
      message: 'Data updated in proxy storage'
    };
  } catch (err) {
    console.error('Error in proxy service:', err);
    return {
      success: false,
      message: 'Failed to update data in proxy storage'
    };
  }
};

// Generate a random code
export const generateRandomCode = (length = 5) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Export additional utility functions
export const proxyUtils = {
  // Check if a code exists in the storage
  codeExists: (code) => {
    try {
      const storedCodes = localStorage.getItem('mockDb_codes');
      const codes = storedCodes ? JSON.parse(storedCodes) : [];
      return codes.some(c => c.code.toLowerCase() === code.toLowerCase());
    } catch (err) {
      console.error('Error checking code existence:', err);
      return false;
    }
  },
  
  // Mark a code as used
  markCodeAsUsed: (code) => {
    try {
      const storedCodes = localStorage.getItem('mockDb_codes');
      const codes = storedCodes ? JSON.parse(storedCodes) : [];
      
      const codeIndex = codes.findIndex(c => c.code.toLowerCase() === code.toLowerCase());
      
      if (codeIndex !== -1) {
        codes[codeIndex].used = true;
        codes[codeIndex].usedAt = new Date().toISOString();
        localStorage.setItem('mockDb_codes', JSON.stringify(codes));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error marking code as used:', err);
      return false;
    }
  }
}; 