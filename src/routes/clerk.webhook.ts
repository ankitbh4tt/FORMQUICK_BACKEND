import express, { Request, Response } from "express";
import User from "../models/user.modal";

const router = express.Router();

// Clerk webhook for user events
router.post("/webhooks/clerk", (req, res, next) => {
  console.log("Webhook endpoint hit!", req.method, req.originalUrl);
  next();
}, async (req: Request, res: Response) => {
  try {
    const eventType = req.body.type;
    const userData = req.body.data;

    // Map Clerk data to our MongoDB user model
    const userDoc: any = {
      clerkId: userData.id,
      email: userData.email_addresses?.[0]?.email_address || "",
      name: `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim(),
      imageUrl: userData.image_url,
    };
    if (userData.username) {
      userDoc.username = userData.username;
    }

    if (eventType === "user.created" || eventType === "user.updated") {
      // Upsert user (insert if not exists, update if exists)
      await User.findOneAndUpdate(
        { clerkId: userDoc.clerkId },
        userDoc,
        { upsert: true, new: true }
      );
      console.log("User created or updated:", userDoc);
    } else if (eventType === "user.deleted") {
      await User.findOneAndDelete({ clerkId: userDoc.clerkId });
      console.log("User deleted:", userDoc);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    if (error instanceof Error) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: String(error) });
    }
  }
});

export default router;
