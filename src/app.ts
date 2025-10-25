import express from "express";
import cors from "cors";
import errorHandler from "./middleware/errorHandler";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/user.routes";
import clerkWebhookRouter from "./routes/clerk.webhook";
import aiRouter from "./routes/ai.routes";
import formRouter from "./routes/form.routes";
import responseRouter from "./routes/response.routes";
import dashboardRouter from "./routes/dashboard.routes";

const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "https://formgenie-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.use(clerkMiddleware());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/forms", formRouter);
app.use("/api/v1/responses", responseRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use(clerkWebhookRouter);

app.get("/ping", (_req, res) => {
  res.status(200).json({ message: "Server is running perfectly fine!!!" });
});

app.use(errorHandler);

export default app;
