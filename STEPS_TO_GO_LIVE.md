# 🏦 Viva Banking: Final Production Roadmap

This document summarizes every step needed to build, deploy, and secure your banking application across Cloud, Mobile, and Windows.

---

## 1. ☁️ Cloud Deployment (Render + PostgreSQL)
**Goal:** Host your "Bank Server" and PostgreSQL Database securely on Render.

1.  **Render Setup:**
    *   Push your code to GitHub.
    *   Go to [Render Dashboard](https://dashboard.render.com) > **Blueprints** > **New Blueprint Instance**.
    *   Connect your GitHub repository. Render will automatically detect `render.yaml` and set up both the Web Service (`viva-banking`) and PostgreSQL Database (`viva-db`).
2.  **Environment Variables:** Configure these in your Render Web Service settings:
    *   `GEMINI_API_KEY`: Your AI insights API key.
    *   `PAYSTACK_SECRET_KEY`: Your live Paystack key.
    *   `FIREBASE_SERVICE_ACCOUNT`: Firebase admin private key JSON string.
    *   `ENCRYPTION_KEY`: Auto-generated random string for BVN encryption.
    *   `NODE_ENV`: `production`
3.  **Database Auto-Push:**
    *   On start, `start.sh` executes `npx prisma db push` automatically to sync the PostgreSQL database schema.

---

## 2. 📱 Mobile Version (Android & iOS)
**Goal:** Generate the `.apk` or `.ipa` for your users.

1.  **API Sync:**
    *   Set `VITE_API_URL` environment variable during build, or set it in `.env.production` (e.g., `VITE_API_URL=https://viva-banking.onrender.com`).
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
