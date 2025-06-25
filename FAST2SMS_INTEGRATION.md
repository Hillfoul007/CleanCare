# Fast2SMS Integration Documentation

## Overview

This project has been migrated from Twilio SMS to Fast2SMS for OTP authentication. Fast2SMS is a more cost-effective solution for Indian SMS delivery.

## Migration Summary

### Changed Files:

1. **Backend:**
   - `backend/routes/otp-auth.js` - Updated SMS sending logic to use Fast2SMS API
   - `backend/.env.example` - Added Fast2SMS configuration

2. **Frontend:**
   - `src/services/fast2smsService.ts` - New service replacing TwilioSmsService
   - `src/services/twilioSmsService.ts` - Removed (replaced by Fast2SMS)
   - `src/components/PhoneOtpAuthModal.tsx` - Updated to use Fast2SMS service
   - `src/pages/LaundryIndex.tsx` - Updated service import
   - `src/components/ResponsiveLaundryHome.tsx` - Updated service import
   - `src/services/exotelMissedCallService.ts` - Updated comments

3. **Configuration:**
   - `.env.example` - Added Fast2SMS environment variables
   - `deploy.sh` - Updated deployment message

## Environment Variables

### Backend (.env file):

```bash
FAST2SMS_API_KEY=your_fast2sms_api_key_here
JWT_SECRET=your_jwt_secret_here
DB_URI=mongodb://localhost:27017/cleancare-pro
```

### Frontend (.env file):

```bash
VITE_FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

## Fast2SMS API Response Format

The Fast2SMS API returns responses in the following format:

```json
{
  "sms_reports": [
    {
      "request_id": "abcd1234efgh5678",
      "route": "dlt",
      "delivery_status": [
        {
          "sender_id": "Sender ID",
          "mobile": "9XXXXXXXX0",
          "status": "Delivered",
          "status_description": "Delivered successfully",
          "post_attempt": 2,
          "sms_language": "unicode",
          "character_count": 207,
          "sms_count": 4,
          "amount_debited": "0.4800",
          "sent_timestamp": 1726642924,
          "sent_time": "14-11-2024 12:00:00 PM",
          "delivery_timestamp": 1726643040,
          "delivery_time": "14-11-2024 12:02:00 PM"
        }
      ]
    }
  ]
}
```

## API Endpoints

### Send OTP

```
GET https://www.fast2sms.com/dev/bulkV2?authorization={API_KEY}&route=otp&sender_id=FSTSMS&message={MESSAGE}&language=english&flash=0&numbers={PHONE_NUMBER}
```

### Parameters:

- `authorization`: Your Fast2SMS API key
- `route`: Set to "otp" for OTP messages
- `sender_id`: Sender ID (default: FSTSMS)
- `message`: URL-encoded OTP message
- `language`: Message language (english/unicode)
- `flash`: Flash message flag (0 or 1)
- `numbers`: Target phone number(s)

## Implementation Details

### Backend Implementation

The backend service in `backend/routes/otp-auth.js` handles:

- OTP generation (6-digit random number)
- Fast2SMS API integration
- Response validation
- Error handling with fallback to simulation mode

### Frontend Implementation

The frontend service in `src/services/fast2smsService.ts` provides:

- Clean API interface matching the previous Twilio service
- Client-side OTP verification
- User session management
- Error handling

## Migration Benefits

1. **Cost Effective**: Fast2SMS offers competitive pricing for Indian SMS delivery
2. **Local Service**: Better delivery rates for Indian mobile numbers
3. **Simple API**: Easy-to-use REST API without complex SDK requirements
4. **Reliable**: Good delivery success rates for OTP messages

## Testing

The service includes multiple fallback modes:

1. Set `FAST2SMS_API_KEY` to test with real SMS delivery
2. Remove or leave empty for simulation mode (development)
3. If Fast2SMS API fails in development mode, it automatically falls back to simulation

## Debugging CORS Issues

The original implementation was updated to fix CORS issues:

- **Problem**: Direct calls from frontend to Fast2SMS API were blocked by CORS
- **Solution**: Frontend now calls backend API endpoints that proxy to Fast2SMS
- **API Endpoints**: `/api/auth/send-otp` and `/api/auth/verify-otp`
- **Proxy Configuration**: Added in `vite.config.ts` to forward `/api/*` to `http://localhost:3001`

## Error Handling

The implementation includes comprehensive error handling:

- Network failures
- API errors
- Invalid phone numbers
- Rate limiting
- Expired OTPs

## Security Considerations

1. API key should be stored securely in environment variables
2. Phone number validation for Indian mobile numbers
3. OTP expiration (5 minutes)
4. Attempt limiting (max 3 attempts per OTP)
5. Rate limiting for OTP requests (30 seconds between requests)

## Support

For Fast2SMS API issues, refer to:

- Fast2SMS Documentation: https://docs.fast2sms.com/
- Fast2SMS Support: https://www.fast2sms.com/contact

For implementation issues, check the console logs which include detailed debugging information.

## Additional Fixes

### Geolocation Error Handling

Fixed improper geolocation error logging that was showing "[object GeolocationPositionError]":

- Updated error handlers in LaundryIndex.tsx and GoogleMapsNavigation.tsx
- Added proper error code and message extraction
- Created geolocationUtils.ts for consistent error handling across the app
- Users now see meaningful error messages like "Location access denied" instead of object references
