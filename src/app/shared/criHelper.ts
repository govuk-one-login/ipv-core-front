export async function buildCredentialIssuerRedirectURL(req: any, res: any, next?: any) {
  const cri = req.cri
    ? req.cri
    : req.session?.criConfig?.find(
        (criConfig: any) => criConfig.id === req.query.id,
      );

  if (!cri) {
    res.status(500);
    return res.send("Could not find configured CRI");
  }
  req.redirectURL = new URL(cri.redirectUrl);

  if (next) {
    next();
  }
};

export async function redirectToAuthorize(req: any, res: any) {
  res.redirect(req.redirectURL);
};
