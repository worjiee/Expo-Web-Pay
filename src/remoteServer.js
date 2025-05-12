// Remote Server for cross-device code sharing using localStorage
// This file handles the synchronization of codes between the browser storage
// and provides functions to manage codes without external API dependencies

import { getLocalCodes, saveLocalCodes, exportCodesAsText, importCodesFromText } from './proxyService';

// Add retries for better reliability
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

// Initialize the remote server connection
export const initServer = () => {
  console.log('Initializing remote server connection (localStorage only)...');

  // Initial sync when app loads
  syncFromRemoteStorage();

  // Set up periodic sync every 15 seconds for local-only storage
  // This keeps the app responsive to changes in localStorage from other components
  setInterval(() => {
    syncFromRemoteStorage();
  }, 15000);
};

// Helper function to add delay between retries
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to add a new code to local storage
export const addCodeToStorage = async (newCode) => {
  try {
    console.log(`Adding code to storage: ${newCode.code}`);
    
    // Get current codes from localStorage
    const localCodes = getLocalCodes();

    // Case-insensitive check if code already exists
    if (!localCodes.some(c => c.code.toUpperCase() === newCode.code.toUpperCase())) {
      // Ensure code is uppercase for consistency
      newCode.code = newCode.code.toUpperCase();
      localCodes.push(newCode);
      
      // Save back to localStorage
      saveLocalCodes(localCodes);
      
      console.log(`Code ${newCode.code} added to local storage`);
      return true;
    } else {
      console.log(`Code ${newCode.code} already exists in storage`);
      return false;
    }
  } catch (err) {
    console.error('Error adding code to storage:', err);
    return false;
  }
};

// Function to sync data from remote storage to local storage
export const syncFromRemoteStorage = async () => {
  try {
    // In this local-only approach, we're just getting the local codes
    // This function is kept for API compatibility with the rest of the app
    const localCodes = getLocalCodes();
    console.log(`Retrieved ${localCodes.length} codes from local storage proxy`);
    
    return localCodes;
  } catch (err) {
    console.error('Error syncing from remote storage:', err);
    return [];
  }
};

// Function to update a code's status
export const updateCodeStatus = async (code, isUsed = true) => {
  try {
    console.log(`Updating code status: ${code} to ${isUsed ? 'used' : 'unused'}`);
    
    // Get current codes
    const localCodes = getLocalCodes();
    
    // Find code by ID or code string
    const codeObj = typeof code === 'string' 
      ? localCodes.find(c => c.code.toUpperCase() === code.toUpperCase())
      : localCodes.find(c => c.id === code);
    
    if (!codeObj) {
      console.log(`Code not found: ${code}`);
      return false;
    }
    
    // Update code status
    codeObj.used = isUsed;
    codeObj.usedAt = isUsed ? new Date().toISOString() : null;
    
    // Save back to localStorage
    saveLocalCodes(localCodes);
    
    console.log(`Code ${codeObj.code} status updated to ${isUsed ? 'used' : 'unused'}`);
    return true;
  } catch (err) {
    console.error('Error updating code status:', err);
    return false;
  }
};

// Generate export link for sharing codes between devices
export const generateSharingLink = () => {
  try {
    // Get all unused codes
    const localCodes = getLocalCodes();
    const unusedCodes = localCodes.filter(code => !code.used);
    
    if (unusedCodes.length === 0) {
      console.log('No unused codes to share');
      return null;
    }
    
    // Generate base64 encoded data
    const exportData = exportCodesAsText(unusedCodes);
    
    // In a real app, you might want to create a temporary URL or use a URL shortener
    // For this demo, we'll just return the base64 string directly
    return exportData;
  } catch (err) {
    console.error('Error generating sharing link:', err);
    return null;
  }
};

// Import codes from a sharing link
export const importFromSharingLink = (encodedData) => {
  try {
    if (!encodedData) {
      console.log('No data to import');
      return { success: false, message: 'No data to import' };
    }
    
    // Import the codes
    const result = importCodesFromText(encodedData);
    
    if (result.success) {
      console.log(`Imported ${result.newCodesAdded} new codes successfully`);
      return { 
        success: true, 
        message: `Imported ${result.newCodesAdded} new codes out of ${result.totalImported} total`
      };
    } else {
      console.error('Error importing codes:', result.error);
      return { success: false, message: result.error };
    }
  } catch (err) {
    console.error('Error importing from sharing link:', err);
    return { success: false, message: 'Error processing import data' };
  }
}; 