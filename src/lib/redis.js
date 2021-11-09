const cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();

module.exports = () => {
  const cfRedisUrl = appEnv.getServiceURL("session-cache");
  if (cfRedisUrl) {
    return {
      connectionString: cfRedisUrl,
    };
  }

  if (!process.env.REDIS_SESSION_URL) {
    return {};
  }

  const host = process.env.REDIS_SESSION_URL;
  const port = process.env.REDIS_PORT || 6379;
  const scheme = "redis";

  return {
    connectionString: `${scheme}://${host}:${port}`,
    retry_strategy: function (options) {
      if (options.error && options.error.code === "ECONNREFUSED") {
        // End reconnecting on a specific error and flush all commands with
        // a individual error
        return new Error("The server refused the connection");
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after a specific timeout and flush all commands
        // with a individual error
        return new Error("Retry time exhausted");
      }
      if (options.attempt > 10) {
        // End reconnecting with built in error
        return undefined;
      }
      // reconnect after
      return Math.min(options.attempt * 100, 3000);
    },
  };
};
