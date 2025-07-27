const express = require("express");
const router = express.Router();
const chickRequest = require("../models/chickRequestModel"); // Import your chickRequest model
const User = require("../models/User"); // Assuming you have a User model (e.g., from your auth system)

router.get("/farmerDashBoard", async (req, res) => {
  // Check session first, then req.user as fallback
  let user = req.session.user || req.user;

  // If no user is available (e.g., not logged in, or middleware failed),
  // provide a default user object to prevent "Cannot read properties of undefined"
  if (!user) {
    // return res.redirect('/login');
    user = {
      _id: 'guest', // Provide a dummy ID for consistency if needed
      name: 'Guest Farmer', // Changed from fullname to name to match schema
      farmerType: 'N/A',
      email: 'guest@example.com',
      phone: 'N/A', // Changed from phoneNumber to phone to match schema
      location: 'N/A',
      createdAt: new Date(),
    };
  } else {
    // If user exists, fetch the full user document from DB to ensure all fields are present
    // This is important if the session only contains basic info.
    try {
      const fullUser = await User.findById(user._id);
      if (fullUser) {
        user = fullUser; // Use the full user object from the database
      } else {
        // User not found in DB, fallback to basic session user
        console.warn(`User with ID ${user._id} not found in database, using session user info.`);
      }
    } catch (dbError) {
      console.error("Error fetching full user data from DB:", dbError);
      // Continue with the basic session user if DB fetch fails
    }
  }

  let pendingRequestsCount = 0;
  let approvedRequestsCount = 0;
  let dispatchedRequestsCount = 0;
  let cancelledRequestsCount = 0;
  let totalChicksReceived = 0;
  let totalChickSales = 0;
  let allRequests = [];
  let recentRequests = [];

  try {
    // Fetch requests for the current user
    // Ensure user._id is valid before querying
    if (user._id && user._id !== 'guest') {
      allRequests = await chickRequest.find({ user: user._id }).sort({ requestDate: -1 });
      
      // Get recent requests (last 5)
      recentRequests = await chickRequest.find({ user: user._id })
        .populate("user", "name") // Changed from fullname to name
        .sort({ requestDate: -1 })
        .limit(5);

      // Calculate counts and totals
      pendingRequestsCount = allRequests.filter(req => req.status === 'Pending').length;
      approvedRequestsCount = allRequests.filter(req => req.status === 'approved').length;
      dispatchedRequestsCount = allRequests.filter(req => req.status === 'dispatched').length;
      cancelledRequestsCount = allRequests.filter(req => req.status === 'canceled').length;
      
      // Calculate totals for approved and dispatched requests
      const completedRequests = allRequests.filter(req => 
        req.status === 'approved' || req.status === 'dispatched'
      );
      
      totalChicksReceived = completedRequests.reduce((sum, req) => sum + req.numChicks, 0);
      totalChickSales = completedRequests.reduce((sum, req) => sum + (req.totalCost || 0), 0);
    }

  } catch (error) {
    console.error("Error fetching requests for farmer dashboard:", error);
    // Set counts to 0 and requests to empty array in case of error
    pendingRequestsCount = 0;
    approvedRequestsCount = 0;
    dispatchedRequestsCount = 0;
    cancelledRequestsCount = 0;
    totalChicksReceived = 0;
    totalChickSales = 0;
    allRequests = [];
    recentRequests = [];
  }

  res.render("farmers-dash-board", {
    user: user, // Pass the user object, now guaranteed to be defined
    pendingRequests: pendingRequestsCount,
    approvedRequests: approvedRequestsCount,
    dispatchedRequests: dispatchedRequestsCount,
    cancelledRequests: cancelledRequestsCount,
    chickSales: { 
      totalNumChicks: totalChicksReceived,
      totalChickSales: totalChickSales 
    },
    requests: recentRequests,
    allRequests: allRequests,
    messages: req.flash ? req.flash() : {}, // Assuming connect-flash for messages
  });
});

router.post("/farmerDashBoard", async (req, res) => {
  try {
    // This POST route seems to be a simple redirect,
    // ensure it handles any necessary data processing or validation
    // before redirecting, if applicable.
    res.redirect("/farmerDashBoard");
  } catch (error) {
    console.error("Error processing dashboard POST request:", error);
    res.status(500).send("Internal Server Error");
  }
});
 
module.exports = router;