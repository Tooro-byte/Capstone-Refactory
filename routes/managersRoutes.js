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
router.get("/managerDashBoard", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const pendingRequests = await chickRequest.countDocuments({
      status: "Pending",
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
    
    // Get ALL pending requests for dashboard display
    const requests = await chickRequest.find({ status: "Pending" })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    
    // Get current manager from session or request user
    const currentManager = req.user || req.session.user;
    
    // Log for debugging
    console.log("Current Manager:", currentManager);
    console.log("Total pending requests found for dashboard:", requests.length);
    console.log("Pending requests count from database:", pendingRequests);
    
    // Calculate total stock with better aggregation
    const totalStock = await chickStock.aggregate([
      {
        $group: {
          _id: null,
          totalChicks: { $sum: "$number" }
        }
      }
    ]);

    // Calculate stock alerts - stocks below threshold
    const lowStockThreshold = 150;
    const stockAlertsQuery = await chickStock.find({
      number: { $lte: lowStockThreshold }
    }).lean();
    
    // Filter out stocks that are exactly 0 (completely out of stock gets different treatment)
    const stockAlerts = stockAlertsQuery.filter(stock => stock.number > 0 && stock.number <= lowStockThreshold);
    const outOfStock = stockAlertsQuery.filter(stock => stock.number === 0);

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
      stockAlerts,
      outOfStock,
      currentManager,
      chickSales: chickSales[0] || { totalNumChicks: 0, totalChickSales: 0 },
      totalStock: totalStock[0] || { totalChicks: 0 },
      pendingRequests,
      approvedRequests,
      dispatchedRequests,
      totalNumOfFarmers,
      currency: "UGX",
      currencySymbol: "UGX" // Add currency symbol for templates
    });
  } catch (error) {
    console.error("Error in manager dashboard:", error);
    req.flash('error', 'Failed to load dashboard data.');
    res.redirect("/");
  }
});

// Manager Requests route - Get ALL requests for management
router.get("/manageRequests", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    // Get ALL requests for management view
    const allRequests = await chickRequest.find().populate("user", "name email").sort({ createdAt: -1 });
    const currentManager = req.user || req.session.user;
    
    console.log("Total requests found for management:", allRequests.length);
    
    res.render("manager-requests", { 
      requests: allRequests,
      currentManager,
      currency: "UGX",
      currencySymbol: "UGX"
    });
  } catch (error) {
    console.error("Error fetching all requests for manager:", error);
    req.flash('error', 'Failed to load requests for management.');
    res.redirect('/managerDashBoard');
  }
});

