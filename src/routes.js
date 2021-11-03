const oauth2 = require("./app/oauth2");

module.exports = function initialiseRoutes(app) {
  app.use(oauth2.mountpath, oauth2.router);
};
