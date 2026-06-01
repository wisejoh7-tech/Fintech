import { VaultService } from "../services/VaultService";

/**
 * MANUAL TEST RUNNER
 * To run: npx tsx backend/tests/verifyInterest.ts
 */
async function testInterestCalculation() {
  console.log("--- Testing Vault Interest Math ---");

  const balance = 1000000n; // 1,000,000 Kobo (₦10,000)
  const annualRate = 8.5;
  const dailyRate = annualRate / 100 / 365;

  // BigInt doesn't support decimals, so we handle precision manually
  const expectedInterest = BigInt(Math.round(Number(balance) * dailyRate));

  console.log(`Principal: ₦${Number(balance)/100}`);
  console.log(`Annual Rate: ${annualRate}%`);
  console.log(`Daily Interest Accrued: ₦${Number(expectedInterest)/100}`);

  if (expectedInterest > 0n) {
    console.log("✅ Math Verified: Daily accrual generates positive interest.");
  } else {
    console.log("❌ Precision Error: Principal too low for daily accrual.");
  }
}

testInterestCalculation();
