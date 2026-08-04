import dotenv from "dotenv";
dotenv.config();

export const config = {
  FASTAPI_URL: process.env.FASTAPI_URL || "http://localhost:8000",
  PORT: process.env.PORT || 3000,
};