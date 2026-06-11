import express from "express";
import crypto from 'crypto';
import { AccountService } from "../services/AccountService";
import { prisma } from "../config/db";

const router = express.Router();

/**
 * Paystack Webhook Security
 * - Verifies the signature from Paystack
 * - Ensures requests are only processed if authentic
 */
router.post("/paystack", async (req: any, res) => {
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock').update(req.rawBody).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.warn("[Security] Unauthorized Paystack Webhook attempt detected.");
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { amount, reference, customer } = event.data;
    try {
      await AccountService.creditAccount({
        email: customer.email,
        amount: amount / 100,
        reference,
        description: `Paystack Deposit: ${reference}`,
        type: 'DEPOSIT'
      } as any);
      console.log(`[Webhook] Deposit successful: ${customer.email} (₦${amount/100})`);
    } catch (err) {
      console.error('[Webhook] Error processing deposit:', err);
    }
  }

  if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
    const { reference, status } = event.data;
    const finalStatus = event.event === 'transfer.success' ? 'SUCCESS' :
                       event.event === 'transfer.reversed' ? 'REVERSED' : 'FAILED';

    try {
      await prisma.transaction.update({
        where: { reference },
        data: {
          status: finalStatus as any,
          processedAt: new Date()
        }
      });
      console.log(`[Webhook] Transfer ${reference} updated to ${finalStatus}`);
    } catch (err) {
      console.error('[Webhook] Error updating transfer status:', err);
    }
  }

  res.sendStatus(200);
});

export default router;
