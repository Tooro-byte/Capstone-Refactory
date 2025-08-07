//1a: Young For Chicks Dependencies
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const moment = require("moment");
const flash = require('connect-flash');
const expressSession = require("express-session")({
  secret: "Tooro-byte",
  resave: false,
  saveUninitialized: false,
});

require("dotenv").config();
// Import the User Model
const User = require("./models/User");

//1b: Importing Different Routes
const indexRoute = require("./routes/indexRoute");
const signupRoute = require("./routes/authRoutes");
const chicksRoute = require("./routes/chicksRoutes")
const farmersRoute = require("./routes/farmersRoutes");
const managerRoute = require("./routes/managersRoutes");
const stockRoutes = require('./routes/stockRoutes');
const salesRepRoute = require('./routes/salesRepoRoutes');
const pageRoutes = require("./routes/pagesRoutes");



const{error} = console;
// 2: Young for Chicks Instantiations
const app = express();
const port = 3003;

//3: Young for Chicks Configuration Settings
app.locals.moment = moment;
mongoose.connect(process.env.DATABASE);
mongoose.connection
  .once("open", () => {
    console.log(`Secure Connection has been established for Mongoose`);
  })
  .on("error", () => {
    console.error(error.message);
  });
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//4a: Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

//Express Session Configurations
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

// Configure connect-flash middleware
app.use(flash());

// Make flash messages available to all templates (optional but good practice)
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.error = req.flash('error'); // Common for passport, etc.
  next();
});

//Passport Configurations
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//4b: Using Imported routes from the routes folder
app.use("/", indexRoute);
app.use("/", signupRoute);
app.use('/', chicksRoute);
app.use('/', farmersRoute);
app.use('/', managerRoute);
app.use('/', stockRoutes);
app.use("/", salesRepRoute);
app.use("/", pageRoutes)

//Handling Non -existing routes.
app.use((req, res) => {
  res.status(404).render("400");
});

//6: Bootstrapping the Server
//Always put this line of code at the enf of the index.js file.
app.listen(port, () => {
  console.log(`Young For Chicks Server has started running on Port ${port}`);
});
