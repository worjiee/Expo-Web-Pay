// Configuration file for API URLs

// Use the latest backend API URL directly
const API_URL = 'https://q-o6boqvomj-karls-projects-fccc69ea.vercel.app/api';

// Allow local mockAPI to handle logins when API is unavailable
const FORCE_REAL_API = false;

// Log the API URL
console.log('Using API URL:', API_URL);
console.log('Force real API:', FORCE_REAL_API ? 'Yes' : 'No');

// Export as a named constant to avoid ESLint warnings
const config = {
  API_URL,
  FORCE_REAL_API
};

export default config; 