const { logError } = require("./loggerHelper");

export default async function saveSessionAndRedirect(req: any, res: any, redirectUrl: string) {
  await req.session.save(function (err: any) {
    if (err) {
      logError(req, err, "Error saving session");
      throw err;
    }
    return res.redirect(redirectUrl);
  });
}
