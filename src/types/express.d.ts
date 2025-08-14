// src/types/express.d.ts
import type { SessionAuthObject } from "@clerk/express";

// Locally define SignedOutAuthObject to match the typical structure
export interface SignedOutAuthObject {
  userId: null;
  sessionId: null;
  getToken: () => Promise<string | null>;
  // Add more properties if needed based on your usage
}

declare global {
  namespace Express {
    interface Request {
      auth: SessionAuthObject | SignedOutAuthObject;
      user?: any;
    }
  }
}

export {};
