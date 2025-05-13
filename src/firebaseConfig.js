// Firebase configuration for code synchronization
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, get, 
         child, connectDatabaseEmulator, onDisconnect, 
         serverTimestamp, onConnected, onAuthStateChanged } from 'firebase/database';
import { getLocalCodes, saveLocalCodes, getAllGloballyUsedCodes, updateSyncTimestamp } from './proxyService';

// Firebase configuration - using a free demo project
const firebaseConfig = {
  apiKey: "AIzaSyDltP_6QMX-9h5X7Z8Q7xSW1X5M4iV8sHo",
  authDomain: "codesync-demo.firebaseapp.com",
  projectId: "codesync-demo",
  storageBucket: "codesync-demo.appspot.com",
  messagingSenderId: "432019689101",
  appId: "1:432019689101:web:7d8cfe0c1a77d15b4c6f83",
  databaseURL: "https://codesync-demo-default-rtdb.firebaseio.com"
};

// Initialize Firebase
let app;
let database;
let initialized = false;
let connectionStatus = 'disconnected';

// Unique device ID to track sync sources (generate once per session)
const deviceId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
console.log('Device ID for sync:', deviceId);

try {
  console.log('FIREBASE-DEBUG: Initializing Firebase with config:', firebaseConfig);
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  
  // Monitor connection status
  const connectedRef = ref(database, '.info/connected');
  onValue(connectedRef, (snap) => {
    connectionStatus = snap.val() === true ? 'connected' : 'disconnected';
    console.log('FIREBASE-DEBUG: Connection status changed to', connectionStatus);
    
    if (snap.val() === true) {
      console.log('FIREBASE-DEBUG: Connected to Firebase');
      
      // When we disconnect, let's record that
      const connectionRef = ref(database, `devices/${deviceId}`);
      onDisconnect(connectionRef).set({
        status: 'offline',
        lastSeen: serverTimestamp()
      });
      
      // Record that we're online
      set(connectionRef, {
        status: 'online',
        connectTime: serverTimestamp(),
        userAgent: navigator.userAgent
      });
      
      // Trigger sync of local data to Firebase
      syncCodesNow();
    } else {
      console.log('FIREBASE-DEBUG: Disconnected from Firebase');
    }
  });
  
  initialized = true;
  console.log('FIREBASE-DEBUG: Firebase initialized successfully');
} catch (err) {
  console.error('FIREBASE-DEBUG: Firebase initialization error:', err);
}

// Function to check if Firebase is connected
export const isFirebaseConnected = () => {
  return connectionStatus === 'connected' && initialized;
};

// Reference to the codes in the database
const getCodesRef = () => {
  if (!initialized) {
    console.log('FIREBASE-DEBUG: Cannot get codes ref - Firebase not initialized');
    return null;
  }
  return ref(database, 'codes');
};

// Reference to the master usage in the database
const getMasterUsageRef = () => {
  if (!initialized) {
    console.log('FIREBASE-DEBUG: Cannot get master usage ref - Firebase not initialized');
    return null;
  }
  return ref(database, 'master_usage');
};

// Function to push codes to Firebase
export const syncCodesToFirebase = (codes) => {
  if (!initialized) {
    console.error('FIREBASE-DEBUG: Cannot sync to Firebase: not initialized');
    return;
  }
  
  try {
    console.log(`FIREBASE-DEBUG: Syncing ${codes.length} codes to Firebase from device ${deviceId}`);
    
    // Store as a simple array for easier retrieval
    const codesRef = getCodesRef();
    if (!codesRef) return;
    
    set(codesRef, {
      codes: codes,
      lastUpdated: new Date().toISOString(),
      deviceId: deviceId,
      platform: navigator.platform,
      userAgent: navigator.userAgent.substring(0, 100) // Truncate to avoid excess data
    });
    
    // Also update the master usage data for any used codes
    updateMasterUsage(codes);
    
    console.log('FIREBASE-DEBUG: Codes synced to Firebase successfully');
  } catch (err) {
    console.error('FIREBASE-DEBUG: Error syncing codes to Firebase:', err);
    alert('Error syncing codes: ' + err.message);
  }
};

