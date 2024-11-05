import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  workers: 6,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
      },
    },
  ],
  use: {
    baseURL: process.env?.WEBSITE_HOST || "http://localhost:4601",
    headless: true,
  },
});
