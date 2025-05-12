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
    
    // Allow all origins for now while debugging - we'll log them for monitoring
    console.log('Request origin:', origin);
    callback(null, true);
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

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, 'client/build');
app.use(express.static(clientBuildPath));
console.log(`Serving static files from: ${clientBuildPath}`);

// The "catchall" handler for any request that doesn't match one above
// Send back React's index.html file
app.get('*', (req, res) => {
  const indexPath = path.join(clientBuildPath, 'index.html');
  console.log(`Serving index.html for path: ${req.path}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`index.html not found at ${indexPath}`);
    res.status(200).send(`
      <html>
        <head>
          <title>WebsitePay API</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .box { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>WebsitePay API Server</h1>
            <div class="box">
              <p>This is the API server for WebsitePay.</p>
              <p>The frontend is hosted at: <a href="https://q-p45ykiz98-karls-projects-fccc69ea.vercel.app">https://q-p45ykiz98-karls-projects-fccc69ea.vercel.app</a></p>
              <p>API endpoints available:</p>
              <ul>
                <li><code>/api/status</code> - Check API status</li>
                <li><code>/api/auth</code> - Authentication endpoints</li>
                <li><code>/api/codes</code> - Code management endpoints</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 