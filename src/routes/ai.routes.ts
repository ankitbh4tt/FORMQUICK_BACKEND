import express, { Request, Response } from 'express';
import { requireUser } from '../middleware/clerkAuth';
import { generateFormSchema } from '../services/aiService';

const router = express.Router();

// Generate form schema (protected by Clerk)
router.post('/generate-form',  async (req: Request, res: Response) => {
  try {
    const { prompt, sessionId } = req.body as { prompt?: string; sessionId?: string };
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }
    const { sessionId: newSessionId, schema } = await generateFormSchema(prompt, sessionId);
    res.json({ success: true, sessionId: newSessionId, schema, userId: req.auth.userId });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

router.post('/amend-form',  async (req: Request, res: Response) => {
    try {
      const { prompt, formId } = req.body as { prompt?: string; formId?: string };
      if(!formId){
        return res.status(400).json({ success: false, error: 'Form ID is required' });
      }
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'Prompt is required' });
      }
      const { sessionId: newSessionId, schema } = await generateFormSchema(prompt, formId);
      res.json({ success: true, sessionId: newSessionId, schema, userId: req.auth.userId });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

export default router;