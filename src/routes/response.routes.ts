import express, { Request, Response } from 'express';
import { requireUser } from '../middleware/clerkAuth';
import { submitResponse, getFormResponses } from '../controllers/response.controller';

const router = express.Router();

// Submit response for a form (public)
router.post('/submit/:formId', async (req: Request, res: Response) => {
  try {
    const result = await submitResponse(req.params.formId, req.body);
    res.json(result);
  } catch (err) {
    console.error('Submit response error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get all responses for a form (protected by Clerk)
router.get('/responses/:formId', requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.auth.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const result = await getFormResponses(req.params.formId, req.auth.userId);
    res.json(result);
  } catch (err) {
    console.error('Get responses error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;