// Function to update master usage data
const updateMasterUsage = (codes) => {
  if (!initialized) return;
  
  try {
    // Get only the used codes
    const usedCodes = codes.filter(code => code.used);
    
    if (usedCodes.length === 0) {
      console.log('FIREBASE-DEBUG: No used codes to sync to master usage');
      return;
    }
    
    console.log(`FIREBASE-DEBUG: Syncing ${usedCodes.length} used codes to master usage`);
    
    // Get reference to master usage
    const masterUsageRef = getMasterUsageRef();
    if (!masterUsageRef) return;
    
    // First get current master usage
    get(masterUsageRef).then((snapshot) => {
      let currentUsage = snapshot.exists() ? snapshot.val() : {};
      
      // Update with our used codes
      usedCodes.forEach(code => {
        if (!code || !code.code) {
          console.warn('FIREBASE-DEBUG: Skipping invalid code object in updateMasterUsage');
          return;
        }
        
        const normalizedCode = code.code.toString().trim().toUpperCase();
        currentUsage[normalizedCode] = {
          used: true,
          usedAt: code.usedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          device: deviceId
        };
      });
      
      // Save back to Firebase
      return set(masterUsageRef, currentUsage).then(() => {
        console.log('FIREBASE-DEBUG: Master usage updated successfully');
        
        // Also update the sync timestamp to trigger refresh on other devices
        const timestampRef = ref(database, 'last_sync');
        return set(timestampRef, {
          timestamp: new Date().toISOString(),
          source: deviceId
        });
      }).then(() => {
        console.log('FIREBASE-DEBUG: Updated sync timestamp to trigger refresh');
      });
    }).catch(err => {
      console.error('FIREBASE-DEBUG: Error getting current master usage:', err);
      
      // Retry once after a short delay
      setTimeout(() => {
        console.log('FIREBASE-DEBUG: Retrying master usage update...');
        // Simplified direct update approach for retry
        const directUpdate = {};
        
        usedCodes.forEach(code => {
          if (!code || !code.code) return;
          
          const normalizedCode = code.code.toString().trim().toUpperCase();
          directUpdate[normalizedCode] = {
            used: true,
            usedAt: code.usedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            device: deviceId,
            retryUpdate: true
          };
        });
        
        if (Object.keys(directUpdate).length > 0) {
          // Reference to master usage
          const retryMasterUsageRef = getMasterUsageRef();
          if (retryMasterUsageRef) {
            set(retryMasterUsageRef, directUpdate)
              .then(() => console.log('FIREBASE-DEBUG: Retry master usage update successful'))
              .catch(retryErr => console.error('FIREBASE-DEBUG: Retry update failed:', retryErr));
          }
        }
      }, 2000);
    });
  } catch (err) {
    console.error('FIREBASE-DEBUG: Error updating master usage:', err);
  }
};

// Function to sync codes immediately
export const syncCodesNow = () => {
  if (!initialized) {
    console.error('FIREBASE-DEBUG: Cannot sync now - Firebase not initialized');
    return false;
  }
  
  try {
    console.log('FIREBASE-DEBUG: Performing immediate sync');
    
    // Add retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptSync = async () => {
      try {
        // Get current codes
        const codes = getLocalCodes();
        
        // Sync to Firebase
        await syncCodesToFirebase(codes);
        
        // Sync master usage
        const masterUsage = getAllGloballyUsedCodes();
        if (masterUsage && Object.keys(masterUsage).length > 0) {
          const masterUsageRef = getMasterUsageRef();
          if (masterUsageRef) {
            await set(masterUsageRef, masterUsage);
            console.log('FIREBASE-DEBUG: Synced master usage data');
          }
        }
        
        // Update sync timestamp
        updateSyncTimestamp();
        
        // Signal success
        return true;
      } catch (err) {
        console.error(`FIREBASE-DEBUG: Error in sync attempt ${retryCount + 1}:`, err);
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`FIREBASE-DEBUG: Retrying sync (attempt ${retryCount + 1} of ${maxRetries})...`);
          // Exponential backoff for retries (500ms, 1500ms, 4500ms)
          const delay = Math.pow(3, retryCount) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptSync();
        } else {
          console.error('FIREBASE-DEBUG: Maximum retries reached, sync failed');
          return false;
        }
      }
    };
    
    // Start the sync process with retries
    return attemptSync();
  } catch (err) {
    console.error('FIREBASE-DEBUG: Error in immediate sync:', err);
    return false;
  }
};

// Function to initialize Firebase sync
export const initFirebaseSync = (onCodesUpdated) => {
  if (!initialized) {
    console.error('FIREBASE-DEBUG: Cannot initialize Firebase sync: Firebase not initialized');
    return;
  }
  
  console.log('FIREBASE-DEBUG: Initializing Firebase sync...');
  const codesRef = getCodesRef();
  if (!codesRef) return;
  
  // Listen for changes in the database
  onValue(codesRef, (snapshot) => {
    try {
      const data = snapshot.val();
      console.log('FIREBASE-DEBUG: Firebase update received:', data ? 'Data available' : 'No data');
      
      if (data && data.codes && Array.isArray(data.codes)) {
        console.log(`FIREBASE-DEBUG: Received ${data.codes.length} codes from Firebase, source device: ${data.deviceId}`);
        console.log('FIREBASE-DEBUG: Source device platform:', data.platform || 'unknown');
        
        if (data.deviceId === deviceId) {
          console.log('FIREBASE-DEBUG: Update from same device, ignoring');
          return;
        }
        
        // Get current local codes
        const localCodes = getLocalCodes();
        console.log(`FIREBASE-DEBUG: Local codes: ${localCodes.length}`);
        
        // Merge with remote codes, favoring remote for any conflicts
        const mergedCodes = mergeCodeArrays(localCodes, data.codes);
        console.log(`FIREBASE-DEBUG: After merging: ${mergedCodes.length} codes (added ${mergedCodes.length - localCodes.length} new codes)`);
        
        // Save merged codes to localStorage
        saveLocalCodes(mergedCodes);
        
        // Update the sync timestamp
        updateSyncTimestamp();
        
        // Notify the callback
        if (onCodesUpdated && typeof onCodesUpdated === 'function') {
          onCodesUpdated(mergedCodes);
        }
      } else {
        console.log('FIREBASE-DEBUG: Invalid data format or empty data from Firebase');
      }
    } catch (err) {
      console.error('FIREBASE-DEBUG: Error processing Firebase update:', err);
    }
  }, (error) => {
    console.error('FIREBASE-DEBUG: Firebase onValue error:', error);
  });
  
  // Initial sync - push local codes to Firebase
  try {
    const localCodes = getLocalCodes();
    console.log(`FIREBASE-DEBUG: Initial sync: Pushing ${localCodes.length} local codes to Firebase`);
    
    if (localCodes && localCodes.length > 0) {
      syncCodesToFirebase(localCodes);
    }
  } catch (err) {
    console.error('FIREBASE-DEBUG: Error during initial Firebase sync:', err);
  }
};

