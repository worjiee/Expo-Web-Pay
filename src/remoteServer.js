// Remote Server for cross-device code sharing
// Using our proxy service to avoid CORS issues
import { fetchRemoteData, updateRemoteData } from './proxyService';

// Add retries for better reliability
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

export const initServer = () => {
  console.log('Initializing remote server connection...');

  // Initial sync when app loads - pull codes from remote storage
  syncFromRemoteStorage();

  // Set up periodic sync every 15 seconds (more frequent than before)
  // This allows codes to propagate across devices without users needing to take action
  setInterval(() => {
    syncFromRemoteStorage();
  }, 15000);
};

// Helper function to add delay between retries
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to get codes from remote storage and merge with local codes
export const syncFromRemoteStorage = async (retryCount = 0) => {
  try {
    // Get codes from remote storage using our proxy service
    console.log('Attempting to sync from remote storage...');
    const remoteData = await fetchRemoteData();
    
    if (!remoteData || !Array.isArray(remoteData)) {
      console.error('Invalid response format from remote storage');
      return;
    }

    console.log(`Retrieved ${remoteData.length} codes from remote storage`);

    // Get local codes
    let localCodes = [];
    try {
      const storedCodes = localStorage.getItem('mockDb_codes');
      localCodes = storedCodes ? JSON.parse(storedCodes) : [];
    } catch (err) {
      console.error('Error loading local codes:', err);
      localCodes = [];
    }

    // Merge remote codes with local codes with improved case-insensitive comparison
    let updated = false;
    const mergedCodes = [...localCodes];

    // First process remote codes that don't exist locally
    for (const remoteCode of remoteData) {
      // Use case-insensitive comparison
      const existingCodeIndex = localCodes.findIndex(c => 
        c.code.toLowerCase() === remoteCode.code.toLowerCase()
      );
      
      if (existingCodeIndex === -1) {
        // Code doesn't exist locally, add it
        console.log(`Adding new code from remote: ${remoteCode.code}`);
        mergedCodes.push(remoteCode);
        updated = true;
      } else {
        // Code exists - check if remote status is different
        const existingCode = localCodes[existingCodeIndex];
        
        // If remote is used but local is not, update local to match (or vice versa)
        if (remoteCode.used !== existingCode.used) {
          console.log(`Updating code status for ${remoteCode.code} to ${remoteCode.used ? 'used' : 'unused'}`);
          mergedCodes[existingCodeIndex] = {
            ...existingCode,
            used: remoteCode.used,
            usedAt: remoteCode.usedAt || existingCode.usedAt
          };
          updated = true;
        }
      }
    }

    // Update localStorage if we made changes
    if (updated) {
      console.log('Synced codes from remote storage');
      localStorage.setItem('mockDb_codes', JSON.stringify(mergedCodes));
    }

    return mergedCodes;
  } catch (err) {
    console.error('Error syncing from remote storage:', err);
    
    // Implement retry logic for more resilience
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying remote sync (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
      await delay(RETRY_DELAY);
      return syncFromRemoteStorage(retryCount + 1);
    }
    
    return null;
  }
};

// Function to send local codes to remote storage
export const syncToRemoteStorage = async (retryCount = 0) => {
  try {
    // Get local codes
    const storedCodes = localStorage.getItem('mockDb_codes');
    if (!storedCodes) {
      console.log('No local codes to sync');
      return;
    }

    const localCodes = JSON.parse(storedCodes);
    console.log(`Syncing ${localCodes.length} codes to remote storage`);
    
    // Update remote storage using our proxy service
    const result = await updateRemoteData(localCodes);

    if (!result.success) {
      throw new Error(`Failed to update remote storage: ${result.message}`);
    }

    console.log('Successfully synced codes to remote storage');
    return true;
  } catch (err) {
    console.error('Error syncing to remote storage:', err);
    
    // Implement retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying remote sync (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
      await delay(RETRY_DELAY);
      return syncToRemoteStorage(retryCount + 1);
    }
    
    return false;
  }
};

// Function to add a new code to both local and remote storage
export const addCodeToStorage = async (newCode) => {
  try {
    console.log(`Adding code to storage: ${newCode.code}`);
    // Add to local storage first
    let localCodes = [];
    try {
      const storedCodes = localStorage.getItem('mockDb_codes');
      localCodes = storedCodes ? JSON.parse(storedCodes) : [];
    } catch (err) {
      console.error('Error loading local codes:', err);
      localCodes = [];
    }

    // Case-insensitive check if code already exists
    if (!localCodes.some(c => c.code.toLowerCase() === newCode.code.toLowerCase())) {
      // Ensure code is uppercase for consistency
      newCode.code = newCode.code.toUpperCase();
      localCodes.push(newCode);
      localStorage.setItem('mockDb_codes', JSON.stringify(localCodes));
      console.log(`Added code ${newCode.code} to local storage`);
      
      // Sync with proxy service
      await updateRemoteData(localCodes);
    } else {
      console.log(`Code ${newCode.code} already exists in local storage`);
    }
    
    return true;
  } catch (err) {
    console.error('Error adding code to storage:', err);
    return false;
  }
};

// Function to update code status (used/unused)
export const updateCodeStatus = async (code, isUsed) => {
  try {
    console.log(`Updating code status: ${code} to ${isUsed ? 'used' : 'unused'}`);
    // Update in local storage first
    let localCodes = [];
    try {
      const storedCodes = localStorage.getItem('mockDb_codes');
      localCodes = storedCodes ? JSON.parse(storedCodes) : [];
    } catch (err) {
      console.error('Error loading local codes:', err);
      localCodes = [];
    }

    // Case-insensitive find of the code
    const codeIndex = localCodes.findIndex(c => 
      c.code.toLowerCase() === code.toLowerCase()
    );
    
    if (codeIndex !== -1) {
      localCodes[codeIndex].used = isUsed;
      localCodes[codeIndex].usedAt = isUsed ? new Date().toISOString() : null;
      localStorage.setItem('mockDb_codes', JSON.stringify(localCodes));
      console.log(`Updated code ${code} status in local storage`);
      
      // Sync with proxy service
      await updateRemoteData(localCodes);
    } else {
      console.warn(`Could not find code ${code} to update status`);
    }
    
    return true;
  } catch (err) {
    console.error('Error updating code status:', err);
    return false;
  }
}; 