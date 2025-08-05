const express = require("express");
const router = express.Router();

const chickRequest = require("../models/chickRequestModel");
const User = require("../models/User");
const chickStock = require("../models/addChicksModel");
const {
  ensureAuthenticated,
  ensureManager,
} = require("../middleware/authMiddleware");

//Managers Route
router.get("/managerDashBoard", async (req, res) => {
  try {
    const pendingRequests = await chickRequest.countDocuments({
      status: "pending",
    });
    const approvedRequests = await chickRequest.countDocuments({
      status: "approved",
    });
    const dispatchedRequests = await chickRequest.countDocuments({
      status: "dispatched",
    });
    const totalNumOfFarmers = await User.countDocuments({ role: "farmer" });
    const users = await User.find();
    const farmers = await User.find({ role: "farmer" });
    const stock = await chickStock.find();
    const requests = await chickRequest.find().populate("user", "name");
    
    // Calculate total stock
    const totalStock = await chickStock.aggregate([
      {
        $group: {
          _id: null,
          totalChicks: { $sum: "$number" }
        }
      }
    ]);

    const chickSales = await chickRequest.aggregate([
      { $match: { status: { $in: ["approved", "dispatched"] } } },
      {
        $group: {
          _id: null,
          totalNumChicks: { $sum: "$numChicks" },
          totalChickSales: { $sum: "$totalCost" },
        },
      },
    ]);

    res.render("manager-dash-board", {
      users,
      farmers,
      stock,
      requests,
      chickSales: chickSales[0] || { totalNumChicks: 0, totalChickSales: 0 },
      totalStock: totalStock[0] || { totalChicks: 0 },
      pendingRequests,
      approvedRequests,
      dispatchedRequests,
      totalNumOfFarmers,
    });
  } catch (error) {
    console.error("Error in manager dashboard:", error);
    res.redirect("/");
  }
});

router.get("/requests", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const allRequests = await chickRequest.find().populate("user", "name");
    res.render("manager-requests", { requests: allRequests });
  } catch (error) {
    console.error("Error fetching all requests for manager:", error);
    req.flash('error', 'Failed to load requests for management.');
    res.redirect('/managerDashBoard');
  }
});

// Approve Request
router.post(
  "/requests/:id",
  ensureAuthenticated,
  ensureManager,
  async (req, res) => {
    try {
      const order = await chickRequest.findById(req.params.id).populate("user");

      if (!order) {
        req.flash("error", "Order not found");
        return res.redirect("/requests");
      }

      // Check stock - find matching stock by type
      const stock = await chickStock.findOne({
        type: order.chickType,
      });

      if (!stock || stock.number < order.numChicks) {
        req.flash("error", "Insufficient stock");
        return res.redirect("/requests");
      }

      // Update stock
      stock.number -= order.numChicks;
      await stock.save();

      // Update order status
      order.status = "approved";
      order.approvedDate = new Date();
      await order.save();

      req.flash("success", "Request approved successfully");
      res.redirect("/requests");
    } catch (err) {
      console.error(err.message);
      req.flash("error", "Failed to approve request");
      res.redirect("/managerDashBoard");
    }
  }
);

// Reject Request
router.post(
  "/requests/reject/:id",
  ensureAuthenticated,
  ensureManager,
  async (req, res) => {
    try {
      const order = await chickRequest.findById(req.params.id);

      if (!order) {
        req.flash("error", "Order not found");
        return res.redirect("/requests");
      }

      order.status = "canceled";
      order.canceledDate = new Date();
      order.rejectionReason = req.body.rejectionReason || "";

      await order.save();

      req.flash("success", "Request rejected successfully");
      res.redirect("/requests");
    } catch (err) {
      console.error(err.message);
      req.flash("error", "Failed to reject request");
      res.redirect("/managerDashBoard");
    }
  }
);

module.exports = router;