# Viva Mobile - Production Deployment Guide

This guide outlines the steps required to transition from local development to a live production mobile app.

## 1. Cloud Infrastructure (Render Deployment)
- **Render Blueprint Setup**: Push code to GitHub and create a new **Blueprint** service on [Render](https://render.com). Select `render.yaml` from the repository root.
- **Database**: Render automatically provisions a managed PostgreSQL instance (`viva-db`) and binds `DATABASE_URL` directly to your web service.
- **Redis (Optional)**: Use [Upstash Redis](https://upstash.com) or Render Redis instance for queuing and real-time socket scaling, setting `REDIS_URL`.
- **Environment Variables**: Configure the following in the Render Dashboard:
  - `GEMINI_API_KEY`: Your Google Gemini key for AI insights.
  - `PAYSTACK_SECRET_KEY`: Your live/test Paystack secret key.
  - `FIREBASE_SERVICE_ACCOUNT`: Single-line JSON string for Firebase Admin credential.
  - `VITE_API_URL`: Set to your live Render Web Service URL (e.g., `https://viva-banking.onrender.com`).

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
