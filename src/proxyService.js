// Simplified proxy service to handle code storage in localStorage

// Generate a random code following the pattern of 5 uppercase letters
export const generateRandomCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// Global synchronization timestamp key
const SYNC_TIMESTAMP_KEY = 'code_sync_timestamp';

// Function to update the global sync timestamp
export const updateSyncTimestamp = () => {
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(SYNC_TIMESTAMP_KEY, timestamp);
    console.log('Updated sync timestamp:', timestamp);
    // Broadcast the timestamp update
    broadcastCodeChanges('SYNC_TIMESTAMP_UPDATED', { timestamp });
    return timestamp;
  } catch (err) {
    console.error('Error updating sync timestamp:', err);
    return null;
  }
};

// Function to get the current sync timestamp
export const getSyncTimestamp = () => {
  try {
    return localStorage.getItem(SYNC_TIMESTAMP_KEY) || new Date(0).toISOString();
  } catch (err) {
    console.error('Error getting sync timestamp:', err);
    return new Date(0).toISOString();
  }
};

// Function to check if a sync is needed
export const isSyncNeeded = (lastCheckedTimestamp) => {
  try {
    const currentTimestamp = getSyncTimestamp();
    if (!lastCheckedTimestamp || currentTimestamp > lastCheckedTimestamp) {
      console.log('Sync needed - current:', currentTimestamp, 'last checked:', lastCheckedTimestamp);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error checking if sync is needed:', err);
    return true; // If in doubt, sync
  }
};

// Function to get current codes from localStorage
export const getLocalCodes = () => {
  try {
    const storedCodes = localStorage.getItem('mockDb_codes');
    
    if (!storedCodes) {
      console.log('No codes found in localStorage');
      return [];
    }
    
    // Parse the JSON data
    const parsedCodes = JSON.parse(storedCodes);
    console.log(`Retrieved ${parsedCodes.length} codes from localStorage`);
    
    // Always return a standardized format with consistent field names
    return parsedCodes.map(code => ({
      id: code.id || Math.floor(Math.random() * 100000),
      code: code.code.toString().trim().toUpperCase(),
      used: code.used || false,
      generatedAt: code.generatedAt || code.createdAt || new Date().toISOString(),
      usedAt: code.usedAt || null
    }));
  } catch (err) {
    console.error('Error getting codes from localStorage:', err);
    return [];
  }
};

// Function to save codes to localStorage
export const saveLocalCodes = (codes) => {
  try {
    // Ensure all codes are standardized before saving
    const standardizedCodes = Array.isArray(codes) ? codes.map(code => ({
      id: code.id || Math.floor(Math.random() * 100000),
      code: code.code.toString().trim().toUpperCase(),
      used: code.used || false,
      generatedAt: code.generatedAt || code.createdAt || new Date().toISOString(),
      usedAt: code.usedAt || null
    })) : [];
    
    // Save to localStorage
    localStorage.setItem('mockDb_codes', JSON.stringify(standardizedCodes));
    console.log(`Saved ${standardizedCodes.length} codes to localStorage`);
    
    // Update the global sync timestamp
    updateSyncTimestamp();
    
    // Broadcast code changes
    broadcastCodeChanges('CODES_UPDATED', { count: standardizedCodes.length });
    
    return true;
  } catch (err) {
    console.error('Error saving codes to localStorage:', err);
    return false;
  }
};

// Function to add a code to localStorage
export const addCodeToLocalStorage = (newCode) => {
  try {
    const codes = getLocalCodes();
    
    // Standardize the new code
    const standardizedCode = {
      id: newCode.id || Math.floor(Math.random() * 100000),
      code: newCode.code.toString().trim().toUpperCase(),
      used: newCode.used || false,
      generatedAt: newCode.generatedAt || new Date().toISOString(),
      usedAt: newCode.usedAt || null
    };
    
    // Check if code already exists (case insensitive)
    if (!codes.some(c => c.code === standardizedCode.code)) {
      codes.push(standardizedCode);
      saveLocalCodes(codes);
      
      // Broadcast code addition
      broadcastCodeChanges('CODE_ADDED', { code: standardizedCode.code });
      
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error adding code to localStorage:', err);
    return false;
  }
};

// Function to update a code's status in localStorage
export const updateCodeStatus = (code, used) => {
  try {
    const codes = getLocalCodes();
    
    // Standardize the input code
    const standardizedCode = code.toString().trim().toUpperCase();
    
    // Find the code object using strict case-insensitive comparison
    const codeObj = codes.find(c => c.code === standardizedCode);
    
    if (codeObj) {
      codeObj.used = used;
      codeObj.usedAt = used ? new Date().toISOString() : null;
      saveLocalCodes(codes);
      
      // Also update the master usage key
      if (used) {
        markCodeAsUsedGlobally(standardizedCode);
      }
      
      // Broadcast status change
      broadcastCodeChanges('CODE_STATUS_CHANGED', { 
        code: standardizedCode, 
        used, 
        usedAt: codeObj.usedAt 
      });
      
      return true;
    }
    
    console.log(`Code not found for status update: ${standardizedCode}`);
    return false;
  } catch (err) {
    console.error('Error updating code status in localStorage:', err);
    return false;
  }
};

// Function to export codes as text for sharing
export const exportCodesAsText = (codesArray) => {
  try {
    // Create a simplified version of codes for sharing
    const simplifiedCodes = codesArray.map(code => ({
      code: code.code,
      used: code.used || false,
      usedAt: code.usedAt || null
    }));
    
    // Convert to base64 for easy sharing
    return btoa(JSON.stringify(simplifiedCodes));
  } catch (err) {
    console.error('Error exporting codes:', err);
    return null;
  }
};

// Function to import codes from text
export const importCodesFromText = (encodedText) => {
  try {
    // Decode from base64
    const decodedText = atob(encodedText);
    const importedCodes = JSON.parse(decodedText);
    
    // Validate the structure
    if (!Array.isArray(importedCodes)) {
      throw new Error('Invalid code format');
    }
    
    // Get existing codes
    const existingCodes = getLocalCodes();
    let newCodesAdded = 0;
    
    // Merge the codes
    importedCodes.forEach(importedCode => {
      // Check if the code structure is valid
      if (importedCode.code && typeof importedCode.code === 'string') {
        // Check if this code already exists
        const exists = existingCodes.some(
          c => c.code.toUpperCase() === importedCode.code.toUpperCase()
        );
        
        if (!exists) {
          // Add the code with needed properties
          existingCodes.push({
            id: existingCodes.length > 0 
              ? Math.max(...existingCodes.map(c => c.id)) + 1 
              : 1,
            code: importedCode.code.toUpperCase(),
            used: importedCode.used || false,
            usedAt: importedCode.usedAt || null,
            generatedAt: importedCode.generatedAt || new Date().toISOString()
          });
          newCodesAdded++;
        }
      }
    });
    
    // Save the merged codes
    saveLocalCodes(existingCodes);
    
    // Broadcast import event
    broadcastCodeChanges('CODES_IMPORTED', { count: newCodesAdded });
    
    return {
      success: true,
      totalImported: importedCodes.length,
      newCodesAdded
    };
  } catch (err) {
    console.error('Error importing codes:', err);
    return { success: false, error: err.message };
  }
};

// Utility functions for the proxy service
export const proxyUtils = {
  getCurrentTimestamp: () => new Date().toISOString(),
  formatCode: (code) => code.toUpperCase().trim(),
  validateCode: (code) => /^[A-Z]{5}$/.test(code)
};

// Function to fetch remote data (mockup function that just returns local data)
export const fetchRemoteData = async () => {
  console.log('Fetching remote data through proxy service...');
  
  try {
    // Simply return the local data - no remote calls needed
    return getLocalCodes();
  } catch (error) {
    console.error('Error in fetchRemoteData:', error);
    return [];
  }
};

// Function to update remote data (mockup function that just updates local data)
export const updateRemoteData = async (codes) => {
  console.log('Updating remote data through proxy service...');
  
  try {
    // Simply save to local storage - no remote calls needed
    return saveLocalCodes(codes);
  } catch (error) {
    console.error('Error in updateRemoteData:', error);
    return false;
  }
};

// Create a Broadcast Channel for cross-tab/window communication
let broadcastChannel;
try {
  broadcastChannel = new BroadcastChannel('codes_sync_channel');
  console.log('BroadcastChannel initialized successfully');
} catch (err) {
  console.error('BroadcastChannel not supported in this browser:', err);
}

// Function to broadcast code changes to other tabs/windows
export const broadcastCodeChanges = (action, data) => {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        action,
        data,
        timestamp: new Date().toISOString()
      });
      console.log(`Broadcasting code changes: ${action}`, data);
    }
    
    // Always update the sync timestamp when broadcasting changes
    // This helps with cross-device sync
    const timestamp = new Date().toISOString();
    localStorage.setItem(SYNC_TIMESTAMP_KEY, timestamp);
    
    // Also sync to Firebase for cross-device functionality
    syncToFirebase(action, data);
  } catch (err) {
    console.error('Error broadcasting code changes:', err);
  }
};

