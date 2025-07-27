const express = require("express");
const router = express.Router();

// const chickRequest = require("../models/chickRequestModel"); // Import your chickRequest model
// const User = require("../models/User");

router.get("/managersBoard", async(req, res)=>{
    res.render('manager-dash-board')
})


module.exports = router;