#!/bin/bash
# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Navigate to client directory
echo "Navigating to client directory..."
cd client

# Install frontend dependencies with legacy peer deps to avoid conflicts
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Build the React app
echo "Building React app..."
npm run build

# Return to root directory
echo "Returning to root directory..."
cd ..

# Success message
echo "Build completed successfully!" 