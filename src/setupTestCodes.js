// Script to initialize test codes in localStorage
// This will add some test codes that can be used for verification

export const setupTestCodes = () => {
  try {
    // Check if we already have codes
    const storedCodes = localStorage.getItem('mockDb_codes');
    let codes = [];
    
    if (storedCodes) {
      try {
        codes = JSON.parse(storedCodes);
        
        // If we already have at least 5 codes, don't add more
        if (Array.isArray(codes) && codes.length >= 5) {
          return false;
        }
      } catch (err) {
        console.error('Error parsing stored codes:', err);
        // In case of error, reset codes
        codes = [];
      }
    }
    
    // Only continue if codes is an array
    if (!Array.isArray(codes)) {
      codes = [];
    }
    
    // Ensure we have at least 5 test codes for easy testing
    const REQUIRED_TEST_CODES = 5;
    const TEST_CODES = [
      'ABCDE', 'XYZAB', 'TEST1', 'TEST2', 'TEST3', 
      'CODE1', 'CODE2', 'CODE3', 'DEMO1', 'DEMO2'
    ];
    
    let codesAdded = 0;
    
    // Add test codes until we have at least 5
    while (codes.length < REQUIRED_TEST_CODES && codesAdded < TEST_CODES.length) {
      const testCode = TEST_CODES[codesAdded];
      
      // Check if code already exists (case insensitive)
      const exists = codes.some(c => 
        (c.code || '').toString().trim().toUpperCase() === testCode
      );
      
      if (!exists) {
        const newCode = {
          id: codes.length > 0 ? Math.max(...codes.map(c => c.id || 0)) + 1 : 1,
          code: testCode,
          used: false,
          generatedAt: new Date().toISOString(),
          usedAt: null
        };
        
        codes.push(newCode);
      }
      
      codesAdded++;
    }

    // IMPORTANT: Fix any inconsistent field names in existing codes
    codes = codes.map(code => {
      const updatedCode = {...code};
      
      // Ensure consistent field names
      if ('createdAt' in updatedCode && !('generatedAt' in updatedCode)) {
        updatedCode.generatedAt = updatedCode.createdAt;
        delete updatedCode.createdAt;
      }
      
      if (!('usedAt' in updatedCode)) {
        updatedCode.usedAt = updatedCode.used ? new Date().toISOString() : null;
      }
      
      return updatedCode;
    });
    
    // Save the updated codes back to localStorage
    localStorage.setItem('mockDb_codes', JSON.stringify(codes));
    
    return codesAdded > 0;
  } catch (err) {
    console.error('Error setting up test codes:', err);
    return false;
  }
};

// Reset all codes to unused
export const resetTestCodes = () => {
  try {
    const storedCodes = localStorage.getItem('mockDb_codes');
    if (storedCodes) {
      const codes = JSON.parse(storedCodes);
      const resetCodes = codes.map(code => ({
        ...code,
        used: false,
        usedAt: null
      }));
      localStorage.setItem('mockDb_codes', JSON.stringify(resetCodes));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error resetting codes:', err);
    return false;
  }
};

// Verify a code and mark as used
export const verifyTestCode = (codeToVerify) => {
  try {
    const storedCodes = localStorage.getItem('mockDb_codes');
    if (!storedCodes) {
      return { success: false, message: 'No codes found in storage' };
    }
    
    const codes = JSON.parse(storedCodes);
    const normalizedInput = codeToVerify.trim().toUpperCase();
    
    // Find the code (case insensitive)
    const codeIndex = codes.findIndex(c => 
      (c.code || '').toString().trim().toUpperCase() === normalizedInput
    );
    
    if (codeIndex === -1) {
      return { success: false, message: 'Invalid code' };
    }
    
    if (codes[codeIndex].used) {
      return { success: false, message: 'Code already used' };
    }
    
    // Mark as used
    codes[codeIndex].used = true;
    codes[codeIndex].usedAt = new Date().toISOString();
    
    // Save back to localStorage
    localStorage.setItem('mockDb_codes', JSON.stringify(codes));
    
    return { success: true, message: 'Code verified successfully' };
  } catch (err) {
    console.error('Error verifying code:', err);
    return { success: false, message: `Error: ${err.message}` };
  }
}; 