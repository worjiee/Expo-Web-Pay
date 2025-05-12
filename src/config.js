// Configuration file for API URLs

// API URL configuration - includes primary and backup URLs for resilience
const PRIMARY_API_URL = 'https://q-o6boqvomj-karls-projects-fccc69ea.vercel.app/api';
const BACKUP_API_URL = 'https://q-o6boqvomj-karls-projects-fccc69ea.vercel.app/api'; // Same URL as backup for now

// Force the use of real API for code verification to ensure cross-device compatibility
// But allow fallback to mock API for admin functions when the API is unreachable
const FORCE_REAL_API = true;
const ALLOW_ADMIN_FALLBACK = true;
const ALLOW_PUBLIC_FALLBACK = false; // Don't allow mock API for public code verification

// For code verification, set a longer timeout to handle slower connections on mobile devices
const CODE_VERIFICATION_TIMEOUT = 20000; // 20 seconds

// Log configuration
console.log('Primary API URL:', PRIMARY_API_URL);
console.log('Backup API URL:', BACKUP_API_URL);
console.log('Force real API:', FORCE_REAL_API ? 'Yes' : 'No');
console.log('Allow admin fallback:', ALLOW_ADMIN_FALLBACK ? 'Yes' : 'No');
console.log('Code verification timeout:', CODE_VERIFICATION_TIMEOUT + 'ms');

// Export as a named constant to avoid ESLint warnings
const config = {
  API_URL: PRIMARY_API_URL,
  BACKUP_API_URL,
  FORCE_REAL_API,
  ALLOW_ADMIN_FALLBACK,
  ALLOW_PUBLIC_FALLBACK,
  CODE_VERIFICATION_TIMEOUT
};

export default config; 