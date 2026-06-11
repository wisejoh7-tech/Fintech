# Viva Mobile - Production Deployment Guide

This guide outlines the steps required to transition from local development to a live production mobile app.

## 1. Cloud Infrastructure (Backend)
- **Deployment**: Deploy the Node.js server to [Render](https://render.com) or [Railway](https://railway.app).
- **Database**: Use a managed PostgreSQL service like [Supabase](https://supabase.com) or [Neon](https://neon.tech).
- **Redis**: Use [Upstash Redis](https://upstash.com) for a managed, serverless Redis instance.
- **VITE_API_URL**: Update your environment variables in your hosting provider to point to your live URL (e.g., `https://api.vivamobile.ng`).

## 2. Firebase Production Setup
- Create a new project in the [Firebase Console](https://console.firebase.google.com) for production.
- **Service Account**: Generate a new Private Key (JSON) and add it to your server environment variables as `FIREBASE_SERVICE_ACCOUNT`.
- **API Keys**: Update `firebase-applet-config.json` with the production project credentials.

## 3. Mobile Branding & Assets
- **Icons**: Replace the placeholder icons in `android/app/src/main/res/mipmap-*`.
- **Splash Screen**: Update the splash screen image.
- **Package ID**: Your appId is now set to `com.vivamobile.banking` in `capacitor.config.ts`. Ensure this matches your Play Store / App Store console.

## 4. Security & Compliance
- **Paystack Live**: Switch from `pk_test` to `pk_live` keys in the dashboard and `.env`.
- **Privacy Policy**: Your app now includes a `/privacy` route. Ensure this content matches your legal requirements.
- **Transaction PIN**: The app now strictly requires a 4-digit hashed PIN for all sensitive transactions.

## 5. Deployment Commands
To build the app for production:
```bash
# 1. Build the web project
npm run build

# 2. Sync with Capacitor
npx cap copy
npx cap sync

# 3. Open in Android Studio to generate Signed Bundle
npx cap open android
```

## 6. Sentry Monitoring
To enable crash reporting, initialize Sentry in `backend/monitoring/Sentry.ts` with your DSN key.

---
**Author**: Viva Mobile Development Team
**Date**: June 2026
