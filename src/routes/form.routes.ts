import express, { Request, Response } from 'express';
import { requireUser } from '../middleware/clerkAuth';
import { saveForm, getFormSchemaForAmend, getPublicForm, getUserForms } from '../controllers/form.controller';

const router = express.Router();

// Save/publish form (protected by Clerk)
router.post('/save-form', requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.auth.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const result = await saveForm(req.body, req.auth.userId, req.body.sessionId);
    res.json(result);
  } catch (err) {
    console.error('Save form error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get all forms for the authenticated user (protected by Clerk)
router.get('/all', requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.auth.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const result = await getUserForms(req.auth.userId);
    res.json(result);
  } catch (err) {
    console.error('Get user forms error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get form schema for amendment (protected by Clerk)
router.get('/amend/:formId', requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.auth.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const result = await getFormSchemaForAmend(req.params.formId, req.auth.userId);
    res.json(result);
  } catch (err) {
    console.error('Get form schema error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Get public form for response (public access)
router.get('/public/:formId', async (req: Request, res: Response) => {
  try {
    const result = await getPublicForm(req.params.formId);
    res.json(result);
  } catch (err) {
    console.error('Get public form error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;