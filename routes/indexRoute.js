const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  if (!req.session.hasSeenSplash) {
    req.session.hasSeenSplash = true;
    return res.render("welcomescreen");
  }
  
  res.redirect("/index");
});

router.get("/index", (req, res) => {
  res.render("index");
});

module.exports = router;