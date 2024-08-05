const { defineConfig } = require("@playwright/test");
require("dotenv").config();

export default defineConfig({
  use: {
    baseURL: process.env.WEBSITE_HOST,
  }
});
