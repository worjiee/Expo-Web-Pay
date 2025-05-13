// Script to clear all codes from localStorage
localStorage.setItem('mockDb_codes', JSON.stringify([]));
console.log('All codes have been deleted from localStorage');

// Also update the sync timestamp to trigger updates on other devices
const syncTimestamp = new Date().toISOString();
localStorage.setItem('code_sync_timestamp', syncTimestamp);
console.log('Updated sync timestamp:', syncTimestamp);

// Clear any globally used codes
localStorage.setItem('__code_usage_master_v1', JSON.stringify({}));
console.log('Cleared global code usage data');

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