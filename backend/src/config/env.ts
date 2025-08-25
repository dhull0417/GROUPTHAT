// env.ts

import dotenv from "dotenv";
dotenv.config();

// List of essential variables
const requiredEnvs = [
  "MONGO_URI",
  "CLERK_SECRET_KEY",
  "ARCJET_KEY",
];

// Check each essential variable
for (const envName of requiredEnvs) {
  if (!process.env[envName]) {
    throw new Error(`FATAL ERROR: Environment variable ${envName} is not defined.`);
  }
}

// Export the now-validated and typed environment variables
export const ENV = {
  // Optional variables with fallback values
  PORT: process.env.PORT ?? "5000",
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // Essential variables (TypeScript now knows these are strings)
  MONGO_URI: process.env.MONGO_URI as string,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY, // Often not needed on the backend
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
  ARCJET_KEY: process.env.ARCJET_KEY as string,
};