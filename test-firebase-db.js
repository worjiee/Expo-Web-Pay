// Test script to add data to Firebase Realtime Database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');
const { getAuth, signInAnonymously } = require('firebase/auth');

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
const database = getDatabase(app);
const auth = getAuth(app);

// Function to add a test code
async function addTestCode() {
  try {
    console.log("Attempting to sign in anonymously...");
    
    // Sign in anonymously - this should work with proper Firebase rules
    const userCredential = await signInAnonymously(auth);
    console.log("Anonymous sign-in successful:", userCredential.user.uid);
    
    console.log("Adding test code...");
    const testCodeRef = ref(database, 'codes/test123');
    const testCodeData = {
      code: "TEST123",
      used: false,
      generatedAt: new Date().toISOString(),
      usedAt: null
    };
    
    await set(testCodeRef, testCodeData);
    console.log("Test code added successfully!");
    
    // Verify code was added
    const snapshot = await get(ref(database, 'codes/test123'));
    if (snapshot.exists()) {
      console.log("Verification successful! Data:", snapshot.val());
    } else {
      console.log("Verification failed - no data found");
    }
    
  } catch (error) {
    console.error("Error during operation:", error);
  }
  console.log("Test completed");
}

// Call the function
addTestCode(); 