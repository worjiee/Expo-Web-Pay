// Script to test Firebase database rules directly via REST API
const fetch = require('node-fetch');

// Your Firebase database URL
const databaseURL = "https://websitepay-2681c-default-rtdb.asia-southeast1.firebasedatabase.app";

// Function to test database access
async function testDatabaseAccess() {
  try {
    console.log("Testing Firebase database direct access...");
    
    // Try to read data
    console.log("Attempting to read data...");
    const readResponse = await fetch(`${databaseURL}/codes.json`);
    const readData = await readResponse.json();
    console.log("Read response:", readResponse.status, readResponse.statusText);
    console.log("Data:", readData);
    
    // Try to write data
    console.log("\nAttempting to write data...");
    const testData = {
      code: "DIRECTTEST" + Math.floor(1000 + Math.random() * 9000),
      used: false,
      generatedAt: new Date().toISOString(),
      usedAt: null
    };
    
    const writeResponse = await fetch(`${databaseURL}/codes/directtest.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const writeResult = await writeResponse.json();
    console.log("Write response:", writeResponse.status, writeResponse.statusText);
    console.log("Write result:", writeResult);
    
    console.log("\nIf you see permission denied errors, please update your Firebase security rules:");
    console.log("1. Go to https://console.firebase.google.com/project/websitepay-2681c/database/websitepay-2681c-default-rtdb/rules");
    console.log("2. Update the rules to allow read/write:");
    console.log(`
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
`);
    console.log("3. IMPORTANT: This is only for testing. Change back to auth-protected rules after confirming it works:");
    console.log(`
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "codes": {
      ".indexOn": "code"
    }
  }
}
`);
    
  } catch (error) {
    console.error("Error during REST API test:", error);
  }
}

// Run the test
testDatabaseAccess()
  .then(() => console.log("Test completed"))
  .catch(error => console.error("Test failed:", error)); 