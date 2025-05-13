const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Debug environment variables
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://websitepay.netlify.app', // Netlify frontend
  'https://q-i0ht56yjx-karls-projects-fccc69ea.vercel.app',
  'https://q-9054i8g05-karls-projects-fccc69ea.vercel.app',
  'https://q-1kzok5ant-karls-projects-fccc69ea.vercel.app',
  'https://q-9akefatbs-karls-projects-fccc69ea.vercel.app',
  'https://q-leusj58a0-karls-projects-fccc69ea.vercel.app',
  'https://q-6ydvy55pp-karls-projects-fccc69ea.vercel.app',
  'https://q-c017aojit-karls-projects-fccc69ea.vercel.app',
  'https://q-p45ykiz98-karls-projects-fccc69ea.vercel.app'
];

// Enable CORS for specific origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log unknown origins but still allow them for now
      console.log('Request from unknown origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Add CORS headers to all responses explicitly
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// API Routes - Define these before static files
app.use('/api/auth', require('./routes/auth'));
app.use('/api/codes', require('./routes/codes'));

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API is operational', 
    timestamp: new Date(),
    env: process.env.NODE_ENV,
    mongodb: !!process.env.MONGODB_URI,
    jwt: !!process.env.JWT_SECRET
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// API server only - remove static file serving
app.get('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 