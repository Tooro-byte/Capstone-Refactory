const express = require("express");
const router = express.Router();

const chickRequest = require("../models/chickRequestModel");
const User = require("../models/User");

const {
  ensureAuthenticated,
  ensureFarmer,
} = require("../middleware/authMiddleware");

router.get("/farmerDashBoard", ensureAuthenticated, ensureFarmer, async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error', 'Authentication failed. Please log in again.');
      return res.redirect('/login');
    }

    // Get counts for different request statuses
    const pendingRequests = await chickRequest.countDocuments({
      user: req.user._id,
      status: "Pending",
    });
    
    const approvedRequests = await chickRequest.countDocuments({
      user: req.user._id,
      status: "approved",
    });
    
    const dispatchedRequestsCount = await chickRequest.countDocuments({
      user: req.user._id,
      status: "dispatched",
    });

    const cancelledRequestsCount = await chickRequest.countDocuments({
      user: req.user._id,
      status: "canceled",
    });

    // Calculate farmer's total chick sales and numbers
    const farmerChickSales = await chickRequest.aggregate([
      { 
        $match: { 
          user: req.user._id, 
          status: { $in: ["approved", "dispatched"] } 
        } 
      },
      {
        $group: {
          _id: null,
          totalNumChicks: { $sum: "$numChicks" },
          totalChickSales: { $sum: "$totalCost" },
        },
      },
    ]);

    // Get recent requests for the farmer
    const farmerRequests = await chickRequest.find({ user: req.user._id })
      .populate("user", "fullname")
      .sort({ requestDate: -1 })
      .limit(5);

    // Get all requests for additional dashboard features
    const allRequests = await chickRequest.find({ user: req.user._id })
      .sort({ requestDate: -1 });

    res.render("farmerDashboard", {
      user: req.user,
      requests: farmerRequests,
      allRequests: allRequests,
      chickSales: farmerChickSales[0] || { totalNumChicks: 0, totalChickSales: 0 },
      pendingRequests,
      approvedRequests,
      dispatchedRequests: dispatchedRequestsCount,
      cancelledRequests: cancelledRequestsCount,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error rendering farmer dashboard:", error);
    req.flash('error', 'An error occurred while loading your dashboard. Please try again.');
    res.status(500).render("error-page", { error: "Failed to load dashboard" });
  }
});

module.exports = router;