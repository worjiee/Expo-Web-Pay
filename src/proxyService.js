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
    // We're completely disabling the force_empty restriction
    // to ensure codes are always properly retrieved
    localStorage.removeItem('codes_force_empty');
    
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
    // We're completely disabling the force_empty restriction
    // to ensure codes are always properly saved
    localStorage.removeItem('codes_force_empty');
    
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
  } catch (err) {
    console.error('Error broadcasting code changes:', err);
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
// DISABLED - No more automatic code initialization
/* 
(() => {
  // Empty predefined codes array - no default codes
  const predefinedCodes = [];
  
  // Add each code
  predefinedCodes.forEach(code => {
    addPredefinedCode(code);
  });
})();
*/

// Check for initialization flag to prevent re-adding codes
if (!localStorage.getItem('app_initialized')) {
  console.log('First app initialization - setting initialized flag');
  localStorage.setItem('app_initialized', 'true');
}

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
    
    // Broadcast the update to other tabs/windows
    broadcastCodeChanges('CODE_USED_GLOBALLY', {
      code: normalizedCode,
      usedAt: usageData[normalizedCode].usedAt
    });
    
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