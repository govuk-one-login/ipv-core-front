module.exports = {
  renderDebugPage: async (req, res) => {
    res.render("debug/debug", { criConfig: req.session.criConfig });
  },
};
