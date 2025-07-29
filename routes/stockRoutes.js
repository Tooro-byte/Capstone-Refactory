const express = require("express");
const router = express.Router();


const addNewStock = require("../models/addChicksModel");


router.get('/addchicks', async(req, res)=>{
     res.render("add-chicks")
})

router.post("/addchicks", async (req, res) => {
  try {
    console.log(req.body);
    const newChickStock = new addNewStock(req.body);
    await newChickStock.save();
  } catch (error) {
    console.error(error);
    res.status(400).render("400");
  }
});











module.exports = router;