const express = require('express');
const router = express.Router();
const FeedsRequest = require('../models/feedsModel');
const User = require('../models/User');

const {
  ensureAuthenticated,
  ensureFarmer,
} = require("../middleware/authMiddleware");


// Feed prices configuration
const FEED_PRICES = {
  starter: 45000,  // UGX per bag
  grower: 42000,
  layer: 40000,
  broiler: 43000
};

// GET route - render feeds request form
router.get('/feedsReq', ensureAuthenticated, ensureFarmer,(req, res) => {
  res.render("feeds");
});

// POST route - handle feeds request submission
router.post('/feedsReq', ensureAuthenticated, ensureFarmer, async (req, res) => {
  try {
    const {
      farmerName,
      farmerPhone,
      farmerNIN,
      farmerType,
      currentChicks,
      farmLocation,
      feedTypes,
      feedQuantity,
      urgency,
      specialRequirements
    } = req.body;

    // Parse feedTypes if it comes as JSON string from frontend
    let parsedFeedTypes;
    if (typeof feedTypes === 'string') {
      try {
        parsedFeedTypes = JSON.parse(feedTypes);
      } catch (e) {
        parsedFeedTypes = [feedTypes];
      }
    } else {
      parsedFeedTypes = Array.isArray(feedTypes) ? feedTypes : [feedTypes];
    }

    // Input validation
    const validationErrors = [];

    if (!farmerName?.trim()) validationErrors.push('Farmer name is required');
    if (!farmerPhone?.trim()) validationErrors.push('Phone number is required');
    if (!farmerNIN?.trim()) validationErrors.push('NIN number is required');
    if (!farmerType) validationErrors.push('Farmer type is required');
    if (!currentChicks && currentChicks !== 0) validationErrors.push('Current chicks count is required');
    if (!farmLocation?.trim()) validationErrors.push('Farm location is required');
    if (!parsedFeedTypes || parsedFeedTypes.length === 0) {
      validationErrors.push('Please select at least one feed type');
    }
    if (!feedQuantity) validationErrors.push('Feed quantity is required');
    if (!urgency) validationErrors.push('Urgency level is required');

    // Additional validations
    const quantity = parseInt(feedQuantity);
    if (quantity < 1 || quantity > 2) {
      validationErrors.push('Feed quantity must be between 1 and 2 bags');
    }

    const chicksCount = parseInt(currentChicks);
    if (chicksCount < 0) {
      validationErrors.push('Current chicks count cannot be negative');
    }

    // Validate feed types
    const selectedFeedTypes = parsedFeedTypes;
    const validFeedTypes = ['starter', 'grower', 'layer', 'broiler'];
    const invalidFeedTypes = selectedFeedTypes.filter(type => !validFeedTypes.includes(type));
    if (invalidFeedTypes.length > 0) {
      validationErrors.push('Invalid feed type(s) selected');
    }

    // Validate urgency
    const validUrgencyLevels = ['normal', 'urgent', 'emergency'];
    if (!validUrgencyLevels.includes(urgency)) {
      validationErrors.push('Invalid urgency level');
    }

    // Validate farmer type
    const validFarmerTypes = ['starter', 'returning'];
    if (!validFarmerTypes.includes(farmerType)) {
      validationErrors.push('Invalid farmer type');
    }

    if (validationErrors.length > 0) {
      req.flash('error_msg', validationErrors.join(', '));
      return res.redirect('/feedsReq');
    }

    // Get current user details
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      req.flash('error_msg', 'User not found. Please log in again.');
      return res.redirect('/login');
    }

    // Check for existing pending requests
    const existingPendingRequest = await FeedsRequest.findOne({
      farmer: currentUser._id,
      status: { $in: ['pending', 'approved', 'processing', 'ready', 'dispatched'] }
    });

    if (existingPendingRequest) {
      req.flash('error_msg', `You already have a pending feeds request (${existingPendingRequest.requestId}). Please wait for it to be processed before submitting a new request.`);
      return res.redirect('/feedsReq');
    }

    // Calculate feed details and total cost
    const feedDetails = selectedFeedTypes.map((feedType, index) => {
      const unitPrice = FEED_PRICES[feedType] || 0;
      // Distribute bags evenly among selected feed types
      const baseQuantityPerType = Math.floor(quantity / selectedFeedTypes.length);
      // Give remaining bags to the first feed types
      const remainder = index <(quantity % selectedFeedTypes.length) ? 1 : 0;
      const actualQuantity = baseQuantityPerType + remainder;
      const totalPrice = unitPrice * actualQuantity;

      return {
        feedType,
        quantity: actualQuantity,
        unitPrice,
        totalPrice
      };
    });

    // Calculate total cost
    const totalCost = feedDetails.reduce((sum, feed) => sum + feed.totalPrice, 0);

    // Set payment due date (60 days from now)
    const paymentDueDate = new Date();
    paymentDueDate.setDate(paymentDueDate.getDate() + 60);

    // Create new feeds request
    const feedsRequest = new FeedsRequest({
      farmer: currentUser._id,
      farmerName: farmerName.trim(),
      farmerPhone: farmerPhone.trim(),
      farmerNIN: farmerNIN.trim(),
      farmerType,
      currentChicks: chicksCount,
      farmLocation: farmLocation.trim(),
      feedTypes: selectedFeedTypes,
      feedQuantity: quantity,
      urgency,
      specialRequirements: specialRequirements ? specialRequirements.trim() : '',
      feedDetails,
      totalCost,
      paymentDueDate,
      deliveryAddress: farmLocation.trim(),
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Save the request
    await feedsRequest.save();

    // Success message with request details
    const feedTypeNames = selectedFeedTypes.map(type => {
      const names = {
        starter: 'Starter Feed',
        grower: 'Grower Feed',
        layer: 'Layer Feed',
        broiler: 'Broiler Feed'
      };
      return names[type] || type;
    }).join(', ');

    const urgencyText = {
      normal: '7-10 days',
      urgent: '3-5 days',
      emergency: '1-2 days'
    }[urgency] || urgency;

    // Return JSON response for AJAX requests
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.json({
        success: true,
        message: `Your feeds request has been submitted successfully! Feed Types: ${feedTypeNames}, Quantity: ${quantity} bag(s), Total Cost: UGX ${totalCost.toLocaleString()}, Expected Delivery: ${urgencyText}`,
        requestId: feedsRequest.requestId,
        data: {
          requestId: feedsRequest.requestId,
          feedTypes: feedTypeNames,
          quantity: quantity,
          totalCost: totalCost,
          urgency: urgencyText,
          paymentDue: paymentDueDate.toLocaleDateString()
        }
      });
    }
    
    // Traditional form submission with flash message
    req.flash('success_msg', 
      `Your feeds request has been submitted successfully! Request ID: ${feedsRequest.requestId}`
    );
    
    // Log the request for admin tracking
    console.log(`New feeds request submitted:`, {
      requestId: feedsRequest.requestId,
      farmer: farmerName,
      email: currentUser.email,
      feedTypes: selectedFeedTypes,
      quantity: quantity,
      totalCost: totalCost,
      urgency: urgency
    });

    // Redirect to success page or dashboard
    res.redirect('/farmerDashBoard');

  } catch (error) {
    console.error('Error processing feeds request:', error);
    
    // Return JSON error for AJAX requests
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      let errorMessage = 'An unexpected error occurred while processing your request. Please try again.';
      
      if (error.code === 11000) {
        if (error.keyPattern?.requestId) {
          errorMessage = 'Request ID generation failed. Please try again.';
        } else {
          errorMessage = 'A request with similar details already exists.';
        }
      } else if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        errorMessage = `Validation Error: ${errors.join(', ')}`;
      } else if (error.name === 'CastError') {
        errorMessage = 'Invalid data format provided.';
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
    
    // Handle specific errors
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern?.requestId) {
        req.flash('error_msg', 'Request ID generation failed. Please try again.');
      } else {
        req.flash('error_msg', 'A request with similar details already exists.');
      }
    } else if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      req.flash('error_msg', `Validation Error: ${errors.join(', ')}`);
    } else if (error.name === 'CastError') {
      req.flash('error_msg', 'Invalid data format provided.');
    } else {
      req.flash('error_msg', 'An unexpected error occurred while processing your request. Please try again or contact support.');
    }
    
    res.redirect('/feedsReq');
  }
});

