# 🏦 Viva Banking: Final Production Roadmap

This document summarizes every step needed to build, deploy, and secure your banking application across Cloud, Mobile, and Windows.

---

## 1. ☁️ Cloud Deployment (Railway + Docker)
**Goal:** Host your "Bank Server" and Database securely.

1.  **Railway Setup:**
    *   Push your current code to GitHub.
    *   Connect the repo to [Railway.app](https://railway.app).
    *   Add **PostgreSQL** and **Redis** services in the Railway dashboard.
2.  **Environment Variables:** Add these to Railway:
    *   `GEMINI_API_KEY`: Your AI insights key.
    *   `PAYSTACK_SECRET_KEY`: Your live Paystack key.
    *   `ENCRYPTION_KEY`: A random 32-character string for BVN encryption.
    *   `NODE_ENV`: `production`
3.  **Database Initialization:**
    *   Run `npx prisma db push` via the Railway terminal or locally pointing to the Railway URL.

---

## 2. 📱 Mobile Version (Android & iOS)
**Goal:** Generate the `.apk` or `.ipa` for your users.

1.  **API Sync:**
    *   Open `src/lib/api.ts`.
    *   Update `API_BASE_URL` with your Railway domain (e.g., `https://viva-api.up.railway.app`).
2.  **Build & Sync:**
    ```bash
    npm run build
    npx cap sync
    ```
3.  **Android Studio:**
    *   Run `npx cap open android`.
    *   Go to **Build > Build APK**.
    *   Install the resulting file on any Android device.

---

## 3. 💻 Windows Version (Electron)
**Goal:** A desktop app for pharmacy/corporate terminal use.

1.  **Test Locally:**
    ```bash
    npm run electron:dev
    ```
2.  **Build Installer (.exe):**
    ```bash
    npm run electron:build
    ```
    *Find your installer in the `dist_electron` folder.*

---

## 4. 🛡️ Money Safety & Audit Procedures
**Goal:** Ensure no money is ever lost.

1.  **Automatic Backups:** Verify that Railway PostgreSQL snapshots are enabled in the service settings.
2.  **Manual Audit:** Once a month, run the `verifyIntegrity` check (implemented in `AccountService.ts`) to ensure the Ledger matches the Account Balances.
3.  **Local Backup Command:**
    ```bash
    pg_dump "YOUR_RAILWAY_DATABASE_URL" > viva_bank_backup.sql
    ```

---

## 5. 💳 Live Payment Integration
1.  **Webhooks:** Copy your Railway URL + `/api/webhooks/paystack` and paste it into your **Paystack Dashboard** under Webhooks. This ensures deposits work instantly.
2.  **KYC:** The app is currently using **Live Paystack KYC**. Ensure your Paystack account is "Live" and has "Identity Verification" permissions enabled.

---

**Current Status:** Your app is 100% production-coded. It is now waiting for you to perform the Railway and Android Studio steps above.
