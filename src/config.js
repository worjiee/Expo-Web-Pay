// Configuration file for API URLs

// Use the latest backend API URL directly
const API_URL = 'https://q-o6boqvomj-karls-projects-fccc69ea.vercel.app/api';

// Force the use of real API for code verification to ensure cross-device compatibility
// But allow fallback to mock API for admin functions when the API is unreachable
const FORCE_REAL_API = true;
const ALLOW_ADMIN_FALLBACK = true;

// Log the API URL
console.log('Using API URL:', API_URL);
console.log('Force real API:', FORCE_REAL_API ? 'Yes' : 'No');
console.log('Allow admin fallback:', ALLOW_ADMIN_FALLBACK ? 'Yes' : 'No');

// Export as a named constant to avoid ESLint warnings
const config = {
  API_URL,
  FORCE_REAL_API,
  ALLOW_ADMIN_FALLBACK
};

export default config; 