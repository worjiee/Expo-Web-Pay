#!/bin/bash
# Install dependencies
npm install

# Navigate to client directory and install dependencies
cd client
npm install --legacy-peer-deps

# Build the React app
npm run build

# Return to root directory
cd ..

# Success message
echo "Build completed successfully!" 