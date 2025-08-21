const express = require("express");
const router = express.Router();
const moment = require("moment");

const addNewStock = require("../models/addChicksModel");
const displayChickStock = require("../models/addChicksModel");


router.get('/addchicks', async(req, res)=>{
     res.render("add-chicks")
})

router.post("/addchicks", async (req, res) => {
  try {
    console.log(req.body);
    const newChickStock = new addNewStock(req.body);
    await newChickStock.save();
    res.redirect("/managerDashBoard"); 
  } catch (error) {
    console.error(error);
    res.status(400).render("400");
  }
});

// Get a list of Chicks Added Per Day By Young For Chicks Stock Managers
router.get("/chickslist", async (req, res) => {
  try {
    let chicks = await displayChickStock.find().sort({ $natural: -1 }); //.limit(number of chick returned from db)
    res.render("addChicksLists", { chicks });
  } catch (error) {
    res
      .status(400)
      .send("Unable to find requested List. Please Try again Later!");
  }
});

// Updating and Deleting Chick Stock
//Upadate Route.
router.get("/updatechick/:id", async (req, res) => {
  try {
    const chickId = req.params.id;
    const updateChick = await displayChickStock.findOne({ _id: chickId });
// If there no chick entry to Update
    if (!updateChick) {
      return res.status(404).send("Chick entry not found in the database for update.");
    }

    res.render("updateChickForm", { chick: updateChick, moment: moment });
  } catch (error) {
    res.status(400).send("Unable to retrieve chick data for update.");
  }
});
// Chicks Update Route
router.post("/updatechick", async (req, res) => {
  try {
    const chickId = req.body.id;
    await displayChickStock.findByIdAndUpdate(chickId, req.body);
    res.redirect("/chickslist");
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).send("Update Failed");
  }
});

// --- DELETE CHICK STOCK (POST) ---
router.post("/deletechick", async (req, res) => {
  try {
    await displayChickStock.deleteOne({ _id: req.body.id });
    res.redirect("/chickslist");
  } catch (error) {
    res.status(400).send("Unable to delete chick");
  }
});

module.exports = router;