// GET route - view specific feeds request
router.get('/feedsReq/:requestId', ensureAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const feedsRequest = await FeedsRequest.findOne({ 
      requestId: requestId,
      farmer: req.user._id
    }).populate('farmer', 'name email phone');

    if (!feedsRequest) {
      req.flash('error_msg', 'Feeds request not found or access denied');
      return res.redirect('/farmerDashBoard');
    }

    res.render('feeds-details', { feedsRequest });

  } catch (error) {
    console.error('Error fetching feeds request:', error);
    req.flash('error_msg', 'Error loading feeds request details');
    res.redirect('/farmerDashBoard');
  }
});

// GET route - list user's feeds requests
router.get('/my-feeds-requests', ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedsRequests = await FeedsRequest.find({ 
      farmer: req.user._id 
    })
    .sort({ requestDate: -1 })
    .skip(skip)
    .limit(limit)
    .populate('farmer', 'name email phone');

    const totalRequests = await FeedsRequest.countDocuments({ 
      farmer: req.user._id 
    });

    const totalPages = Math.ceil(totalRequests / limit);

    res.render('my-feeds-requests', { 
      feedsRequests,
      currentPage: page,
      totalPages,
      totalRequests
    });

  } catch (error) {
    console.error('Error fetching user feeds requests:', error);
    req.flash('error_msg', 'Error loading your feeds requests');
    res.redirect('/farmerDashBoard');
  }
});

// POST route - cancel feeds request
router.post('/feedsReq/:requestId/cancel', ensureAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { cancelReason } = req.body;
    
    const feedsRequest = await FeedsRequest.findOne({
      requestId: requestId,
      farmer: req.user._id,
      status: 'pending'
    });

    if (!feedsRequest) {
      req.flash('error_msg', 'Request not found or cannot be cancelled');
      return res.redirect('/my-feeds-requests');
    }

    feedsRequest.status = 'cancelled';
    feedsRequest.rejectionReason = cancelReason || 'Cancelled by farmer';
    await feedsRequest.save();

    req.flash('success_msg', `Feeds request ${requestId} has been cancelled successfully`);
    res.redirect('/my-feeds-requests');

  } catch (error) {
    console.error('Error cancelling feeds request:', error);
    req.flash('error_msg', 'Error cancelling feeds request');
    res.redirect('/my-feeds-requests');
  }
});

module.exports = router;