import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler';
import { clerkMiddleware } from '@clerk/express';
import userRouter from './routes/user.routes';
import clerkWebhookRouter from './routes/clerk.webhook';
import cacheRouter from './routes/cache.routes';
import aiRouter from './routes/ai.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());

app.use('/api/v1/users', userRouter);
app.use('/api/v1/cache', cacheRouter);
app.use('/api/v1/ai', aiRouter);
app.use(clerkWebhookRouter);

app.get('/ping', (_req, res) => {
  res.status(200).json({ message: 'Server is running perfectly fine!!!' });
});

app.use(errorHandler);

export default app;