// API endpoint to get dashboard stats
router.get("/api/dashboard-stats", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const pendingRequests = await chickRequest.countDocuments({
      status: "Pending",
    });
    const approvedRequests = await chickRequest.countDocuments({
      status: "approved",
    });
    const dispatchedRequests = await chickRequest.countDocuments({
      status: "dispatched",
    });
    
    const totalStock = await chickStock.aggregate([
      {
        $group: {
          _id: null,
          totalChicks: { $sum: "$number" }
        }
      }
    ]);

    // Calculate stock alerts with proper logic
    const lowStockThreshold = 150;
    const stockAlertsQuery = await chickStock.find({
      number: { $lte: lowStockThreshold }
    }).lean();
    
    const stockAlerts = stockAlertsQuery.filter(stock => stock.number > 0 && stock.number <= lowStockThreshold);
    const outOfStock = stockAlertsQuery.filter(stock => stock.number === 0);

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

    // Get recent pending requests for API response
    const recentPendingRequests = await chickRequest.find({ status: "Pending" })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5); // Limit for API performance

    res.json({
      success: true,
      data: {
        pendingRequests,
        approvedRequests,
        dispatchedRequests,
        totalStock: totalStock[0] || { totalChicks: 0 },
        stockAlerts: stockAlerts.length,
        stockAlertsDetails: stockAlerts,
        outOfStockCount: outOfStock.length,
        outOfStockDetails: outOfStock,
        chickSales: chickSales[0] || { totalNumChicks: 0, totalChickSales: 0 },
        pendingRequestsList: recentPendingRequests,
        currency: "UGX",
        currencySymbol: "UGX"
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// API endpoint to dispatch request
router.post(
  "/api/requests/:id/dispatch",
  ensureAuthenticated,
  ensureManager,
  async (req, res) => {
    try {
      const order = await chickRequest.findById(req.params.id).populate("user");

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      if (order.status !== "approved") {
        return res.status(400).json({ 
          success: false, 
          message: "Only approved requests can be dispatched" 
        });
      }

      // Update order status
      order.status = "dispatched";
      order.dispatchedDate = new Date();
      order.dispatchedBy = req.user ? req.user._id : req.session.user._id;
      await order.save();

      // Get updated stats
      const updatedStats = await getUpdatedStats();

      res.json({ 
        success: true, 
        message: `Request dispatched successfully for ${order.user.name}`,
        updatedStats,
        dispatchedOrder: {
          id: order._id,
          farmerName: order.user.name,
          chickType: order.chickType,
          numChicks: order.numChicks,
          totalCost: order.totalCost
        }
      });
    } catch (err) {
      console.error("Error dispatching request:", err.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to dispatch request" 
      });
    }
  }
);

// API endpoint to cancel request
router.post(
  "/api/requests/:id/cancel",
  ensureAuthenticated,
  ensureManager,
  async (req, res) => {
    try {
      const order = await chickRequest.findById(req.params.id).populate("user");

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // If the order was approved, we need to restore the stock
      if (order.status === "approved") {
        const stock = await chickStock.findOne({
          type: order.chickType,
        });

        if (stock) {
          stock.number += order.numChicks;
          await stock.save();
        }
      }

      order.status = "canceled";
      order.canceledDate = new Date();
      order.rejectionReason = req.body.rejectionReason || "Canceled by manager";
      order.rejectedBy = req.user ? req.user._id : req.session.user._id;

      await order.save();

      // Get updated stats
      const updatedStats = await getUpdatedStats();

      res.json({ 
        success: true, 
        message: `Request canceled successfully for ${order.user.name}`,
        updatedStats,
        canceledOrder: {
          id: order._id,
          farmerName: order.user.name,
          rejectionReason: order.rejectionReason
        }
      });
    } catch (err) {
      console.error("Error canceling request:", err.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to cancel request" 
      });
    }
  }
);

// AJAX Approve Request
router.post(
  "/api/requests/:id/approve",
  ensureAuthenticated,
  ensureManager,
  async (req, res) => {
    try {
      const order = await chickRequest.findById(req.params.id).populate("user");

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      // Check stock - find matching stock by type
      const stock = await chickStock.findOne({
        type: order.chickType,
      });

      if (!stock || stock.number < order.numChicks) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for this request. Available: ${stock ? stock.number : 0}, Requested: ${order.numChicks}` 
        });
      }

      // Update stock
      stock.number -= order.numChicks;
      await stock.save();

      // Update order status
      order.status = "approved";
      order.approvedDate = new Date();
      order.approvedBy = req.user ? req.user._id : req.session.user._id;
      await order.save();

      // Get updated stats
      const updatedStats = await getUpdatedStats();

      // Log the approval for debugging
      console.log(`Request ${order._id} approved by ${req.user ? req.user.name : req.session.user.name}`);
      
      res.json({ 
        success: true, 
        message: `Request approved successfully for ${order.user.name}`,
        updatedStats,
        approvedOrder: {
          id: order._id,
          farmerName: order.user.name,
          chickType: order.chickType,
          numChicks: order.numChicks,
          totalCost: order.totalCost
        }
      });
    } catch (err) {
      console.error("Error approving request:", err.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to approve request" 
      });
    }
  }
);

// AJAX Reject Request
router.post(
  "/api/requests/:id/reject",
  ensureAuthenticated,
  ensureManager,
  async (req, res) => {
    try {
      const order = await chickRequest.findById(req.params.id).populate("user");

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }

      order.status = "canceled";
      order.canceledDate = new Date();
      order.rejectionReason = req.body.rejectionReason || "No reason provided";
      order.rejectedBy = req.user ? req.user._id : req.session.user._id;

      await order.save();

      // Get updated stats
      const updatedStats = await getUpdatedStats();

      res.json({ 
        success: true, 
        message: `Request rejected successfully for ${order.user.name}`,
        updatedStats,
        rejectedOrder: {
          id: order._id,
          farmerName: order.user.name,
          rejectionReason: order.rejectionReason
        }
      });
    } catch (err) {
      console.error("Error rejecting request:", err.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to reject request" 
      });
    }
  }
);

// Helper function to get updated stats
async function getUpdatedStats() {
  const pendingRequests = await chickRequest.countDocuments({
    status: "Pending",
  });
  const approvedRequests = await chickRequest.countDocuments({
    status: "approved",
  });
  const dispatchedRequests = await chickRequest.countDocuments({
    status: "dispatched",
  });
  
  const totalStock = await chickStock.aggregate([
    {
      $group: {
        _id: null,
        totalChicks: { $sum: "$number" }
      }
    }
  ]);

  // Calculate stock alerts
  const lowStockThreshold = 150;
  const stockAlertsQuery = await chickStock.find({
    number: { $lte: lowStockThreshold }
  }).lean();
  
  const stockAlerts = stockAlertsQuery.filter(stock => stock.number > 0 && stock.number <= lowStockThreshold);
  const outOfStock = stockAlertsQuery.filter(stock => stock.number === 0);

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

  // Get pending requests for updated stats
  const pendingRequestsList = await chickRequest.find({ status: "Pending" })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(5);
    
  const stock = await chickStock.find();

  return {
    pendingRequests,
    approvedRequests,
    dispatchedRequests,
    totalStock: totalStock[0] || { totalChicks: 0 },
    stockAlerts: stockAlerts.length,
    stockAlertsDetails: stockAlerts,
    outOfStockCount: outOfStock.length,
    outOfStockDetails: outOfStock,
    chickSales: chickSales[0] || { totalNumChicks: 0, totalChickSales: 0 },
    pendingRequestsList,
    stock,
    currency: "UGX",
    currencySymbol: "UGX"
  };
}

// Get manager profile
router.get("/profile", ensureAuthenticated, ensureManager, async (req, res) => {
  try {
    const currentManager = req.user || req.session.user;
    res.render("manager-profile", { 
      currentManager,
      currency: "UGX",
      currencySymbol: "UGX"
    });
  } catch (error) {
    console.error("Error loading manager profile:", error);
    req.flash('error', 'Failed to load profile.');
    res.redirect('/managerDashBoard');
  }
});

module.exports = router;