import express, { Request, Response } from "express";
import { requireUser } from "../middleware/clerkAuth";
import {
  generateFormSchema,
  getFormSchemaBySession,
  refineSessionSchema, // New import
} from "../services/aiService";

const router = express.Router();

// Generate form schema (protected by Clerk)
router.post(
  "/generate-form",
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const { prompt, sessionId } = req.body as {
        prompt?: string;
        sessionId?: string;
      };
      if (!prompt) {
        return res
          .status(400)
          .json({ success: false, error: "Prompt is required" });
      }
      const { sessionId: newSessionId, schema } = await generateFormSchema(
        prompt,
        sessionId
      );
      res.json({
        success: true,
        sessionId: newSessionId,
        schema,
        userId: req.auth.userId,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

router.post("/amend-form", requireUser, async (req: Request, res: Response) => {
  try {
    const { prompt, formId } = req.body as { prompt?: string; formId?: string };
    if (!formId) {
      return res
        .status(400)
        .json({ success: false, error: "Form ID is required" });
    }
    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt is required" });
    }
    const { sessionId: newSessionId, schema } = await generateFormSchema(
      prompt,
      formId
    );
    res.json({
      success: true,
      sessionId: newSessionId,
      schema,
      userId: req.auth.userId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// New: Amend unsaved schema from session (no DB needed)
router.post(
  "/amend-session",
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const { refinementPrompt, sessionId } = req.body as {
        refinementPrompt?: string;
        sessionId?: string;
      };
      if (!refinementPrompt) {
        return res
          .status(400)
          .json({ success: false, error: "Refinement prompt is required" });
      }
      if (!sessionId) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Session ID is required for unsaved amendment",
          });
      }
      const {
        sessionId: refinedSessionId,
        schema,
        messages,
      } = await refineSessionSchema(refinementPrompt, sessionId);
      res.json({
        success: true,
        sessionId: refinedSessionId,
        schema,
        messages, // For rendering history
        userId: req.auth.userId,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);

// Route to get form schema which is not saved yet
router.get(
  "/session/:sessionId",
  requireUser,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth.userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }
      const schema = await getFormSchemaBySession(
        req.params.sessionId,
        req.auth.userId
      );
      if (!schema) {
        return res
          .status(404)
          .json({ success: false, error: "Session not found" });
      }
      res.json({ success: true, schema });
    } catch (err) {
      console.error("Get session error:", err);
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
);
export default router;
