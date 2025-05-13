// Firebase configuration
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, remove, onValue } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // Note: When you create a new API key in Google Cloud Console, replace this value with your new key
  apiKey: "AIzaSyBPaWpxyh5VGkHBORw0GmLr4vJEpn2X78k", // Replace this with your new API key
  authDomain: "websitepay-2681c.firebaseapp.com",
  databaseURL: "https://websitepay-2681c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "websitepay-2681c",
  storageBucket: "websitepay-2681c.appspot.com",
  messagingSenderId: "728732104278",
  appId: "1:728732104278:web:5b2bfcb7bc8a50f7baf5d9"
};

// Log the config to verify it's correct
console.log("Firebase Config:", firebaseConfig);

// Initialize Firebase
let app, database, auth;
let firebaseService = null;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);

  // Sign in anonymously by default to ensure database access
  signInAnonymously(auth)
    .then(() => {
      console.log("Firebase: Anonymous authentication successful");
    })
    .catch((error) => {
      console.error("Firebase: Anonymous authentication error:", error.code, error.message);
      // Try a second time with additional error handling
      setTimeout(() => {
        signInAnonymously(auth)
          .then(() => {
            console.log("Firebase: Second attempt anonymous authentication successful");
          })
          .catch((error) => {
            console.error("Firebase: Second attempt authentication failed:", error.code, error.message);
          });
      }, 2000);
    });
} catch (error) {
  console.error("Error initializing Firebase:", error);
  app = null;
  database = null;
  auth = null;
}

// Function to authenticate with Firebase
export const authenticateWithFirebase = async (email, password) => {
  if (!auth) {
    console.error("Firebase not initialized");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error("Firebase authentication error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to get all codes from Firebase
export const getAllCodes = async () => {
  if (!database || !auth) {
    console.error("Firebase not initialized");
    return [];
  }
  
  try {
    // Ensure we're signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously before getAllCodes");
      } catch (authError) {
        console.error("Error signing in anonymously:", authError);
      }
    }
    
    const codesRef = ref(database, 'codes');
    const snapshot = await get(codesRef);
    
    if (snapshot.exists()) {
      // Convert the Firebase object to an array
      const codesObj = snapshot.val();
      const codesArray = Object.keys(codesObj).map(key => ({
        ...codesObj[key],
        id: key
      }));
      return codesArray;
    } else {
      console.log("No codes available in Firebase");
      return [];
    }
  } catch (error) {
    console.error("Error getting codes from Firebase:", error);
    return [];
  }
};

// Function to save a code to Firebase
export const saveCode = async (code) => {
  if (!database || !auth) {
    console.error("Firebase not initialized");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    // Ensure we're signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously before saveCode");
      } catch (authError) {
        console.error("Error signing in anonymously:", authError);
      }
    }
    
    // Create a reference with an auto-generated ID
    const codeId = code.id || Date.now().toString();
    const codeRef = ref(database, `codes/${codeId}`);
    
    // Standardize the code format
    const standardizedCode = {
      code: code.code.toString().trim().toUpperCase(),
      used: code.used || false,
      generatedAt: code.generatedAt || new Date().toISOString(),
      usedAt: code.usedAt || null
    };
    
    // Set the data
    await set(codeRef, standardizedCode);
    return {
      success: true,
      id: codeId
    };
  } catch (error) {
    console.error("Error saving code to Firebase:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to update a code in Firebase
export const updateCode = async (codeId, updates) => {
  if (!database || !auth) {
    console.error("Firebase not initialized");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    // Ensure we're signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously before updateCode");
      } catch (authError) {
        console.error("Error signing in anonymously:", authError);
      }
    }
    
    const codeRef = ref(database, `codes/${codeId}`);
    await update(codeRef, updates);
    return {
      success: true
    };
  } catch (error) {
    console.error("Error updating code in Firebase:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to delete a code from Firebase
export const deleteCode = async (codeId) => {
  if (!database || !auth) {
    console.error("Firebase not initialized");
    return { success: false, error: "Firebase not initialized" };
  }
  
  try {
    // Ensure we're signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously before deleteCode");
      } catch (authError) {
        console.error("Error signing in anonymously:", authError);
      }
    }
    
    const codeRef = ref(database, `codes/${codeId}`);
    await remove(codeRef);
    return {
      success: true
    };
  } catch (error) {
    console.error("Error deleting code from Firebase:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to delete all codes from Firebase
export const deleteAllCodes = async () => {
  if (!database || !auth) {
    console.error("Firebase not initialized");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    // Ensure we're signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously before deleteAllCodes");
      } catch (authError) {
        console.error("Error signing in anonymously:", authError);
      }
    }
    
    const codesRef = ref(database, 'codes');
    await remove(codesRef);
    return {
      success: true
    };
  } catch (error) {
    console.error("Error deleting all codes from Firebase:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to verify a code in Firebase
export const verifyCode = async (codeValue) => {
  if (!database || !auth) {
    console.error("Firebase not initialized");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    // Ensure we're signed in
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
        console.log("Signed in anonymously before verifyCode");
      } catch (authError) {
        console.error("Error signing in anonymously:", authError);
      }
    }
    
    // Standardize the code
    const standardizedCode = codeValue.toString().trim().toUpperCase();
    
    // Get all codes
    const codes = await getAllCodes();
    
    // Find the matching code
    const codeObj = codes.find(c => c.code === standardizedCode);
    
    if (!codeObj) {
      return {
        success: false,
        message: "Invalid code"
      };
    }
    
    if (codeObj.used) {
      return {
        success: false,
        message: "This code has already been used"
      };
    }
    
    // Mark as used
    await updateCode(codeObj.id, {
      used: true,
      usedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: "Code verified successfully"
    };
  } catch (error) {
    console.error("Error verifying code in Firebase:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to listen for code changes in real-time
export const listenForCodeChanges = (callback) => {
  if (!database || !auth) {
    console.error("Firebase not initialized");
    return () => {}; // Return empty function
  }

  // Ensure we're signed in
  if (!auth.currentUser) {
    signInAnonymously(auth)
      .then(() => {
        console.log("Signed in anonymously before listenForCodeChanges");
      })
      .catch(error => {
        console.error("Firebase anonymous auth error:", error);
      });
  }
  
  const codesRef = ref(database, 'codes');
  
  const unsubscribe = onValue(codesRef, (snapshot) => {
    if (snapshot.exists()) {
      // Convert the Firebase object to an array
      const codesObj = snapshot.val();
      const codesArray = Object.keys(codesObj).map(key => ({
        ...codesObj[key],
        id: key
      }));
      callback(codesArray);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error("Error in listenForCodeChanges:", error);
  });
  
  // Return the unsubscribe function to stop listening later
  return unsubscribe;
};

// Create Firebase service object
firebaseService = {
  app,
  database,
  auth,
  getAllCodes,
  saveCode,
  updateCode,
  deleteCode,
  deleteAllCodes,
  verifyCode,
  listenForCodeChanges,
  authenticateWithFirebase
};

export default firebaseService; 