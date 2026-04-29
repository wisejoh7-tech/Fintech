# Security Specification - Viva FinTech

## Data Invariants
1. A **User** profile must correspond to the `request.auth.uid`.
2. **Transactions**, **Escrows**, **ActivityLogs**, and **Cards** must always belong to the authenticated user's subcollection.
3. Bank details (BVN) once set should be immutable except by admins (if admin exists).
4. **Balance** can only be decreased by the user during valid transactions (transfers, bill payments).
5. **Withdrawals/Deposits** must be validated.

## The Dirty Dozen Payloads

1. **Identity Theft (Profile)**: Attempt to create a user profile with a `userId` that doesn't match `request.auth.uid`.
2. **Balance Injection**: Attempt to update `balance` directly without a corresponding transaction.
3. **Ghost Activity**: Attempt to log activity to another user's `activityLog`.
4. **Credential Spoofing**: Attempt to set `isVerified: true` without actual BVN verification.
5. **Orphaned Transaction**: Attempt to create a transaction without updating the balance.
6. **Card Theft**: Attempt to read virtual cards belonging to another user.
7. **Role Escalation**: Regular user attempting to set `role: "admin"` during registration or update.
8. **Excessive Withdraw**: Attempt to send a transfer with `amount > balance`.
9. **Negative Transaction**: Attempt to create a transaction with a negative amount.
10. **ID Poisoning**: Injecting 1KB string as a document ID for an alert.
11. **Shadow Alert Reading**: Authenticated user trying to read someone else's security alerts.
12. **Status Shortcutting (Escrow)**: Attempt to set an escrow status to `completed` directly.

## Test Runner Plan
We will use `firestore.rules.test.ts` to verify that these payloads are rejected.
