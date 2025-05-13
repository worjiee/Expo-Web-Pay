// Test script using Firebase Admin SDK to add data to Realtime Database
const admin = require('firebase-admin');

// IMPORTANT: Replace this line with your actual path to the service account JSON file
// const serviceAccount = require('./path-to-your-service-account-key.json');
// Example: const serviceAccount = require('./websitepay-2681c-firebase-adminsdk-xxxx-xxxxxxx.json');

// Replace this comment with the serviceAccount initialization once you have the key file
// For now, we'll provide instructions on how to use this script

console.log("=================================================================");
console.log("FIREBASE ADMIN SDK TEST SCRIPT");
console.log("=================================================================");
console.log("TO USE THIS SCRIPT:");
console.log("1. Go to Firebase Console > Project Settings > Service Accounts");
console.log("2. Click 'Generate new private key'");
console.log("3. Save the JSON file to the same directory as this script");
console.log("4. Edit this script to uncomment the serviceAccount line");
console.log("5. Update the path to point to your JSON file");
console.log("6. Run the script with: node admin-db-test.js");
console.log("=================================================================");

/* Uncomment once you have the service account key file
// Initialize the app with a service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://websitepay-2681c-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Get a database reference
const db = admin.database();

// Function to add a test code
async function addTestCode() {
  try {
    console.log("Adding test code...");
    const testCodeRef = db.ref('codes/test1');
    await testCodeRef.set({
      code: "TEST1",
      used: false,
      generatedAt: new Date().toISOString(),
      usedAt: null
    });
    console.log("Test code added successfully!");
    
    // Read back the codes to verify
    const codesRef = db.ref('codes');
    const snapshot = await codesRef.once('value');
    
    if (snapshot.exists()) {
      console.log("Current codes in database:", snapshot.val());
    } else {
      console.log("No data found in the codes collection");
    }
  } catch (error) {
    console.error("Error during operation:", error);
  }
}

// Run the test
addTestCode().then(() => {
  console.log("Test completed");
  process.exit(0);
}).catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
});
*/ 