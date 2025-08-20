import dotenv from 'dotenv';
import { connectToDB } from './config/db';
import app from './app';
import { initializeRedis } from './services/redisClient';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 9000;

async function startApp() {
  try {
    await connectToDB();
    console.log('MongoDB connected');

    await initializeRedis();
    console.log('Redis connected');

    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start application:', err);
    process.exit(1);
  }
}

startApp();