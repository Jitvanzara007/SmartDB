# Deployment Setup Guide

## Frontend (Vercel) Environment Variables

In your Vercel project settings, add the following environment variable:

```
VITE_API_BASE_URL=https://your-backend-url.com
```

Replace `https://your-backend-url.com` with your actual backend URL (e.g., your Render, Railway, or Fly.io URL).

## Backend Environment Variables

For your backend deployment, make sure you have these environment variables set:

```
MONGODB_URI=your_mongodb_connection_string
SECRET_KEY=your_django_secret_key
DEBUG=False
```

## Local Development

For local development, create a `.env` file in the `client` directory:

```
VITE_API_BASE_URL=http://localhost:8000
```

## CORS Configuration

The backend is now configured to allow requests from:
- `http://localhost:3000` (local development)
- `https://smart-db-omega.vercel.app` (your Vercel domain)
- Other common deployment domains

## Troubleshooting

1. **CORS Errors**: Make sure your backend URL is correctly set in the frontend environment variables
2. **Connection Refused**: Ensure your backend is running and accessible
3. **Authentication Issues**: Check that JWT tokens are being sent correctly in request headers

## Deployment Platforms

### Backend Options:
- **Render**: Free tier available, good for Django apps
- **Railway**: Easy deployment, good free tier
- **Fly.io**: Good performance, generous free tier
- **Heroku**: Paid but reliable

### Database:
- **MongoDB Atlas**: Free tier available, works well with MongoEngine

### Frontend:
- **Vercel**: Already deployed, excellent for React apps 