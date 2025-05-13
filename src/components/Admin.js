const generateCode = async () => {
  try {
    setIsGenerating(true);
    
    // Generate a random 5-letter code - using same format as setupTestCodes
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let newCode = '';
    for (let i = 0; i < 5; i++) {
      newCode += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    console.log(`Generated new code: ${newCode}`);
    
    // Get existing codes
    const existingCodes = await MockAPI.codes.getAll();
    
    // Add new code using EXACT same format as test codes
    const codeObject = {
      id: existingCodes.length > 0 ? Math.max(...existingCodes.map(c => c.id || 0)) + 1 : 1,
      code: newCode,
      used: false,
      generatedAt: new Date().toISOString(),
      usedAt: null
    };
    
    // Save the new code
    await MockAPI.codes.add(codeObject);
    
    toast.success('New code generated successfully!');
    fetchCodes();
  } catch (error) {
    console.error('Error generating code:', error);
    toast.error('Error generating code');
  } finally {
    setIsGenerating(false);
  }
}; 