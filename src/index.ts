import app from "./app";
import dotenv from "dotenv";
import { connectToDB } from "./config/db";
dotenv.config();

const PORT = process.env.PORT || 9000;
connectToDB();

app.listen(PORT, () => {
  console.log("App is listning to " + PORT);
});
