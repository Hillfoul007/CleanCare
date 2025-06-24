# Home Services Backend API

A Node.js/Express backend API for the Home Services application with MongoDB integration.

## Features

- **Authentication**: User registration, login, JWT token management
- **Bookings**: Create, manage, and track service bookings
- **Riders**: Rider profile management and location tracking
- **Location Services**: Geocoding and place autocomplete
- **Real-time**: Location-based matching for riders and customers

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - User registration
- `POST /login` - User login
- `POST /verify-token` - Verify JWT token
- `GET /profile` - Get user profile
- `POST /logout` - User logout

### Bookings (`/api/bookings`)

- `POST /` - Create new booking
- `GET /customer/:id` - Get customer bookings
- `GET /rider/:id` - Get rider bookings
- `GET /pending/:lat/:lng` - Get pending bookings near location
- `PUT /:id/accept` - Accept booking (rider)
- `PUT /:id/status` - Update booking status
- `DELETE /:id` - Cancel booking

### Riders (`/api/riders`)

- `POST /profile` - Create/update rider profile
- `GET /profile/:userId` - Get rider profile
- `GET /online` - Get online riders
- `PUT /:id/status` - Update rider status
- `GET /:id/stats` - Get rider statistics

### Location (`/api/location`)

- `POST /geocode` - Convert coordinates to address
- `POST /coordinates` - Convert address to coordinates
- `GET /autocomplete` - Place autocomplete
- `GET /place/:placeId` - Get place details
- `POST /distance` - Calculate distance between points

### System

- `GET /health` - Health check
- `GET /api/test` - API test endpoint

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Start Production Server

```bash
npm start
```

## Environment Variables

| Variable                   | Description               | Default                 |
| -------------------------- | ------------------------- | ----------------------- |
| `PORT`                     | Server port               | `3001`                  |
| `NODE_ENV`                 | Environment               | `development`           |
| `MONGODB_URI`              | MongoDB connection string | Required                |
| `MONGODB_DATABASE`         | Database name             | `homeservices`          |
| `MONGODB_USERNAME`         | Database username         | Required                |
| `MONGODB_PASSWORD`         | Database password         | Required                |
| `JWT_SECRET`               | JWT signing secret        | Required                |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key       | Optional                |
| `FRONTEND_URL`             | Frontend URL for CORS     | `http://localhost:8080` |

## Database Models

### User

- Email, password, name, phone
- User type (customer, provider, rider)
- Profile information and preferences

### Booking

- Customer and rider references
- Service details and scheduling
- Location and pricing information
- Status tracking and completion

### Rider

- User reference and vehicle details
- Location and availability
- Ratings and earnings tracking

## Development

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run dev:watch` - Start with file watching

### Project Structure

```
backend/
├── config/          # Database configuration
├── models/          # Mongoose models
├── routes/          # API route handlers
├── server.js        # Main server file
├── package.json     # Dependencies and scripts
└── README.md       # This file
```

## Production Deployment

1. Set production environment variables
2. Ensure MongoDB connection is configured
3. Use process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "home-services-api"
   ```

## Security Features

- Helmet.js for security headers
- Rate limiting on API endpoints
- CORS configuration
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization

## Error Handling

The API includes comprehensive error handling with:

- Structured error responses
- Proper HTTP status codes
- Development vs production error details
- Request logging and monitoring
