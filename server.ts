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
      { id: "1", email: "user@example.com", password: "password", balance: 1250000, riskLevel: "low" },
    ],
    transactions: [
      { id: "t1", sender: "System", receiver: "user@example.com", amount: 1000000, type: "deposit", date: new Date().toISOString() },
      { id: "t2", sender: "user@example.com", receiver: "Amazon", amount: 50000, type: "payment", date: new Date().toISOString() },
    ],
    escrow: [] as any[],
  };

  // API Routes
  app.get("/api/user", (req, res) => {
    res.json(db_mock.users[0]);
  });

  app.get("/api/transactions", (req, res) => {
    res.json(db_mock.transactions);
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

    res.json({ success: true, balance: user.balance, transaction: newTx });
  });

  app.post("/api/transfer", (req, res) => {
    const { receiver, amount } = req.body;
    const user = db_mock.users[0];

    // Fraud Check (from PDF)
    if (amount > 500000) {
      return res.status(403).json({ error: "High value transaction flagged for review." });
    }
    if (user.riskLevel === "high") {
      return res.status(403).json({ error: "Account restricted due to high risk level." });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance." });
    }

    // Process Transfer
    user.balance -= amount;
    const newTx = {
      id: `t${db_mock.transactions.length + 1}`,
      sender: user.email,
      receiver,
      amount,
      type: "transfer",
      date: new Date().toISOString(),
    };
    db_mock.transactions.unshift(newTx);

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
