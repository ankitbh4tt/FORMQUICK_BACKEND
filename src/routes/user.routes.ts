import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

router.get("/me", async (req: Request, res: Response) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!req.user) {
    return res.status(500).json({ message: "Failed to fetch user details" });
  }
  const user = req.user;
  res.json({
    message: "User is authenticated",
    user: {
      id: user.id,
      email: user.email_addresses?.[0]?.email_address,
      name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
      username: user.username,
      imageUrl: user.image_url,
    },
  });
});

export default router;
