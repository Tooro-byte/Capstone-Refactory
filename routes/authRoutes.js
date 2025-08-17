const express = require("express");
const router = express.Router();

const User = require("../models/User");
const passport = require("passport");

router.get("/signup", (req, res) => {
  res.render("signup");
});
router.post("/signup", async (req, res) => {
  try {
    const user = new User(req.body);
    let existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send(" Hooray! Email already Exists, PLease try again later");
    } else {
      await User.register(user, req.body.password, (err) => {
        if (err) {
          throw err;
        }
        res.redirect("/login");
      });
    }
  } catch (error) {
    res.status(400).send("Sorry You were unable to signup");
  }
});

// Login Route
router.get("/login", (req, res) => {
  res.render("login");
});

router.post( "/login", passport.authenticate("local", { failureRedirect: "/login" }), (req, res) => {
    req.session.user = req.user;
    if (req.user.role == "farmer") {
      res.redirect("/farmerDashBoard");
    } else if (req.user.role == "SalesRep") {
      res.redirect("/sales-rep-board");
    } else if (req.user.role == "brooderManager") {
      res.redirect("/managerDashBoard")
    } else {
      res.status(400).send("You are not Part of us!")
    }
  }
);

// logout button

router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).send("Error Logging out!");
      }
      res.redirect("/index");
    });
  }
});

module.exports = router;
