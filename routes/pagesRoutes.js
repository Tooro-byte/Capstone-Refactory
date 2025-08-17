const express = require('express');
const router = express.Router();

router.get("/about", (req, res)=>{
    res.render("about")
})


router.get("/products", (req, res)=>{
    res.render("products")
})



router.get("/contact", (req, res)=>{
    res.render("contact")
})

router.get("/vaccines", (req, res)=>{
    res.render("vaccination")
})












module.exports = router;