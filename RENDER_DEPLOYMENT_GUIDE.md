# 🚀 Complete Guide to Deploy CleanCare Pro on Render

This guide will walk you through deploying your CleanCare Pro application on Render, including troubleshooting the "Local Mode" indicator that appears when the backend is not properly connected.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Understanding "Local Mode"](#understanding-local-mode)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Render Deployment Steps](#render-deployment-steps)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## 📊 Project Overview

CleanCare Pro is a multi-service application consisting of:

- **Frontend**: React/Vite application with TypeScript
- **Backend**: Node.js/Express API server with MongoDB
- **Authentication**: Multiple auth methods (SMS, WhatsApp, email)
- **Real-time Features**: Location tracking, booking management
- **Additional Services**: Rider authentication service (Next.js)

### Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (Static)      │───▶│   (Web Service) │───▶│   (External)    │
│   Port: 443     │    │   Port: 10000   │    │   Cloud Atlas   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## ⚠️ Understanding "Local Mode"

### What is "Local Mode"?

When you see "Local Mode" in the top-right corner of your application, it indicates that:

1. **Frontend is running** ✅
2. **Backend API is not accessible** ❌

### Why Does This Happen?

The "Local Mode" indicator appears when:

```javascript
// ConnectionStatus.tsx checks backend health
const response = await fetch("/api/health", {
  signal: controller.signal,
  method: "GET",
});

// If this fails, it shows "Local Mode"
if (backendStatus === "offline") {
  return {
    icon: CloudOff,
    text: "Local Mode",
    color: "bg-yellow-100 text-yellow-800",
    description: "Data saved locally",
  };
}
```

### Common Causes:

1. **Backend service not deployed**
2. **Wrong API URL configuration**
3. **Environment variables not set**
4. **CORS issues**
5. **Database connection failures**
6. **Port/networking problems**

---

## 🔧 Prerequisites

### Required Accounts & Services

1. **Render Account**: [render.com](https://render.com)
2. **MongoDB Atlas**: [mongodb.com](https://cloud.mongodb.com)
3. **GitHub Repository**: Your code must be in a Git repository
4. **Domain (Optional)**: For custom domain setup

### Required API Keys

1. **MongoDB Connection String**
2. **Google Maps API Key** (optional)
3. **DVHosting SMS API Key** (for SMS auth)
4. **Fast2SMS API Key** (for SMS auth)
5. **JWT Secret** (generate a secure random string)

---

## 🌍 Environment Setup

### 1. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

### 2. Environment Variables

#### Backend Environment Variables

Create these in Render's environment variables section:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cleancare_pro?retryWrites=true&w=majority
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_CLUSTER=your_cluster.mongodb.net
MONGODB_DATABASE=cleancare_pro

# Server Configuration
NODE_ENV=production
PORT=10000
JWT_SECRET=your_32_character_random_secret_key_here

# SMS Configuration (Optional)
DVHOSTING_API_KEY=your_dvhosting_api_key
FAST2SMS_API_KEY=your_fast2sms_api_key

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-app.onrender.com
```

#### Frontend Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend-app.onrender.com/api

# Optional APIs
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_DVHOSTING_API_KEY=your_dvhosting_api_key

# App Configuration
VITE_APP_NAME=CleanCare Pro
VITE_APP_URL=https://your-frontend-app.onrender.com
```

---

## 🚀 Render Deployment Steps

### Method 1: Using render.yaml (Recommended)

1. **Update render.yaml**: Your project already has a `render.yaml` file. Update it with your service names:

```yaml
services:
  # Backend API Service
  - type: web
    name: cleancare-pro-api
    env: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && NODE_ENV=production node server-laundry.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      # Add your environment variables here

  # Frontend Static Site
  - type: static_site
    name: cleancare-pro-frontend
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://cleancare-pro-api.onrender.com/api
```

2. **Deploy to Render**:
   - Connect your GitHub repository to Render
   - Render will automatically detect the `render.yaml` file
   - Configure environment variables in the Render dashboard

### Method 2: Manual Service Creation

#### Step 1: Deploy Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   ```
   Name: cleancare-pro-api
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && NODE_ENV=production node server-laundry.js
   ```
5. Add environment variables from the list above
6. Deploy

#### Step 2: Deploy Frontend Service

1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   ```
   Name: cleancare-pro-frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
4. Add frontend environment variables
5. Deploy

### Step 3: Update API URLs

Once your backend is deployed, update the frontend environment variable:

```bash
VITE_API_BASE_URL=https://YOUR_BACKEND_SERVICE_NAME.onrender.com/api
```

---

## ⚙️ Post-Deployment Configuration

### 1. Update CORS Settings

Ensure your backend allows requests from your frontend domain:

```javascript
// backend/server-laundry.js
const allowedOrigins = [
  "https://your-frontend-app.onrender.com",
  "https://cleancare-pro-frontend.onrender.com", // Update this
];
```

### 2. Database Initialization

Your backend automatically handles database setup, but you can verify:

1. Check backend logs for MongoDB connection
2. Test API endpoints:
   ```bash
   curl https://your-backend-app.onrender.com/api/health
   ```

### 3. Test Connection

Visit your frontend URL and check:

- No "Local Mode" indicator should appear
- Try creating an account/booking
- Check browser Network tab for successful API calls

---

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. "Local Mode" Still Showing

**Symptoms**: Frontend loads but shows "Local Mode" indicator

**Solutions**:

1. Check backend service is running:

   ```bash
   curl https://your-backend-app.onrender.com/api/health
   ```

2. Verify frontend API URL:

   ```bash
   # Should match your backend service URL
   echo $VITE_API_BASE_URL
   ```

3. Check browser console for CORS errors

4. Verify environment variables in Render dashboard

#### 2. Backend Service Won't Start

**Symptoms**: Backend service shows "Deploy failed" or keeps restarting

**Solutions**:

1. Check build logs in Render dashboard
2. Verify MongoDB connection string
3. Ensure all required environment variables are set
4. Check for Node.js version compatibility

#### 3. Database Connection Issues

**Symptoms**: Backend starts but can't connect to MongoDB

**Solutions**:

1. Verify MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
2. Check connection string format
3. Verify database user permissions
4. Test connection string locally

#### 4. CORS Errors

**Symptoms**: Frontend can't reach backend APIs

**Solutions**:

1. Add frontend domain to `ALLOWED_ORIGINS`
2. Update CORS configuration in backend
3. Ensure domains match exactly (https vs http)

#### 5. Environment Variables Not Loading

**Symptoms**: App behavior suggests missing config

**Solutions**:

1. Verify variables are set in Render dashboard
2. Check variable names (case-sensitive)
3. Restart services after adding variables
4. Use Render's environment variable groups

### Debug Commands

```bash
# Test backend health
curl https://your-backend-app.onrender.com/api/health

# Test API endpoints
curl https://your-backend-app.onrender.com/api/test

# Check if CORS is configured
curl -H "Origin: https://your-frontend-app.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-backend-app.onrender.com/api/health
```

---

## 🚄 Performance Optimization

### Backend Optimizations

1. **Enable Compression**:

   ```javascript
   const compression = require("compression");
   app.use(compression());
   ```

2. **Database Indexing**:

   ```javascript
   // Add indexes for frequently queried fields
   userSchema.index({ email: 1 });
   bookingSchema.index({ userId: 1, createdAt: -1 });
   ```

3. **Caching Headers**:
   ```javascript
   app.use("/api", (req, res, next) => {
     res.set("Cache-Control", "no-cache");
     next();
   });
   ```

### Frontend Optimizations

1. **Bundle Analysis**:

   ```bash
   npm run build -- --analyze
   ```

2. **Asset Optimization**:
   - Use WebP images where possible
   - Implement lazy loading
   - Code splitting for routes

3. **Service Worker** (already implemented):
   ```javascript
   // public/sw.js provides offline capabilities
   ```

---

## 📊 Monitoring and Maintenance

### Health Monitoring

1. **Set up Render Health Checks**:
   - Path: `/api/health`
   - Expected response: 200 OK

2. **Monitor Logs**:

   ```bash
   # View backend logs
   render logs --service=cleancare-pro-api

   # View build logs
   render logs --service=cleancare-pro-api --type=build
   ```

### Uptime Monitoring

Consider using external services:

- **UptimeRobot**
- **Pingdom**
- **StatusCake**

Monitor these endpoints:

- Frontend: `https://your-app.onrender.com`
- Backend: `https://your-api.onrender.com/api/health`

### Database Monitoring

1. **MongoDB Atlas Dashboard**:
   - Monitor connection count
   - Track query performance
   - Set up alerts

2. **Application Metrics**:
   - Response times
   - Error rates
   - User registrations
   - Booking completion rates

---

## 🔐 Security Considerations

### Environment Variables Security

1. **Never commit secrets to Git**
2. **Use Render's environment variable groups**
3. **Rotate API keys regularly**
4. **Use strong JWT secrets**

### HTTPS & Domains

1. **Render provides SSL certificates automatically**
2. **Use custom domains for production**
3. **Implement HSTS headers**

### Rate Limiting

Already implemented in your backend:

```javascript
const rateLimit = require("express-rate-limit");
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
```

---

## 🎯 Final Checklist

Before going live, ensure:

- [ ] Backend service deploys successfully
- [ ] Frontend builds and deploys
- [ ] Database connection works
- [ ] "Local Mode" indicator is gone
- [ ] All API endpoints respond correctly
- [ ] SMS/Authentication flows work
- [ ] Error handling works properly
- [ ] Mobile responsiveness tested
- [ ] Performance is acceptable
- [ ] Monitoring is set up

---

## 📞 Support Resources

### Render Documentation

- [Render Docs](https://render.com/docs)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Static Sites](https://render.com/docs/static-sites)
- [Web Services](https://render.com/docs/web-services)

### MongoDB Resources

- [Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Connection Troubleshooting](https://docs.atlas.mongodb.com/troubleshoot-connection/)

### Project-Specific Help

If you encounter issues:

1. **Check Render logs** for detailed error messages
2. **Test API endpoints** individually
3. **Verify environment variables** are properly set
4. **Check GitHub repository** for latest code
5. **Review MongoDB Atlas** connection settings

### Quick Debug Script

Save this as `debug-deployment.js` and run locally:

```javascript
#!/usr/bin/env node

const https = require("https");

const BACKEND_URL = "https://your-backend-app.onrender.com";
const FRONTEND_URL = "https://your-frontend-app.onrender.com";

console.log("🔍 Testing CleanCare Pro deployment...\n");

// Test backend health
https
  .get(`${BACKEND_URL}/api/health`, (res) => {
    console.log(`✅ Backend health: ${res.statusCode}`);
  })
  .on("error", (err) => {
    console.log(`❌ Backend health failed: ${err.message}`);
  });

// Test frontend
https
  .get(FRONTEND_URL, (res) => {
    console.log(`✅ Frontend: ${res.statusCode}`);
  })
  .on("error", (err) => {
    console.log(`❌ Frontend failed: ${err.message}`);
  });

console.log("\n📊 Check these manually:");
console.log(`- Frontend: ${FRONTEND_URL}`);
console.log(`- Backend Health: ${BACKEND_URL}/api/health`);
console.log(`- Backend Test: ${BACKEND_URL}/api/test`);
```

---

## 🎉 Conclusion

Following this guide should successfully deploy your CleanCare Pro application to Render and resolve the "Local Mode" issue. The key is ensuring your backend service is properly deployed and your frontend can communicate with it.

Remember:

- **"Local Mode" = Backend not reachable**
- **Check environment variables first**
- **Verify CORS configuration**
- **Test each service independently**
- **Monitor logs for issues**

Good luck with your deployment! 🚀

---

_Need help? Check the troubleshooting section or review your Render service logs for specific error messages._
