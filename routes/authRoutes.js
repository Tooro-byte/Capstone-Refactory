const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const passport = require("passport");

// Signup Route
router.get("/signup", (req, res) => {
  res.render("signup");
});
router.post("/signup", async (req, res) => {
  try {
    //Create a new User
    const user = new User(req.body);
    // Check if User is already in the system
    let existingUser = await User.findOne({ email: req.body.email });
    //if user is found
    if (existingUser) {
      return res
        .status(400)
        .send(" Hooray! Email already Exists, PLease try again later");
    } else {
      //if user is not in the system create/ register one
      // The callback function now receives the newly created user document.
      await User.register(user, req.body.password, (err, registeredUser) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Sorry You were unable to signup");
        }

        // Generate a JWT for the newly registered user. We use the 'registeredUser' object here.
        const token = jwt.sign(
          {
            _id: registeredUser._id,
            name: registeredUser.name,
            role: registeredUser.role,
          },
          process.env.JWT_KEY,
          { expiresIn: "1hr" }
        );

        // Instead of a redirect, we send a JSON response with the token.
        res.status(200).json({
          message: "Registration successful",
          token: token,
          user: {
            _id: registeredUser._id,
            name: registeredUser.name,
            role: registeredUser.role,
          },
        });
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Sorry You were unable to signup");
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
    // Passport has successfully authenticated the user.
    // The authenticated user is available in req.user.
    const { _id, name, role } = req.user;

    // Generate a JWT for the authenticated user
    const token = jwt.sign(
      { _id: _id, name: name, role: role },
      process.env.JWT_KEY,
      {
        expiresIn: "1hr",
      }
    );
    // Send a JSON response with the token.
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        _id: _id,
        name: name,
        role: role,
      },
    });
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

// const express = require("express");
// const router = express.Router();
// const Jwt = require("jsonwebtoken");

// const User = require("../models/User");
// const passport = require("passport");

// router.get("/signup", (req, res) => {
//   res.render("signup");
// });
// router.post("/signup", async (req, res) => {
//   try {
//     //Create a new User
//     const user = new User(req.body);
//     // Check if User is already in the system
//     let existingUser = await User.findOne({ email: req.body.email });
//     //if user is found
//     if (existingUser) {
//       return res
//         .status(400)
//         .send(" Hooray! Email already Exists, PLease try again later");
//     } else {
//       //if user is not in the system create/ register one
//       await User.register(user, req.body.password, (err) => {
//         if (err) {
//           throw err;
//         }
//         res.redirect("/login");
//       });
//     }
//   } catch (error) {
//     res.status(400).send("Sorry You were unable to signup");
//   }
// });

// // Login Route
// router.get("/login", (req, res) => {
//   res.render("login");
// });

// router.post(
//   "/login",
//   passport.authenticate("local", { failureRedirect: "/login" }),
//   (req, res) => {
//     //Checking for an active session
//     req.session.user = req.user;
//     if (req.user.role == "farmer") {
//       res.redirect("/farmerDashBoard");
//     } else if (req.user.role == "SalesRep") {
//       res.redirect("/sales-rep-board");
//     } else if (req.user.role == "brooderManager") {
//       res.redirect("/managerDashBoard");
//     } else {
//       res.status(400).send("You are not Part of us!");
//     }
//   }
// );

// // logout button

// router.get("/logout", (req, res) => {
//   if (req.session) {
//     req.session.destroy((error) => {
//       if (error) {
//         return res.status(500).send("Error Logging out!");
//       }
//       res.redirect("/index");
//     });
//   }
// });

// module.exports = router;