// Helper function to merge code arrays
const mergeCodeArrays = (localCodes, remoteCodes) => {
  // Start with local codes
  const merged = [...localCodes];
  
  // Add remote codes that don't exist locally
  let newCodesAdded = 0;
  
  remoteCodes.forEach(remoteCode => {
    // Skip invalid codes
    if (!remoteCode || !remoteCode.code) {
      console.warn('FIREBASE-DEBUG: Skipping invalid remote code:', remoteCode);
      return;
    }
    
    const exists = localCodes.some(localCode => 
      localCode.code && localCode.code.toString().trim().toUpperCase() === remoteCode.code.toString().trim().toUpperCase()
    );
    
    if (!exists) {
      // Make sure the code has the correct format
      const validCode = {
        id: remoteCode.id || Math.floor(Math.random() * 100000),
        code: remoteCode.code.toString().trim().toUpperCase(),
        used: remoteCode.used || false,
        generatedAt: remoteCode.generatedAt || remoteCode.createdAt || new Date().toISOString(),
        usedAt: remoteCode.usedAt || null
      };
      
      merged.push(validCode);
      newCodesAdded++;
    }
  });
  
  console.log(`FIREBASE-DEBUG: Merged codes: Added ${newCodesAdded} new codes from remote source`);
  return merged;
};

// Function to handle Firebase errors more gracefully
const handleFirebaseError = (error, operation = 'unknown') => {
  console.error(`Firebase error during ${operation}:`, error);
  
  // Check if this is a network error
  if (error.code === 'NETWORK_ERROR' || 
      error.message?.includes('network') || 
      error.message?.includes('timeout') ||
      error.message?.includes('connection')) {
    console.warn('Network-related Firebase error detected');
    
    // Return false to indicate error
    return false;
  }
  
  // Log all Firebase errors to console for debugging
  console.warn(`Firebase ${operation} error:`, {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
  
  return false;
};

// Modified version of setupFirebaseSync with better error handling
const setupFirebaseSync = async (callback) => {
  try {
    // Initialize Firebase first
    const app = await initFirebaseSync().catch(err => {
      handleFirebaseError(err, 'initialization');
      return null;
    });
    
    if (!app) {
      console.warn('Firebase initialization failed');
      return false;
    }
    
    const db = getDatabase(app);
    
    // Check Firebase connection status
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      const connected = snap.val();
      if (connected) {
        console.log('Firebase realtime database connected');
        
        // Trigger callback with connected status
        if (callback) {
          callback({
            action: 'FIREBASE_SYNC',
            data: {
              type: 'connected',
              timestamp: new Date().toISOString()
            }
          });
        }
      } else {
        console.warn('Firebase realtime database disconnected');
      }
    }, (error) => {
      handleFirebaseError(error, 'connection check');
    });
    
    // Setup code usage listener
    const usageRef = ref(db, 'master_usage');
    
    // Listen for code usage changes
    onValue(usageRef, (snapshot) => {
      if (snapshot.exists()) {
        const usageData = snapshot.val();
        console.log('Firebase usage data updated:', Object.keys(usageData).length);
        
        if (callback) {
          callback({
            action: 'FIREBASE_SYNC',
            data: {
              type: 'usage_update',
              timestamp: new Date().toISOString(),
              count: Object.keys(usageData).length
            }
          });
        }
      }
    }, (error) => {
      handleFirebaseError(error, 'usage listener');
    });
    
    return true;
  } catch (err) {
    handleFirebaseError(err, 'setupFirebaseSync');
    return false;
  }
};

export default {
  initFirebaseSync,
  syncCodesNow,
  syncCodesToFirebase,
  isFirebaseConnected,
  setupFirebaseSync
}; 