// Function to sync changes to Firebase for cross-device functionality
const syncToFirebase = async (action, data) => {
  try {
    console.log('SYNC-DEBUG: Starting Firebase sync for action:', action);
    
    // Import Firebase functions
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, set, onValue, get, child } = await import('firebase/database');
    console.log('SYNC-DEBUG: Firebase modules imported successfully');
    
    // Firebase configuration - using the demo project already set up
    const firebaseConfig = {
      apiKey: "AIzaSyDltP_6QMX-9h5X7Z8Q7xSW1X5M4iV8sHo",
      authDomain: "codesync-demo.firebaseapp.com",
      projectId: "codesync-demo",
      storageBucket: "codesync-demo.appspot.com",
      messagingSenderId: "432019689101",
      appId: "1:432019689101:web:7d8cfe0c1a77d15b4c6f83",
      databaseURL: "https://codesync-demo-default-rtdb.firebaseio.com"
    };
    
    console.log('SYNC-DEBUG: Using Firebase database URL:', firebaseConfig.databaseURL);

    // Initialize Firebase if not already initialized
    let app;
    try {
      app = initializeApp(firebaseConfig);
      console.log('SYNC-DEBUG: Firebase initialized successfully');
    } catch (initError) {
      // Firebase already initialized, get the existing app
      console.log('SYNC-DEBUG: Firebase already initialized, reusing existing instance', initError.message);
    }
    
    // Get database reference
    const database = getDatabase();
    console.log('SYNC-DEBUG: Firebase database reference obtained');
    
    // Define the path where we'll store the master usage data
    const usageRef = ref(database, 'master_usage');
    
    // Get current codes
    const codes = getLocalCodes();
    
    if (action === 'CODE_USED_GLOBALLY' || action === 'CODE_STATUS_CHANGED') {
      // If a code status is changed, update the global usage in Firebase
      if (data && data.code) {
        console.log(`SYNC-DEBUG: Updating code ${data.code} status in Firebase`);
        const codeRef = ref(database, `master_usage/${data.code}`);
        await set(codeRef, {
          used: true,
          usedAt: data.usedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`SYNC-DEBUG: Successfully synced code ${data.code} status to Firebase`);
      }
    } else if (action === 'CODES_UPDATED') {
      // For bulk updates, update the sync timestamp
      console.log('SYNC-DEBUG: Updating global timestamp in Firebase');
      const timestampRef = ref(database, 'last_sync');
      await set(timestampRef, {
        timestamp: new Date().toISOString(),
        source: 'device_' + Math.floor(Math.random() * 1000000)
      });
      console.log('SYNC-DEBUG: Successfully updated global sync timestamp in Firebase');
    }
    
    // Force an immediate check for changes from Firebase
    console.log('SYNC-DEBUG: Firebase sync operation completed');
    return true;
  } catch (err) {
    console.error('SYNC-ERROR: Error syncing to Firebase:', err);
    return false;
  }
};

