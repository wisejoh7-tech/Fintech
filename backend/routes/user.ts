import express from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/AuthMiddleware";
import { UserService } from "../services/UserService";
import { AuthService } from "../services/AuthService";
import { ActivityService } from "../services/ActivityService";
import { NotificationService } from "../services/NotificationService";

const router = express.Router();

/**
 * GET /api/user
 * Fetches the current user's profile and primary account data
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await UserService.getProfile(req.user?.dbId!);
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/sync", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const isFirstSync = !req.user?.dbId;
    const user = await AuthService.syncUser({
      uid: req.user?.uid!,
      email: req.user?.email,
      name: req.body.name,
      phoneNumber: req.body.phoneNumber
    });

    await ActivityService.log({
      userId: user.id,
      type: isFirstSync ? 'REGISTRATION' : 'LOGIN',
      detail: isFirstSync ? `New account: ${user.email}` : `Login detected from ${req.ip}`,
      ip: req.ip
    });

    if (!isFirstSync) {
      NotificationService.sendSecurityAlert(
        user.id,
        "New Login Detected",
        `A new login was detected on your VIVA account at ${new Date().toLocaleString()}.`
      ).catch(e => console.error("Alert failed", e));
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
});

router.post("/set-pin", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await UserService.setTransactionPin(req.user?.dbId!, req.body.pin);
    res.json({ success: true, message: "Transaction PIN set successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/verify-pin", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const isValid = await UserService.verifyTransactionPin(req.user?.dbId!, req.body.pin);
    res.json({ success: isValid });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

router.post("/fcm-token", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await UserService.updateFcmToken(req.user?.dbId!, req.body.token);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update token" });
  }
});

export default router;
