#!/bin/bash

# 🚀 CleanCare Laundry App Deployment Script

echo "🧹 CleanCare Laundry App - Production Deployment"
echo "================================================="

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "🔧 Installing backend dependencies..."
cd server
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed!"
else
    echo "❌ Backend dependency installation failed!"
    exit 1
fi

cd ..

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy backend to Railway/Render/Heroku"
echo "2. Deploy frontend to Vercel/Netlify"
echo "3. Update VITE_API_BASE_URL with backend URL"
echo "4. Test the deployed application"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"
