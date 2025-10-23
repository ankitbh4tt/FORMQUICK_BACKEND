import express, { Request, Response } from "express";
import { requireUser } from "../middleware/clerkAuth";
import { getDashboardData } from "../controllers/dashboard.controller";

const router = express.Router();

// Get dashboard statistics (protected by Clerk)
router.get("/stats", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.auth.userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const result = await getDashboardData(req.auth.userId);
    res.json(result);
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;
