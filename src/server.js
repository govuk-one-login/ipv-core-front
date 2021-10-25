const { createApp } = require("./app");
const http = require("http");

const app = createApp();
const port = process.env.PORT || 3000;

const server = http.createServer(app);

server
  .listen(port, () => {
    // eslint-disable-next-line no-console
    console.info(`Server listening on port ${port}`);
    app.emit("appStarted");
  })
  .on("error", (error) => {
    // eslint-disable-next-line no-console
    console.error(`Unable to start server because of ${error.message}`);
  });
