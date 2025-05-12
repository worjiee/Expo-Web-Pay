// Proxy service to handle code sharing without any external API dependencies
// This avoids CORS issues completely by using device-to-device direct code sharing

// Generate a random code following the pattern of 5 uppercase letters
export const generateRandomCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// Function to get current codes from localStorage
export const getLocalCodes = () => {
  try {
    const storedCodes = localStorage.getItem('mockDb_codes');
    
    // Log storage info for debugging purposes
    console.log(`localStorage read - Raw data length: ${storedCodes ? storedCodes.length : 0} bytes`);
    
    if (!storedCodes) {
      console.log('No codes found in localStorage');
      return [];
    }
    
    // Parse the JSON data and standardize all codes (ensure uppercase)
    const parsedCodes = JSON.parse(storedCodes);
    
    // Log the number of codes found
    console.log(`Retrieved ${parsedCodes.length} codes from localStorage`);
    
    // Important: Standardize all codes to ensure consistency across devices
    // This fixes issues with case sensitivity on different platforms
    if (Array.isArray(parsedCodes)) {
      return parsedCodes.map(code => ({
        ...code,
        code: code.code.toString().trim().toUpperCase()
      }));
    }
    
    return [];
  } catch (err) {
    console.error('Error getting codes from localStorage:', err);
    return [];
  }
};

// Function to save codes to localStorage
export const saveLocalCodes = (codes) => {
  try {
    // Ensure all codes are standardized before saving
    const standardizedCodes = Array.isArray(codes) ? codes.map(code => ({
      ...code,
      code: code.code.toString().trim().toUpperCase()
    })) : [];
    
    // Save to localStorage
    localStorage.setItem('mockDb_codes', JSON.stringify(standardizedCodes));
    
    // Log storage info for debugging purposes
    console.log(`Saved ${standardizedCodes.length} codes to localStorage`);
    
    return true;
  } catch (err) {
    console.error('Error saving codes to localStorage:', err);
    return false;
  }
};

// Function to add a code to localStorage
export const addCodeToLocalStorage = (newCode) => {
  try {
    const codes = getLocalCodes();
    
    // Ensure the new code is standardized
    const standardizedCode = {
      ...newCode,
      code: newCode.code.toString().trim().toUpperCase()
    };
    
    // Check if code already exists (case insensitive)
    if (!codes.some(c => c.code === standardizedCode.code)) {
      codes.push(standardizedCode);
      saveLocalCodes(codes);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error adding code to localStorage:', err);
    return false;
  }
};

// Function to update a code's status in localStorage
export const updateCodeStatus = (code, used) => {
  try {
    const codes = getLocalCodes();
    
    // Standardize the input code
    const standardizedCode = code.toString().trim().toUpperCase();
    
    // Find the code object using strict case-insensitive comparison
    const codeObj = codes.find(c => c.code === standardizedCode);
    
    if (codeObj) {
      codeObj.used = used;
      codeObj.usedAt = used ? new Date().toISOString() : null;
      saveLocalCodes(codes);
      return true;
    }
    
    console.log(`Code not found for status update: ${standardizedCode}`);
    return false;
  } catch (err) {
    console.error('Error updating code status in localStorage:', err);
    return false;
  }
};

// Function to export codes as text for sharing
export const exportCodesAsText = (codesArray) => {
  try {
    // Create a simplified version of codes for sharing
    const simplifiedCodes = codesArray.map(code => ({
      code: code.code,
      used: code.used || false,
      usedAt: code.usedAt || null
    }));
    
    // Convert to base64 for easy sharing
    return btoa(JSON.stringify(simplifiedCodes));
  } catch (err) {
    console.error('Error exporting codes:', err);
    return null;
  }
};

// Function to import codes from text
export const importCodesFromText = (encodedText) => {
  try {
    // Decode from base64
    const decodedText = atob(encodedText);
    const importedCodes = JSON.parse(decodedText);
    
    // Validate the structure
    if (!Array.isArray(importedCodes)) {
      throw new Error('Invalid code format');
    }
    
    // Get existing codes
    const existingCodes = getLocalCodes();
    let newCodesAdded = 0;
    
    // Merge the codes
    importedCodes.forEach(importedCode => {
      // Check if the code structure is valid
      if (importedCode.code && typeof importedCode.code === 'string') {
        // Check if this code already exists
        const exists = existingCodes.some(
          c => c.code.toUpperCase() === importedCode.code.toUpperCase()
        );
        
        if (!exists) {
          // Add the code with needed properties
          existingCodes.push({
            id: existingCodes.length > 0 
              ? Math.max(...existingCodes.map(c => c.id)) + 1 
              : 1,
            code: importedCode.code.toUpperCase(),
            used: importedCode.used || false,
            usedAt: importedCode.usedAt || null,
            generatedAt: importedCode.generatedAt || new Date().toISOString()
          });
          newCodesAdded++;
        }
      }
    });
    
    // Save the merged codes
    saveLocalCodes(existingCodes);
    
    return {
      success: true,
      totalImported: importedCodes.length,
      newCodesAdded
    };
  } catch (err) {
    console.error('Error importing codes:', err);
    return { success: false, error: err.message };
  }
};

// Utility functions for the proxy service
export const proxyUtils = {
  getCurrentTimestamp: () => new Date().toISOString(),
  formatCode: (code) => code.toUpperCase().trim(),
  validateCode: (code) => /^[A-Z]{5}$/.test(code)
};

// Function to fetch remote data (mockup function that just returns local data)
export const fetchRemoteData = async () => {
  console.log('Fetching remote data through proxy service...');
  
  try {
    // Simply return the local data - no remote calls needed
    return getLocalCodes();
  } catch (error) {
    console.error('Error in fetchRemoteData:', error);
    return [];
  }
};

// Function to update remote data (mockup function that just updates local data)
export const updateRemoteData = async (codes) => {
  console.log('Updating remote data through proxy service...');
  
  try {
    // Simply save to local storage - no remote calls needed
    return saveLocalCodes(codes);
  } catch (error) {
    console.error('Error in updateRemoteData:', error);
    return false;
  }
}; 