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
      return res.status(400).send("Email already Exists.");
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

router.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    req.session.user = req.user;
    if (req.user.role == "farmer") {
      res.redirect("/farmerDashBoard");
    } else if (req.user.role == "salesRep") {
      res.send("This is the Sale Rep dash board");
    } else if (req.user.role == "brooderManager") {
      res.send("This is the Brooder Manager dash board");
    } else {
      res.send("You do not have a role in the System");
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
      res.redirect("/");
    });
  }
});

module.exports = router;
