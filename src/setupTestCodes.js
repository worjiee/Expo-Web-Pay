// Script to initialize test codes in localStorage
// This will add some test codes that can be used for verification

export function setupTestCodes() {
  // Check if test codes already exist
  const existingCodes = localStorage.getItem('mockDb_codes');
  
  if (!existingCodes) {
    console.log('Initializing test codes...');
    
    // Create sample test codes
    const testCodes = [
      {
        id: 1,
        code: 'TEST1',
        used: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        code: 'TEST2',
        used: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        code: 'MOBILE',
        used: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        code: 'PHONE',
        used: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        code: 'ABCDE',
        used: false,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Store the test codes in localStorage
    localStorage.setItem('mockDb_codes', JSON.stringify(testCodes));
    console.log('Test codes initialized:', testCodes);
    return true;
  } else {
    console.log('Test codes already exist, skipping initialization');
    return false;
  }
}

// Make a function to clear used status on codes for testing
export function resetTestCodes() {
  try {
    const existingCodes = localStorage.getItem('mockDb_codes');
    if (existingCodes) {
      const codes = JSON.parse(existingCodes);
      // Reset all codes to unused
      const resetCodes = codes.map(code => ({
        ...code,
        used: false,
        usedAt: undefined
      }));
      
      localStorage.setItem('mockDb_codes', JSON.stringify(resetCodes));
      console.log('All test codes reset to unused');
      return true;
    }
  } catch (err) {
    console.error('Error resetting test codes:', err);
  }
  return false;
}

// Add a helper function to directly verify a code from the mock DB
export function verifyTestCode(codeToCheck) {
  try {
    const existingCodes = localStorage.getItem('mockDb_codes');
    if (existingCodes) {
      const codes = JSON.parse(existingCodes);
      
      // Find the matching code (case insensitive)
      const matchingCode = codes.find(c => 
        c.code.toLowerCase() === codeToCheck.toLowerCase() && !c.used
      );
      
      if (matchingCode) {
        // Mark as used
        matchingCode.used = true;
        matchingCode.usedAt = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('mockDb_codes', JSON.stringify(codes));
        
        return {
          success: true,
          message: 'Code verified successfully'
        };
      } else {
        // Check if code exists but was used
        const usedCode = codes.find(c => 
          c.code.toLowerCase() === codeToCheck.toLowerCase() && c.used
        );
        
        if (usedCode) {
          return {
            success: false,
            message: 'Code already used'
          };
        }
        
        return {
          success: false,
          message: 'Invalid code'
        };
      }
    }
  } catch (err) {
    console.error('Error verifying test code:', err);
  }
  
  return {
    success: false,
    message: 'Error processing code'
  };
} 