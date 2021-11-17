require("dotenv").config();

module.exports = {
  API_BASE_URL: process.env.API_BASE_URL,
  AUTH_PATH: "/authorize",
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
};
