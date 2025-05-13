// Script to clear all codes from localStorage
localStorage.setItem('mockDb_codes', JSON.stringify([]));
console.log('All codes have been deleted from localStorage');

// Also update the sync timestamp to trigger updates on other devices
const syncTimestamp = new Date().toISOString();
localStorage.setItem('code_sync_timestamp', syncTimestamp);
console.log('Updated sync timestamp:', syncTimestamp);

// Set a deletion timestamp to prevent automatic reloading of codes
localStorage.setItem('codes_last_deleted', new Date().getTime().toString());
console.log('Set deletion timestamp to prevent code reappearance');

// Clear any globally used codes
localStorage.setItem('__code_usage_master_v1', JSON.stringify({}));
console.log('Cleared global code usage data');

// Remove any other possible code storage locations
localStorage.removeItem('predefined_codes');
localStorage.removeItem('cached_codes');
localStorage.removeItem('app_codes');
localStorage.removeItem('backup_codes');
console.log('Removed additional potential code storage');

// Clear any remaining initialization flags
localStorage.removeItem('app_initialized');
localStorage.removeItem('codes_force_empty');
localStorage.removeItem('user_initiated_save');
console.log('Reset all initialization flags');

// Try to broadcast the update if possible
try {
  const broadcastChannel = new BroadcastChannel('codes_sync_channel');
  broadcastChannel.postMessage({
    action: 'CODES_UPDATED',
    data: { count: 0 },
    timestamp: new Date().toISOString()
  });
  console.log('Broadcast sent to other tabs about code deletion');
} catch (err) {
  console.warn('Could not broadcast update:', err);
}

console.log('OPERATION COMPLETE: All codes have been deleted from the system'); 