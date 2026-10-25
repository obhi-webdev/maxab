import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/database.js";

async function start() {
  if (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }

  await connectDB();

  const port = Number(process.env.PORT || 5000);

  app.listen(port, () => {
    console.log(`MAXAB Backend: http://localhost:${port}`);
  });
}

start().catch(error => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
