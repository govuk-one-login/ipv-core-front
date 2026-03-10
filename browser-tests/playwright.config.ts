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
  testIgnore: /\.features-gen/, // This ignores the generated playwright files for the e2e tests
  timeout: 90 * 1000,
  use: {
    baseURL: process.env?.WEBSITE_HOST || "http://localhost:4601",
    headless: true,
  },
  expect: {
    timeout: 40 * 1000,
  }
});
