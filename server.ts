import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database
  const db_mock = {
    users: [
      { 
        id: "1", 
        name: "Wisdom Idemudia",
        email: "user@example.com", 
        password: "password", 
        balance: 2450000, 
        riskLevel: "low",
        is2FAEnabled: false,
        accountNumber: "81" + Math.floor(10000000 + Math.random() * 90000000).toString(),
        bvn: "",
        isVerified: false,
        phoneNumber: "+234 812 345 6789",
        role: "user",
        tier: 1,
        isBiometricEnabled: true,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
      },
      {
        id: "2",
        name: "Admin User",
        email: "admin@viva.com",
        password: "admin",
        role: "admin",
        avatar: ""
      }
    ],
    transactions: [] as any[],
    escrow: [] as any[],
    activityLog: [
      { id: "a1", type: "Login", detail: "Logged in from Chrome on Windows", date: new Date().toISOString() }
    ] as any[],
    securityAlerts: [
      {
        id: "sec-init-1",
        title: "New Device Login",
        message: "Your account was accessed from a new device in Abuja, Nigeria.",
        severity: "medium",
        date: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
        ip: "102.89.34.120",
        device: "Safari on iPhone 15 Pro",
        recommendedActions: ["Confirm if this was you", "Update your security questions"]
      }
    ] as any[],
    cards: [
      { id: "c1", type: "Visa", number: "4290", name: "WISDOM IDEMUDIA", expiry: "08/27", color: "bg-slate-900", brand: "Virtual Visa" },
      { id: "c2", type: "Mastercard", number: "8812", name: "WISDOM IDEMUDIA", expiry: "12/26", color: "bg-gradient-to-br from-purple-600 to-blue-600", brand: "Business Master" },
      { id: "c3", type: "Verve", number: "3319", name: "WISDOM IDEMUDIA", expiry: "05/28", color: "bg-gradient-to-br from-orange-500 to-red-600", brand: "Verve Debit" }
    ],
    externalCards: [
      { id: "ec1", bank: "First Bank", type: "Visa", last4: "8821", expiry: "10/26", color: "bg-blue-800" },
      { id: "ec2", bank: "GTBank", type: "Mastercard", last4: "4490", expiry: "12/25", color: "bg-orange-600" }
    ] as any[],
    failedLoginAttempts: {} as Record<string, number>
  };

  const addActivity = (type: string, detail: string) => {
    db_mock.activityLog.unshift({
      id: `a${db_mock.activityLog.length + 1}`,
      type,
      detail,
      date: new Date().toISOString(),
    });
  };

  const addSecurityAlert = (title: string, message: string, severity: "low" | "medium" | "high", metadata?: { ip?: string, device?: string, actions?: string[] }) => {
    db_mock.securityAlerts.unshift({
      id: `sec-${db_mock.securityAlerts.length + 1}`,
      title,
      message,
      severity,
      date: new Date().toISOString(),
      isRead: false,
      ip: metadata?.ip || "192.168.1." + Math.floor(Math.random() * 255),
      device: metadata?.device || "Unknown Device",
      recommendedActions: metadata?.actions || ["Check your account activity", "Enable 2FA"]
    });
  };

  const getTransferLimit = (user: any) => {
    if (user.role === 'admin') return 10000000;
    if (user.riskLevel === 'high') return 10000;
    
    switch (user.tier) {
      case 3: return 10000000;
      case 2: return 5000000;
      case 1: 
      default:
        return 500000;
    }
  };

  // API Routes
  app.get("/api/user", (req, res) => {
    const user = { ...db_mock.users[0] };
    (user as any).transferLimit = getTransferLimit(user);
    // Requirements for tier 2/3: Bills access
    (user as any).canPayBills = user.tier >= 2 || user.role === 'admin';
    res.json(user);
  });

  app.get("/api/cards", (req, res) => {
    res.json(db_mock.cards);
  });

  app.post("/api/cards/create", (req, res) => {
    const { type, color, brand } = req.body;
    const user = db_mock.users[0];
    
    // Fee for new card
    const cardFee = 1000;
    if (user.balance < cardFee) {
      return res.status(400).json({ error: "Insufficient balance to create a new virtual card (Fee: ₦1,000)." });
    }

    user.balance -= cardFee;
    const newCard = {
      id: `c${db_mock.cards.length + 1}`,
      type,
      number: Math.floor(1000 + Math.random() * 9000).toString(),
      name: user.name.toUpperCase(),
      expiry: "09/28",
      color,
      brand
    };

    db_mock.cards.push(newCard);
    addActivity("Card Created", `New ${type} virtual card created.`);
    
    const newTx = {
      id: `ct${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: "Viva Card Issuance",
      amount: cardFee,
      type: "card_fee",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);

    res.json({ success: true, card: newCard, balance: user.balance });
  });

  app.get("/api/security/alerts", (req, res) => {
    res.json(db_mock.securityAlerts);
  });

  app.post("/api/security/alerts/read", (req, res) => {
    db_mock.securityAlerts.forEach(alert => alert.isRead = true);
    res.json({ success: true });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db_mock.users.find(u => u.email === email);
    
    if (!user || user.password !== password) {
      const attempts = (db_mock.failedLoginAttempts[email] || 0) + 1;
      db_mock.failedLoginAttempts[email] = attempts;
      
      if (attempts >= 3) {
        addSecurityAlert(
          "Multiple Failed Login Attempts",
          `We detected ${attempts} unsuccessful login attempts on your account. If this wasn't you, please change your password immediately.`,
          "high",
          {
            ip: "105.112.181.22",
            device: "Mobile Browser (Lagos, NG)",
            actions: [
              "Change your login password",
              "Review active sessions",
              "Enable Biometric Lock"
            ]
          }
        );
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    db_mock.failedLoginAttempts[email] = 0;
    addActivity("Login", "Successful session start");
    res.json({ success: true, user });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phoneNumber } = req.body;
    
    if (db_mock.users.find(u => u.email === email)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Server-side validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!hasUpperCase || !hasLowerCase || !hasSpecialChar || !isLongEnough) {
      return res.status(400).json({ error: "Password does not meet security requirements" });
    }

    const newUser = {
      id: (db_mock.users.length + 1).toString(),
      name,
      email,
      password,
      phoneNumber: phoneNumber || "Not set",
      accountNumber: "0" + Math.floor(100000000 + Math.random() * 900000000).toString(),
      balance: 1000.0, // Welcome bonus!
      tier: 1,
      isVerified: false,
      isBiometricEnabled: true,
      lastLogin: new Date().toISOString(),
      is2FAEnabled: false,
      riskLevel: "low",
      bvn: "",
      role: "user",
      avatar: ""
    };

    db_mock.users.push(newUser);
    // Switch currently "logged in" user to the new one for the demo
    // In a real app, we'd handle sessions
    res.json({ success: true, user: newUser });
  });

  app.post("/api/user/update", (req, res) => {
    const { name, phoneNumber, avatar } = req.body;
    const user = db_mock.users[0];
    user.name = name || user.name;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.avatar = avatar !== undefined ? avatar : user.avatar;
    addActivity("Profile Update", "Updated personal information");
    res.json({ success: true, user });
  });

  app.post("/api/user/verify-bvn", (req, res) => {
    const { bvn } = req.body;
    if (bvn.length === 11) {
      db_mock.users[0].bvn = bvn;
      db_mock.users[0].isVerified = true;
      addActivity("BVN Verification", "Successfully verified Bank Verification Number");
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid BVN. Must be 11 digits." });
    }
  });

  app.post("/api/admin/update-risk", (req, res) => {
    const { userId, riskLevel } = req.body;
    const user = db_mock.users.find(u => u.id === userId);
    if (user) {
      user.riskLevel = riskLevel;
      addActivity("Risk Management", `Account ${userId} risk level set to ${riskLevel}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/user/upgrade-tier", (req, res) => {
    const { tier } = req.body;
    const user = db_mock.users[0];
    if (tier > user.tier && tier <= 3) {
      user.tier = tier;
      addActivity("Tier Upgrade", `Account upgraded to Tier ${tier}`);
      res.json({ success: true, tier: user.tier });
    } else {
      res.status(400).json({ error: "Invalid tier upgrade request" });
    }
  });

  app.post("/api/bills/pay", (req, res) => {
    const { biller, amount, meterNumber } = req.body;
    const user = db_mock.users[0];

    if (user.tier < 2 && user.role !== 'admin') {
      return res.status(403).json({ error: "Bill payment requires Tier 2 account or higher." });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance for bill payment." });
    }

    user.balance -= amount;
    const newTx = {
      id: `b${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: `${biller} (${meterNumber})`,
      amount,
      type: "bill",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);
    addActivity("Bill Payment", `₦${amount} paid to ${biller}`);
    res.json({ success: true, balance: user.balance });
  });

  app.post("/api/recharge", (req, res) => {
    const { type, network, amount, phoneNumber } = req.body;
    const user = db_mock.users[0];

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    user.balance -= amount;
    const newTx = {
      id: `r${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: `${network} (${phoneNumber})`,
      amount,
      type: type === 'airtime' ? "airtime" : "data",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);
    addActivity("Recharge", `₦${amount} ${type} recharge for ${phoneNumber} (${network})`);
    res.json({ success: true, balance: user.balance });
  });

  app.get("/api/admin/stats", (req, res) => {
    // Basic stats for admin dashboard
    const stats = {
      totalUsers: db_mock.users.length,
      totalTransactions: db_mock.transactions.length,
      totalEscrow: db_mock.escrow.length,
      totalVolume: db_mock.transactions.reduce((sum, tx) => sum + tx.amount, 0),
      recentActivity: db_mock.activityLog.slice(0, 10)
    };
    res.json(stats);
  });

  app.get("/api/transactions", (req, res) => {
    res.json(db_mock.transactions);
  });

  app.get("/api/activity", (req, res) => {
    res.json(db_mock.activityLog);
  });

  app.post("/api/user/biometrics", (req, res) => {
    const { enabled } = req.body;
    db_mock.users[0].isBiometricEnabled = enabled;
    addActivity("Security Update", `Biometric Login ${enabled ? 'Enabled' : 'Disabled'}`);
    res.json({ success: true, user: db_mock.users[0] });
  });

  app.post("/api/user/settings", (req, res) => {
    const { is2FAEnabled } = req.body;
    db_mock.users[0].is2FAEnabled = is2FAEnabled;
    addActivity("Security Update", `2FA ${is2FAEnabled ? 'Enabled' : 'Disabled'}`);
    res.json({ success: true, user: db_mock.users[0] });
  });

  app.post("/api/2fa/verify", (req, res) => {
    const { code } = req.body;
    // For demo purposes, the code is always '123456'
    if (code === "123456") {
      addActivity("2FA Verification", "Successfully verified 2FA code");
      res.json({ success: true });
    } else {
      addActivity("2FA Failure", "Failed 2FA verification attempt");
      res.status(401).json({ error: "Invalid verification code" });
    }
  });

  app.post("/api/receive", (req, res) => {
    const { sender, amount } = req.body;
    const user = db_mock.users[0];

    // Update Balance
    user.balance += parseFloat(amount);
    
    const newTx = {
      id: `t${db_mock.transactions.length + 1}`,
      sender: sender || "External Bank",
      receiver: user.email,
      amount: parseFloat(amount),
      type: "deposit",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);
    addActivity("Money Received", `₦${amount} received from ${sender || "External Bank"}`);

    res.json({ success: true, balance: user.balance, transaction: newTx });
  });

  app.get("/api/external-cards", (req, res) => {
    res.json(db_mock.externalCards);
  });

  app.post("/api/external-cards/add", (req, res) => {
    const { bank, type, last4, expiry } = req.body;
    
    const colors = ["bg-blue-800", "bg-orange-600", "bg-emerald-700", "bg-indigo-900"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newExternalCard = {
      id: `ec${db_mock.externalCards.length + 1}`,
      bank,
      type,
      last4,
      expiry,
      color: randomColor
    };

    db_mock.externalCards.push(newExternalCard);
    addActivity("Card Linked", `${bank} ${type} card ending in ${last4} linked.`);
    
    res.json({ success: true, card: newExternalCard });
  });

  app.post("/api/escrow/create", (req, res) => {
    const { receiver, amount, reason } = req.body;
    const user = db_mock.users[0];

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance for escrow." });
    }

    user.balance -= amount;
    const newEscrow = {
      id: `e${db_mock.escrow.length + 1}`,
      sender: user.email,
      receiver,
      amount,
      reason,
      status: "pending",
      date: new Date().toISOString(),
    };
    db_mock.escrow.unshift(newEscrow);
    
    // Add transaction record
    const newTx = {
      id: `t${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: `Escrow: ${receiver}`,
      amount,
      type: "transfer",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);
    
    addActivity("Escrow Created", `₦${amount} held in escrow for ${receiver}`);

    res.json({ success: true, balance: user.balance, escrow: newEscrow });
  });

  app.post("/api/invest/create", (req, res) => {
    const { type, amount } = req.body;
    const user = db_mock.users[0];

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance to invest." });
    }

    user.balance -= amount;
    addActivity("Investment Created", `₦${amount} invested in ${type}`);
    
    const newTx = {
      id: `inv${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: `Investment: ${type}`,
      amount,
      type: "transfer",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);

    res.json({ success: true, balance: user.balance });
  });

  app.post("/api/bet/topup", (req, res) => {
    const { platform, amount, customerId } = req.body;
    const user = db_mock.users[0];

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance for betting top-up." });
    }

    user.balance -= amount;
    addActivity("Betting Top-up", `₦${amount} sent to ${platform} (${customerId})`);
    
    const newTx = {
      id: `bet${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: `Betting: ${platform}`,
      amount,
      type: "transfer",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);

    res.json({ success: true, balance: user.balance });
  });

  app.post("/api/scan/pay", (req, res) => {
    const { merchantId, amount } = req.body;
    const user = db_mock.users[0];

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance for scan payment." });
    }

    user.balance -= amount;
    addActivity("QR Payment", `₦${amount} paid to merchant ${merchantId}`);
    
    const newTx = {
      id: `scan${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: `Merchant: ${merchantId}`,
      amount,
      type: "transfer",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);

    res.json({ success: true, balance: user.balance });
  });

  app.post("/api/transfer", (req, res) => {
    const { receiver, amount, bank } = req.body;
    const user = db_mock.users[0];
    const isViva = !bank || bank === "Viva";
    const limit = getTransferLimit(user);

    if (amount > limit) {
      addSecurityAlert(
        "Transfer Limit Exceeded",
        `You attempted to transfer ₦${amount.toLocaleString()}, which exceeds your current limit of ₦${limit.toLocaleString()}. Verify your account to increase limits.`,
        "medium"
      );
      return res.status(403).json({ error: `Transfer exceeds your current limit of ₦${limit.toLocaleString()}.` });
    }

    if (amount > 100000) {
      addSecurityAlert(
        "Large Transaction Detected",
        `A transfer of ₦${amount.toLocaleString()} was initiated. If this wasn't you, please secure your account.`,
        amount > 500000 ? "high" : "medium"
      );
    }

    if (amount > 500000) {
      addActivity("Security Alert", `High value transfer of ₦${amount} flagged`);
      return res.status(403).json({ error: "High value transaction flagged for review." });
    }
    if (user.riskLevel === "high") {
      addActivity("Access Denied", "Transfer blocked due to high account risk");
      return res.status(403).json({ error: "Account restricted due to high risk level." });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    let recipientName = receiver;
    if (isViva) {
      const recipientUser = db_mock.users.find(u => u.accountNumber === receiver || u.email === receiver);
      if (recipientUser) {
        recipientName = recipientUser.name;
        // In a real app we'd add balance to the recipientUser here too
        recipientUser.balance = (recipientUser.balance || 0) + amount;
      } else {
        return res.status(404).json({ error: "Viva recipient not found. Please check the account number." });
      }
    }

    // Process Transfer
    user.balance -= amount;
    const newTx = {
      id: `t${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver: !isViva ? `${receiver} (${bank})` : recipientName,
      amount,
      type: "transfer",
      date: new Date().toISOString(),
      bank: bank || "Viva"
    };
    db_mock.transactions.unshift(newTx);
    addActivity("Money Sent", `₦${amount} sent to ${recipientName} ${!isViva ? `on ${bank}` : ''}`);

    res.json({ success: true, balance: user.balance, transaction: newTx });
  });

  app.post("/api/escrow", (req, res) => {
    const { receiver, amount } = req.body;
    const user = db_mock.users[0];

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance for escrow." });
    }

    user.balance -= amount;
    const escrowItem = {
      id: `e${db_mock.escrow.length + 1}`,
      sender: user.email,
      receiver,
      amount,
      status: "pending",
      date: new Date().toISOString(),
    };
    db_mock.escrow.push(escrowItem);
    addActivity("Escrow Started", `₦${amount} held in escrow for ${receiver}`);

    res.json({ success: true, balance: user.balance, escrow: escrowItem });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
