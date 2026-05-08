import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

// VAPID keys should be generated once and stored in .env
// web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@stoqueplus.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to send push notification
  app.post("/api/notifications/send", async (req, res) => {
    const { subscription, title, message, url, icon } = req.body;

    if (!subscription || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(400).json({ error: "Missing subscription or VAPID keys" });
    }

    try {
      const payload = JSON.stringify({
        title,
        message,
        url: url || "/",
        icon: icon || "/icon-192x192.png"
      });

      await webpush.sendNotification(subscription, payload);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to get VAPID Public Key
  app.get("/api/notifications/public-key", (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
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
