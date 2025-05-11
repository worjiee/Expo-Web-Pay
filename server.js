const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/codes', require('./routes/codes'));

// Create a fallback HTML page if client/build/index.html doesn't exist
const buildPath = path.join(__dirname, 'client/build');
const indexPath = path.join(buildPath, 'index.html');

if (!fs.existsSync(buildPath)) {
  console.log('Build directory not found, creating it');
  fs.mkdirSync(buildPath, { recursive: true });
}

if (!fs.existsSync(indexPath)) {
  console.log('Creating fallback index.html');
  const fallbackHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>End of The Road Game Portal</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
        }
        .container {
          max-width: 800px;
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
        }
        .api-link {
          margin-top: 20px;
          padding: 10px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>End of The Road Game Portal</h1>
        <p>Welcome to the End of The Road Game Portal. The frontend build files are not available, but the API is working.</p>
        <div class="api-link">
          <p>You can access the API at: <code>/api/auth</code> and <code>/api/codes</code></p>
        </div>
      </div>
    </body>
    </html>
  `;
  fs.writeFileSync(indexPath, fallbackHTML);
}

// Serve static assets
console.log('Serving static files from:', buildPath);
app.use(express.static(buildPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 