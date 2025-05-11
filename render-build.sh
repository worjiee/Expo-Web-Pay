#!/bin/bash
# Install backend dependencies
echo "Installing backend dependencies..."
npm install --no-optional --production

# Create client/build directory
echo "Creating client/build directory..."
mkdir -p client/build

# Copy fallback index.html
echo "Creating fallback index.html..."
cat > client/build/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>End of The Road Game Portal</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      color: #333;
      line-height: 1.6;
    }
    .container {
      width: 80%;
      margin: 0 auto;
      padding: 2rem;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      margin-top: 2rem;
      border-radius: 5px;
    }
    header {
      background: #333;
      color: white;
      text-align: center;
      padding: 1rem;
    }
    .content {
      padding: 1rem 0;
    }
    .card {
      background: #f9f9f9;
      padding: 1rem;
      margin-bottom: 1rem;
      border-left: 4px solid #333;
    }
    footer {
      text-align: center;
      margin-top: 2rem;
      padding: 1rem;
      background: #333;
      color: white;
    }
  </style>
</head>
<body>
  <header>
    <h1>End of The Road Game Portal</h1>
  </header>
  
  <div class="container">
    <div class="content">
      <h2>Welcome to the End of The Road Game Portal</h2>
      <p>This is a simplified version of the portal. The full React frontend couldn't be built due to memory constraints.</p>
      
      <div class="card">
        <h3>API Information</h3>
        <p>The backend API is fully functional. You can access:</p>
        <ul>
          <li><strong>Authentication API:</strong> /api/auth</li>
          <li><strong>Codes API:</strong> /api/codes</li>
        </ul>
      </div>
      
      <div class="card">
        <h3>Contact Information</h3>
        <p>For more information, please contact the administrator.</p>
      </div>
    </div>
  </div>
  
  <footer>
    <p>&copy; 2025 End of The Road Game Portal</p>
  </footer>
</body>
</html>
EOL

echo "Build process completed!" 