const express = require("express");
const router = express.Router();
const {
  ensureAuthenticated,
  ensureFarmer,
} = require("../middleware/authMiddleware");

const chickRequest = require("../models/chickRequestModel");

// Route to display the chick request form
router.get(
  "/chickRequest",
  ensureAuthenticated, // Ensure user is logged in
  ensureFarmer,        // Ensure user has 'farmer' role
  async (req, res) => {
    try {
      // Find all chick requests associated with the currently logged-in user
      // Using req.user._id as populated by Passport
      const requests = await chickRequest.find({user: req.user._id});

      // Determine if the farmer is a 'starter' based on whether they have existing requests
      const isStarter = requests.length === 0;

      console.log("Chick Requests for user:", req.user._id, requests);
      console.log("Is Starter Farmer:", isStarter);

      // Render the chickRequest Pug template, passing the isStarter boolean
      res.render("chickRequest", {
        isStarter: isStarter,
        errorMessage: null, // Initialize error message as null for initial load
        formData: {}        // Initialize empty form data for initial load
      });
    } catch (error) {
      console.error("Error fetching chick requests:", error.message);
      // If there's an error fetching requests, redirect to dashboard or show an error page
      res.status(500).redirect("/farmerDashBoard?error=failedToLoadRequests");
    }
  }
);

// Route to handle the submission of the chick request form
router.post(
  "/chickRequest",
  ensureAuthenticated, // Ensure user is logged in
  ensureFarmer,        // Ensure user has 'farmer' role
  async (req, res) => {
    try {
      const {
        farmerType,
        chickType,
        numChicks,
        unitPrice,
        totalCost,
        requestDate,
        comments,
      } = req.body;

      // Validate required fields
      if (!farmerType || !chickType || !numChicks || !requestDate) {
        throw new Error("Please fill in all required fields.");
      }

      // Get the user ID from the authenticated user object (Passport populates req.user)
      const userId = req.user._id;

      // Additional validation based on farmer type
      const numChicksInt = parseInt(numChicks);
      if (farmerType === 'starter' && (numChicksInt < 1 || numChicksInt > 100)) {
        throw new Error("Starter farmers can request between 1 and 100 chicks.");
      }
      if (farmerType === 'returning' && (numChicksInt < 300 || numChicksInt > 500)) {
        throw new Error("Returning farmers can request between 300 and 500 chicks.");
      }

      // Create a new chick request instance with the data
      const newRequest = new chickRequest({
        farmerType,
        chickType,
        numChicks: numChicksInt, // Ensure number fields are parsed
        unitPrice: parseFloat(unitPrice) || 1650, // Default to 1650 if not provided
        totalCost: parseFloat(totalCost) || (numChicksInt * (parseFloat(unitPrice) || 1650)), // Calculate if not provided
        requestDate: new Date(requestDate), // Ensure proper date format
        comments: comments || '', // Default to empty string if not provided
        user: userId, // Link the request to the user
        status: "Pending" // Set an initial status for the request
      });

      // Save the new request to the database
      await newRequest.save();

      console.log("Chick Request Successfully Submitted:", newRequest);

      // Redirect to the farmer dashboard upon successful submission
      res.redirect("/farmerDashBoard?status=requestSubmitted");

    } catch (error) {
      console.error("Error submitting chick request:", error);

      // If there's a validation error from Mongoose or other issues,
      // re-render the form with an error message and the user's input
      let errorMessage = "Error submitting your request. Please check your inputs.";
      if (error.name === 'ValidationError') {
        // Mongoose validation error
        errorMessage = Object.values(error.errors).map(err => err.message).join('<br>');
      } else {
        errorMessage = error.message || "An unexpected error occurred.";
      }

      try {
        // Re-rendering the chickRequest form, passing the error and previous form data
        // To allow the user to correct mistakes without re-entering everything
        const requests = await chickRequest.find({
            user: req.user._id,
        });
        const isStarter = requests.length === 0;

        res.status(400).render("chickRequest", {
          isStarter: isStarter,
          errorMessage: errorMessage,
          formData: req.body // Pass back the submitted data to pre-fill the form
        });
      } catch (renderError) {
        console.error("Error re-rendering form:", renderError);
        res.status(500).redirect("/farmerDashBoard?error=submissionFailed");
      }
    }
  }
);
module.exports = router;
