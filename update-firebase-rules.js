// Script to update Firebase security rules
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getDatabase, ref, set } = require('firebase/database');

// Your web app's Firebase configuration
const firebaseConfig = {
  // Note: When you create a new API key in Google Cloud Console, replace this value with your new key
  apiKey: "AIzaSyBPaWpxyh5VGkHBORw0GmLr4vJEpn2X78k", // Updated API key
  authDomain: "websitepay-2681c.firebaseapp.com",
  databaseURL: "https://websitepay-2681c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "websitepay-2681c",
  storageBucket: "websitepay-2681c.appspot.com",
  messagingSenderId: "728732104278",
  appId: "1:728732104278:web:5b2bfcb7bc8a50f7baf5d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Function to create a test code
async function createTestCode() {
  try {
    console.log("Attempting to sign in anonymously...");
    
    // Sign in anonymously
    await signInAnonymously(auth);
    console.log("Anonymous sign-in successful!");
    
    console.log("Adding test code...");
    
    // Create a reference with a new random ID
    const testCodeId = Date.now().toString();
    const codeRef = ref(database, `codes/${testCodeId}`);
    
    // Create the code data
    const codeData = {
      code: "TEST" + Math.floor(1000 + Math.random() * 9000).toString(),
      used: false,
      generatedAt: new Date().toISOString(),
      usedAt: null
    };
    
    // Set the data
    await set(codeRef, codeData);
    console.log("Test code added successfully:", codeData.code);
    
  } catch (error) {
    console.error("Error during operation:", error);
  }
}

// Call the function
createTestCode()
  .then(() => {
    console.log("Test completed");
    setTimeout(() => process.exit(0), 2000); // Give time for operations to complete
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  }); 