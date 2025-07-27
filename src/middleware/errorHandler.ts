import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  statusCode?: number;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const env = process.env.NODE_ENV || "development";

  const response: any = {
    success: false,
    message: err.message || "Something went wrong",
  };

  // Show stack trace in dev only
  if (env === "development") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
