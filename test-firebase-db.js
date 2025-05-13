// Test script to add data to Firebase Realtime Database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');

// Your web app's Firebase configuration
const firebaseConfig = {
  // Use the config from the new project
  apiKey: "AIzaSyBVOAQZlG5djqUQVP1AdgERD1WZZB2fvY0", 
  authDomain: "websitepay-2681c.firebaseapp.com",
  databaseURL: "https://websitepay-2681c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "websitepay-2681c",
  storageBucket: "websitepay-2681c.appspot.com",
  messagingSenderId: "728732104278",
  appId: "1:728732104278:web:5b2bfcb7bc8a50f7baf5d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to add a test code
async function addTestCode() {
  try {
    console.log("Adding test code...");
    const testCodeRef = ref(database, 'codes/test1');
    await set(testCodeRef, {
      code: "TEST1",
      used: false,
      generatedAt: new Date().toISOString(),
      usedAt: null
    });
    console.log("Test code added successfully!");
    
    // Read back the code to verify
    const codesRef = ref(database, 'codes');
    const snapshot = await get(codesRef);
    
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
  setTimeout(() => process.exit(0), 2000); // Give time for operations to complete
}).catch(error => {
  console.error("Test failed:", error);
  process.exit(1);
}); 