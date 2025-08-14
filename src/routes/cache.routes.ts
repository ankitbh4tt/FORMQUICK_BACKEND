import express from 'express';
import { setCache, getCache } from '../services/redisClient';
import { requireUser } from '../middleware/clerkAuth';

const router = express.Router();

// Test cache endpoint (protected by Clerk)
router.get('/test-cache', requireUser, async (req, res) => {
    try {
      const cacheKey = 'test:json';
      let data = await getCache<{ message: string; userId: string }>(cacheKey);
      
      if (!data) {
        if (!req.auth.userId) {
          throw new Error('User ID is not available');
        }
        data = { 
          message: 'Hello from cache!', 
          userId: req.auth.userId 
        };
        await setCache(cacheKey, data, 60);
        console.log('Cache set in route');
      }
      
      // Now we're certain data is not null here
      res.json({ success: true, data });
    } catch (err) {
      const error = err as Error;
      res.status(500).json({ success: false, error: error.message });
    }
  });
export default router;