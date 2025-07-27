const express = require("express");
const router = express.Router();
const chickRequest = require("../models/chickRequestModel");
const User = require("../models/User");

const {
  ensureAuthenticated,
  ensureManager,
} = require("../middleware/authMiddleware");


router.get("/farmerDashBoard", async (req, res) => {
  // Check session first, then req.user as fallback
  let user = req.session.user || req.user;

  // If no user is available (e.g., not logged in, or middleware failed),
  // provide a default user object to prevent "Cannot read properties of undefined"
  if (!user) {
    // return res.redirect('/login');
    user = {
      _id: 'guest',
      name: 'Guest Farmer',
      farmerType: 'N/A',
      email: 'guest@example.com',
      phone: 'N/A',
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
    // Ensure user._id is valid b4 querying
    if (user._id && user._id !== 'guest') {
      allRequests = await chickRequest.find({ user: user._id }).sort({ requestDate: -1 });

      // Get recent requests (last 5)
      recentRequests = await chickRequest.find({ user: user._id })
        .populate("user", "name")
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
    // Setting counts to 0 and requests to empty array to easily catch eerors error
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
    messages: req.flash ? req.flash() : {},
  });
});

router.post("/farmerDashBoard", async (req, res) => {
  try {
    res.redirect("/farmerDashBoard");
  } catch (error) {
    console.error("Error processing dashboard POST request:", error);
    res.status(500).send("Internal Server Error");
  }
});

// -------------------------------------------------------------------------
// -----------Get List of Young4Chicks Farmers from the data base-----------

router.get(
  "/userlist",
  // ensureAuthenticated,
  // ensureManager,
  async (req, res) => {
    try {
      let users = await User.find().sort({ $natural: -1 }); //.limit(number of people returned from db)
      res.render("userLists", { users });
    } catch (error) {
      res.status(400).send("Unable to find requested Users");
    }
  }
);

//Updating Farmer 
router.get("/updateuser/:id", async (req, res) => {
  try {
    const userId = req.params.id; // Get the user ID from the URL parameter
    const updateUser = await User.findOne({ _id: userId }); // Find the user in the database

    // Check if the user was found before rendering the template
    if (!updateUser) {
      console.log(`User with ID ${userId} not found for update form.`);
      return res.status(404).send("User not found in the database for update.");
      // return res.redirect('/userlist');
    }

    // If user is found, render the update-user template and pass the user object
    res.render("update-user", { user: updateUser });
  } catch (error) {
    // This catch block handles database connection errors or invalid ID format errors
    console.error("Error fetching user for update form:", error.message);
    res.status(400).send("Unable to retrieve user data for update.");
  }
});

router.post("/updateuser", async (req, res) => {
  try {
    await User.findByIdAndUpdate({ _id: req.query.id }, req.body);
    res.redirect("/userlist");
  } catch (error) {
    res.status(400).send("Update Failed");
    console.log(error.message);
  }
});

//Deleting Farmer From the Data Base
router.post("/deleteuser", async (req, res) => {
  try {
    await User.deleteOne({ _id: req.body.id });
    res.redirect("/userlist");
  } catch (error) {
    res.status(400).send("Unable to delete user");
    console.log(error.message);
  }
});

module.exports = router;