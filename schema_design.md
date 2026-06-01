# Production Banking Database Schema (Double-Entry Ledger)

## 1. Users Collection (`/users`)
- `id`: Unique user ID (Auth UID)
- `email`: String
- `name`: String
- `phoneNumber`: String
- `kycStatus`: ENUM(UNVERIFIED, PENDING, VERIFIED)
- `tier`: Number (1, 2, 3)

## 2. Accounts Collection (`/accounts`)
- `id`: Unique Account ID
- `userId`: Reference to User
- `accountNumber`: String (Unique)
- `balance`: Number (Denominated in kobo/cents to avoid floating point errors)
- `currency`: String (NGN)
- `status`: ENUM(ACTIVE, FROZEN, CLOSED)

## 3. Transactions Collection (`/transactions`)
- `id`: UUID
- `idempotencyKey`: String (Unique index - prevents duplicate requests)
- `type`: ENUM(TRANSFER, DEPOSIT, WITHDRAWAL, BILL_PAY)
- `amount`: Number
- `description`: String
- `status`: ENUM(PENDING, SUCCESS, FAILED)
- `metadata`: Object (IP, DeviceID, Location)
- `createdAt`: Timestamp

## 4. Ledger Entries Collection (`/ledger`)
*Standard Double-Entry accounting*
- `id`: UUID
- `transactionId`: Reference to Transaction
- `accountId`: Reference to Account
- `type`: ENUM(DEBIT, CREDIT)
- `amount`: Number
- `balanceBefore`: Number
- `balanceAfter`: Number
- `createdAt`: Timestamp

## 5. Idempotency Keys (`/idempotency_keys`)
- `id`: The key provided by client
- `userId`: Reference to User
- `response`: Cached response data
- `expiresAt`: Timestamp