// Setup Firebase listening for cross-device updates - called once at app start
let firebaseListenerInitialized = false;
export const setupFirebaseSync = async (callback) => {
  if (firebaseListenerInitialized) {
    console.log('SYNC-DEBUG: Firebase sync already initialized, reusing existing connection');
    return true;
  }
  
  try {
    console.log('SYNC-DEBUG: Setting up Firebase sync...');
    // Import Firebase functions
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, onValue, serverTimestamp, onDisconnect, set } = await import('firebase/database');
    console.log('SYNC-DEBUG: Firebase modules imported successfully');
    
    // Firebase configuration - using the demo project already set up
    const firebaseConfig = {
      apiKey: "AIzaSyDltP_6QMX-9h5X7Z8Q7xSW1X5M4iV8sHo",
      authDomain: "codesync-demo.firebaseapp.com",
      projectId: "codesync-demo",
      storageBucket: "codesync-demo.appspot.com",
      messagingSenderId: "432019689101",
      appId: "1:432019689101:web:7d8cfe0c1a77d15b4c6f83",
      databaseURL: "https://codesync-demo-default-rtdb.firebaseio.com"
    };
    
    console.log('SYNC-DEBUG: Using Firebase database URL:', firebaseConfig.databaseURL);

    // Initialize Firebase if not already initialized
    let app;
    try {
      app = initializeApp(firebaseConfig);
      console.log('SYNC-DEBUG: Firebase initialized successfully for listeners');
    } catch (initError) {
      // Firebase already initialized
      console.log('SYNC-DEBUG: Firebase already initialized for listeners, reusing existing instance', initError.message);
    }
    
    // Get database reference
    const database = getDatabase();
    console.log('SYNC-DEBUG: Firebase database reference obtained for listeners');
    
    // Register a device presence reference
    const deviceId = `device_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const deviceRef = ref(database, `devices/${deviceId}`);
    
    // Set up device disconnect handler
    onDisconnect(deviceRef).update({
      status: 'offline',
      lastSeen: serverTimestamp()
    }).catch(err => {
      console.warn('SYNC-WARNING: Error setting up onDisconnect handler:', err);
    });
    
    // Mark the device as online
    try {
      await set(deviceRef, {
        status: 'online',
        connected: true,
        timestamp: serverTimestamp(),
        platform: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 100) // Truncate long strings
      });
      console.log('SYNC-DEBUG: Device registered with Firebase presence system');
    } catch (deviceRegErr) {
      console.warn('SYNC-WARNING: Failed to register device presence:', deviceRegErr);
      // Continue even if device registration fails
    }
    
    // Listen for changes to the master usage data
    const usageRef = ref(database, 'master_usage');
    console.log('SYNC-DEBUG: Setting up listener for master_usage changes');
    
    // Use a try-catch block for the onValue call to prevent crashes
    try {
      onValue(usageRef, (snapshot) => {
        try {
          const data = snapshot.val();
          console.log('SYNC-DEBUG: Received Firebase update for master usage data', data ? 'with data' : 'empty data');
          
          if (data) {
            // Update our local master usage key with Firebase data
            updateLocalMasterUsage(data);
            
            if (callback && typeof callback === 'function') {
              callback({
                action: 'FIREBASE_SYNC',
                data: { type: 'usage_update' }
              });
            }
          } else {
            console.log('SYNC-DEBUG: No data in master_usage, initializing with local data');
            // Initialize with our local data if Firebase is empty
            syncCurrentDataToFirebase();
          }
        } catch (err) {
          console.error('SYNC-ERROR: Error processing Firebase usage update:', err);
        }
      }, (error) => {
        console.error('SYNC-ERROR: Error in master_usage listener:', error);
        // Don't try to reconnect immediately as it can cause a loop
      });
      console.log('SYNC-DEBUG: Master usage listener set up successfully');
    } catch (listenerError) {
      console.error('SYNC-ERROR: Failed to set up master_usage listener:', listenerError);
      // Continue even if listener setup fails - local storage will still work
    }
    
    // Listen for timestamp updates to trigger sync
    const timestampRef = ref(database, 'last_sync');
    console.log('SYNC-DEBUG: Setting up listener for last_sync changes');
    
    try {
      onValue(timestampRef, (snapshot) => {
        try {
          const data = snapshot.val();
          console.log('SYNC-DEBUG: Received Firebase timestamp update:', data);
          
          if (data && data.timestamp) {
            // Update our local sync timestamp
            localStorage.setItem(SYNC_TIMESTAMP_KEY, data.timestamp);
            console.log('SYNC-DEBUG: Updated local sync timestamp from Firebase:', data.timestamp);
            
            if (callback && typeof callback === 'function') {
              callback({
                action: 'FIREBASE_SYNC',
                data: { type: 'timestamp_update', timestamp: data.timestamp }
              });
            }
          }
        } catch (err) {
          console.error('SYNC-ERROR: Error processing Firebase timestamp update:', err);
        }
      }, (error) => {
        console.error('SYNC-ERROR: Error in timestamp listener:', error);
      });
      console.log('SYNC-DEBUG: Timestamp listener set up successfully');
    } catch (timestampListenerError) {
      console.error('SYNC-ERROR: Failed to set up timestamp listener:', timestampListenerError);
      // Continue even if listener setup fails
    }
    
    // Sync our current data to Firebase to ensure we're up to date
    console.log('SYNC-DEBUG: Syncing current data to Firebase...');
    try {
      await syncCurrentDataToFirebase();
    } catch (syncError) {
      console.error('SYNC-ERROR: Failed to sync current data to Firebase:', syncError);
      // Continue even if initial sync fails
    }
    
    firebaseListenerInitialized = true;
    console.log('SYNC-DEBUG: Firebase cross-device sync initialized successfully');
    
    // Notify the caller that Firebase is working, but don't show alerts
    if (callback && typeof callback === 'function') {
      callback({
        action: 'FIREBASE_SYNC',
        data: { type: 'initialized', success: true }
      });
    }
    
    return true;
  } catch (err) {
    console.error('SYNC-ERROR: Error setting up Firebase sync:', err);
    
    // Notify the caller that Firebase failed, but don't show alerts
    if (callback && typeof callback === 'function') {
      callback({
        action: 'FIREBASE_SYNC',
        data: { type: 'error', message: err.message }
      });
    }
    
    // Don't set a retry here, as it can cause infinite loops
    // The caller should decide whether to retry
    
    return false;
  }
};

// Function to update our local master usage with Firebase data
const updateLocalMasterUsage = (firebaseData) => {
  try {
    // Get current local data
    let localUsageData = {};
    try {
      const storedData = localStorage.getItem(MASTER_USAGE_KEY);
      if (storedData) {
        localUsageData = JSON.parse(storedData);
      }
    } catch (err) {
      console.error('Error reading local usage data:', err);
      localUsageData = {};
    }
    
    // Merge with Firebase data, giving priority to Firebase data
    const mergedData = { ...localUsageData, ...firebaseData };
    
    // Save back to localStorage
    localStorage.setItem(MASTER_USAGE_KEY, JSON.stringify(mergedData));
    console.log('Updated local master usage data from Firebase');
    
    // Also update any corresponding codes in our local codes list
    updateLocalCodesFromMasterUsage(mergedData);
    
    return true;
  } catch (err) {
    console.error('Error updating local master usage:', err);
    return false;
  }
};

// Function to update our local codes list based on master usage data
const updateLocalCodesFromMasterUsage = (masterUsageData) => {
  try {
    // Get current codes
    const codes = getLocalCodes();
    let updatedCount = 0;
    
    // Update status of any codes that are used in master usage
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      const codeKey = code.code.toString().trim().toUpperCase();
      
      if (masterUsageData[codeKey] && masterUsageData[codeKey].used) {
        // Only update if the status is different
        if (!code.used) {
          codes[i].used = true;
          codes[i].usedAt = masterUsageData[codeKey].usedAt || new Date().toISOString();
          updatedCount++;
        }
      }
    }
    
    // If any codes were updated, save the changes
    if (updatedCount > 0) {
      saveLocalCodes(codes);
      console.log(`Updated ${updatedCount} local codes from master usage data`);
    }
    
    return updatedCount;
  } catch (err) {
    console.error('Error updating local codes from master usage:', err);
    return 0;
  }
};

// Function to sync our current data to Firebase upon initialization
const syncCurrentDataToFirebase = async () => {
  try {
    // Import Firebase functions
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, set, get, child } = await import('firebase/database');
    
    // Get current master usage data
    const masterUsageData = getAllGloballyUsedCodes();
    
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyDltP_6QMX-9h5X7Z8Q7xSW1X5M4iV8sHo",
      authDomain: "codesync-demo.firebaseapp.com",
      projectId: "codesync-demo",
      storageBucket: "codesync-demo.appspot.com",
      messagingSenderId: "432019689101",
      appId: "1:432019689101:web:7d8cfe0c1a77d15b4c6f83",
      databaseURL: "https://codesync-demo-default-rtdb.firebaseio.com"
    };
    
    console.log('Syncing to Firebase using URL:', firebaseConfig.databaseURL);
    
    // Initialize Firebase if needed
    let app;
    try {
      app = initializeApp(firebaseConfig);
    } catch (initError) {
      console.log('Firebase already initialized for sync, reusing instance');
    }
    
    // Get database reference
    const database = getDatabase();
    const dbRef = ref(database);
    
    // Sync to Firebase if we have any data
    if (Object.keys(masterUsageData).length > 0) {
      try {
        // First get existing Firebase data
        const snapshot = await get(child(dbRef, 'master_usage'));
        
        if (snapshot.exists()) {
          // Merge with existing data, giving priority to Firebase data
          const existingData = snapshot.val();
          const mergedData = { ...masterUsageData, ...existingData };
          
          // Write merged data back to Firebase
          const usageRef = ref(database, 'master_usage');
          await set(usageRef, mergedData);
          console.log('Synced merged usage data to Firebase');
        } else {
          // No existing data, just write our data
          const usageRef = ref(database, 'master_usage');
          await set(usageRef, masterUsageData);
          console.log('Synced new usage data to Firebase');
        }
      } catch (masterUsageError) {
        console.error('Error syncing master usage:', masterUsageError);
        // Continue to try to update timestamp
      }
    }
    
    // Update the global timestamp
    try {
      const timestampRef = ref(database, 'last_sync');
      await set(timestampRef, {
        timestamp: new Date().toISOString(),
        source: 'device_' + Math.floor(Math.random() * 1000000)
      });
      console.log('Updated Firebase sync timestamp');
    } catch (timestampError) {
      console.error('Error updating sync timestamp:', timestampError);
    }
    
    return true;
  } catch (err) {
    console.error('Error syncing current data to Firebase:', err);
    return false;
  }
};

// Export the broadcast channel for components to listen to
export const getCodeSyncChannel = () => broadcastChannel;

// Function to setup a listener for broadcast channel events
export const setupBroadcastListener = (callback) => {
  if (!broadcastChannel) {
    console.error('BroadcastChannel not available');
    return false;
  }
  
  try {
    // Add event listener
    broadcastChannel.onmessage = (event) => {
      console.log('Received broadcast message:', event.data);
      
      // Execute callback with event data
      if (callback && typeof callback === 'function') {
        callback(event.data);
      }
    };
    
    console.log('Broadcast listener set up successfully');
    return true;
  } catch (err) {
    console.error('Error setting up broadcast listener:', err);
    return false;
  }
};

// Function to add a predefined code to the system
export const addPredefinedCode = (codeValue) => {
  try {
    const codes = getLocalCodes();
    
    // Standardize the code
    const standardizedCode = {
      id: codes.length > 0 ? Math.max(...codes.map(c => c.id)) + 1 : 1,
      code: codeValue.toString().trim().toUpperCase(),
      used: false,
      generatedAt: new Date().toISOString(),
      usedAt: null
    };
    
    // Check if code already exists (case insensitive)
    if (!codes.some(c => c.code === standardizedCode.code)) {
      codes.push(standardizedCode);
      saveLocalCodes(codes);
      console.log(`Predefined code "${standardizedCode.code}" added to the system.`);
      return true;
    } else {
      console.log(`Code "${standardizedCode.code}" already exists in the system.`);
      return false;
    }
  } catch (err) {
    console.error('Error adding predefined code:', err);
    return false;
  }
};

// Initialize with predefined codes
// Add your desired codes here
(() => {
  // IMPORTANT: Add your codes here
  const predefinedCodes = [
    "HELLO", // Example code
    "ABCDE",  // Example code
    "DEMO1",   // Example code
    "DEMO4",
  ];
  
  // Add each code
  predefinedCodes.forEach(code => {
    addPredefinedCode(code);
  });
})();

// NEW SOLUTION: LOCAL STORAGE EXPIRATION WORKAROUND
// Create a key that is less likely to be expired
const MASTER_USAGE_KEY = '__code_usage_master_v1';

// Function to mark a code as used in global context
export const markCodeAsUsedGlobally = (codeValue) => {
  try {
    // First, normalize the code
    const normalizedCode = codeValue.toString().trim().toUpperCase();
    
    // Get current usage data
    let usageData = {};
    try {
      const storedData = localStorage.getItem(MASTER_USAGE_KEY);
      if (storedData) {
        usageData = JSON.parse(storedData);
      }
    } catch (err) {
      console.error('Error reading usage data:', err);
      usageData = {};
    }
    
    // Mark the code as used
    usageData[normalizedCode] = {
      used: true,
      usedAt: new Date().toISOString()
    };
    
    // Save back to localStorage
    localStorage.setItem(MASTER_USAGE_KEY, JSON.stringify(usageData));
    console.log(`Marked code ${normalizedCode} as used globally`);
    
    // Update normal storage too
    updateCodeStatusInAllStorages(normalizedCode, true);
    
    // Force immediate sync to Firebase to ensure cross-device updates
    syncToFirebase('CODE_USED_GLOBALLY', {
      code: normalizedCode,
      usedAt: usageData[normalizedCode].usedAt
    });
    
    // Attempt to sync immediately to Firebase (fallback)
    try {
      import('./firebaseConfig').then(firebaseModule => {
        if (firebaseModule && firebaseModule.syncCodesNow) {
          console.log('Triggering immediate Firebase sync for code usage');
          firebaseModule.syncCodesNow();
        }
      }).catch(err => {
        console.error('Error importing firebase config for sync:', err);
      });
    } catch (err) {
      console.error('Error during fallback Firebase sync:', err);
    }
    
    return true;
  } catch (err) {
    console.error('Error marking code as used globally:', err);
    return false;
  }
};

// Function to check if a code is used globally
export const isCodeUsedGlobally = (codeValue) => {
  try {
    // Normalize the code
    const normalizedCode = codeValue.toString().trim().toUpperCase();
    
    // Get current usage data
    let usageData = {};
    try {
      const storedData = localStorage.getItem(MASTER_USAGE_KEY);
      if (storedData) {
        usageData = JSON.parse(storedData);
      }
    } catch (err) {
      console.error('Error reading usage data:', err);
      return false; // Default to not used if error
    }
    
    // Check if code is marked as used
    return usageData[normalizedCode] && usageData[normalizedCode].used === true;
  } catch (err) {
    console.error('Error checking if code is used globally:', err);
    return false;
  }
};

// Function to update code status in all storage locations
const updateCodeStatusInAllStorages = (codeValue, isUsed) => {
  try {
    // Update in main storage
    updateCodeStatus(codeValue, isUsed);
    
    // Update sync timestamp
    updateSyncTimestamp();
    
    return true;
  } catch (err) {
    console.error('Error updating code status in all storages:', err);
    return false;
  }
};

// NEW: Regular polling system for cross-device synchronization
let pollingSyncInterval = null;

// Function to start the polling for code sync
export const startPollingSync = (callback, interval = 3000) => {
  // Clear any existing interval to avoid duplicates
  if (pollingSyncInterval) {
    clearInterval(pollingSyncInterval);
  }
  
  // Set last sync check timestamp
  let lastSyncCheck = getSyncTimestamp();
  console.log('Starting polling sync with initial timestamp:', lastSyncCheck);
  
  // Create new interval
  pollingSyncInterval = setInterval(() => {
    if (isSyncNeeded(lastSyncCheck)) {
      console.log('Sync needed during polling - refreshing data');
      
      // Update last sync check timestamp
      lastSyncCheck = getSyncTimestamp();
      
      // Execute callback to refresh data
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  }, interval);
  
  console.log(`Polling sync started with ${interval}ms interval`);
  return true;
};

// Function to stop polling
export const stopPollingSync = () => {
  if (pollingSyncInterval) {
    clearInterval(pollingSyncInterval);
    pollingSyncInterval = null;
    console.log('Polling sync stopped');
    return true;
  }
  console.log('No polling interval to stop');
  return false;
};

// Function to get all used codes from the global context
export const getAllGloballyUsedCodes = () => {
  try {
    const storedData = localStorage.getItem(MASTER_USAGE_KEY);
    if (!storedData) {
      return {};
    }
    
    return JSON.parse(storedData);
  } catch (err) {
    console.error('Error retrieving globally used codes:', err);
    return {};
  }
}; 