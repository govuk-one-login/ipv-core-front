const { defineConfig, devices } = require("@playwright/test");
require("dotenv").config();

export default defineConfig({
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
    baseURL: process.env?.WEBSITE_HOST || "http://localhost:4501",
    headless: true,
  },
});
