#!/bin/bash

echo "🚀 Building CleanCare Pro for Render deployment..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Build frontend for production
echo "🏗️ Building frontend..."
npm run build

echo "✅ Build completed successfully!"
