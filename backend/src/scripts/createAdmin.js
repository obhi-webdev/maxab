import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import Admin from "../models/Admin.js";
import { connectDB } from "../config/database.js";

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const email = (await rl.question("Admin email: "))
    .trim()
    .toLowerCase();

  const password = process.env.MAXAB_SETUP_PASSWORD;

  rl.close();

  if (!email.includes("@") || !password || password.length < 12) {
    throw new Error(
      "Valid email and a setup password of at least 12 characters required"
    );
  }

  await connectDB();

  const existing = await Admin.findOne({ email });

  if (existing) {
    throw new Error("Admin email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await Admin.create({
    email,
    passwordHash,
    role: "admin"
  });

  console.log("MAXAB admin account created successfully.");
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
