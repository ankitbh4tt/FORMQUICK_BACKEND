import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import axios from "axios";

export async function clerkAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  req.auth = auth;

  // If authenticated, fetch user details and attach to req.user
  if (auth.userId) {
    try {
      const response = await axios.get(
        `https://api.clerk.com/v1/users/${auth.userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY || "sk_test_xxx_replace_me"}`,
          }, 
        }
      );
      req.user = response.data;
    } catch (error: any) {
      console.error("Error fetching Clerk user in middleware:", error?.response?.data || error.message);
      // Optionally, you can decide to fail or continue without user info
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const auth = req.auth;
  if (!auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
