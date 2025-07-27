import express from "express";
import cors from "cors";
import errorHandler from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/ping", (_req, res) => {
  return res
    .status(200)
    .json({ message: "Server is running perfectly fine!!!" });
});

app.use(errorHandler);

export default app;
