// Setup test codes for easier testing - this ensures there are always some codes available
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
    
    // Save the updated codes back to localStorage
    localStorage.setItem('mockDb_codes', JSON.stringify(codes));
    
    return codesAdded > 0;
  } catch (err) {
    console.error('Error setting up test codes:', err);
    return false;
  }
}; 