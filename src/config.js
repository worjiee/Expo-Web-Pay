// Configuration file for API URLs

// API URL configuration - includes primary and backup URLs for resilience
const PRIMARY_API_URL = 'https://q-o6boqvomj-karls-projects-fccc69ea.vercel.app/api';
// Use a different URL variant for backup to increase chances of one working
const BACKUP_API_URL = 'https://q-2s9hee5w0-karls-projects-fccc69ea.vercel.app/api';

// Force the use of mock API to avoid CORS issues on mobile devices
// This is a temporary solution to make the app work on all devices
const FORCE_REAL_API = false; // Set to false to use mock API
const ALLOW_ADMIN_FALLBACK = true;
const ALLOW_PUBLIC_FALLBACK = true; // Allow mock API for public code verification when all APIs fail

// Always enable Firebase sync for automatic cross-device code sharing
const AUTO_ENABLE_FIREBASE_SYNC = true;

// For code verification, set a longer timeout to handle slower connections on mobile devices
const CODE_VERIFICATION_TIMEOUT = 30000; // 30 seconds for mobile connections

// Log configuration
console.log('Primary API URL:', PRIMARY_API_URL);
console.log('Backup API URL:', BACKUP_API_URL);
console.log('Force real API:', FORCE_REAL_API ? 'Yes' : 'No');
console.log('Allow admin fallback:', ALLOW_ADMIN_FALLBACK ? 'Yes' : 'No');
console.log('Allow public fallback:', ALLOW_PUBLIC_FALLBACK ? 'Yes' : 'No');
console.log('Auto-enable Firebase sync:', AUTO_ENABLE_FIREBASE_SYNC ? 'Yes' : 'No');
console.log('Code verification timeout:', CODE_VERIFICATION_TIMEOUT + 'ms');

// Export as a named constant to avoid ESLint warnings
const config = {
  API_URL: PRIMARY_API_URL,
  BACKUP_API_URL,
  FORCE_REAL_API,
  ALLOW_ADMIN_FALLBACK,
  ALLOW_PUBLIC_FALLBACK,
  AUTO_ENABLE_FIREBASE_SYNC,
  CODE_VERIFICATION_TIMEOUT
};

export default config; 