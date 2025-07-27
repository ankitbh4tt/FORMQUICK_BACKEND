import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import jwt from "jsonwebtoken";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.decode(token) as { sub: string }; // sub = Clerk user ID

    if (!payload?.sub) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await clerkClient.users.getUser(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request object (optional)
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Authentication failed" });
  }
};
