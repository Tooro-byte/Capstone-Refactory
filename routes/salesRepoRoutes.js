const express = require('express');
const router = express.Router();
const {
  ensureAuthenticated,
  ensureSalesRep,
} = require("../middleware/authMiddleware");

//-Import your Mongoose models
const chickRequest = require('../models/chickRequestModel');
const User = require('../models/User');
const addNewStock = require('../models/addChicksModel'); // Correct model name
const CallLog = require('../models/callLog');

//-1. GET Route to render the Sales Representative Dashboard
router.get('/sales-rep-board', 
    ensureAuthenticated, 
    ensureSalesRep, 
    async (req, res) => {
    try {
        //-Fetch all necessary data from the database
        const [requests, customers, totalStockResult, callLogs] = await Promise.all([
            chickRequest.find().populate('user').lean(),
            User.find({ role: { $ne: 'SalesRep' } }).lean(), // Assuming your sales rep role is 'SalesRep'
            addNewStock.aggregate([{ $group: { _id: null, total: { $sum: '$number' } } }]),
            CallLog.find({ salesRep: req.session.user._id }).sort({ callDate: -1 }).limit(10).lean()
        ]);
        
        //-Calculate the dashboard statistics from the fetched data
        const totalRequests = requests.length;
        const pendingRequests = requests.filter(r => r.status === 'Pending').length;
        const approvedToday = requests.filter(r => 
            r.status === 'approved' && r.approvedDate && 
            new Date(r.approvedDate).toDateString() === new Date().toDateString()
        ).length;
        const dispatchedRequests = requests.filter(r => r.status === 'dispatched').length;
        
        //-Revenue calculation
        const totalRevenue = requests
            .filter(r => r.status === 'approved' || r.status === 'dispatched')
            .reduce((sum, r) => sum + (r.totalCost || 0), 0);
        
        //-Stock calculation
        const totalStock = totalStockResult.length > 0 ? totalStockResult[0].total : 0;
        
        //-Customer stats calculation
        const totalCustomers = customers.length;
        const starterFarmers = customers.filter(c => c.farmerType === 'starter').length;
        const returningFarmers = customers.filter(c => c.farmerType === 'returning').length;
        
        //-Render the Pug template with all the data
        res.render('sales-rep-dash-board', {
            //-All the variables your Pug file expects
            user: req.session.user, //-Use req.session.user as per your middleware
            requests,
            customers,
            callLogs,
            pendingCount: pendingRequests, //-For the header notification
            totalRequests,
            pendingRequests,
            approvedToday,
            dispatchedRequests,
            totalRevenue,
            totalStock,
            avgResponseTime: 'N/A', //-Placeholder
            totalCustomers,
            starterFarmers,
            returningFarmers
        });
    } catch (err) {
        console.error("Error fetching dashboard data:", err);
        res.status(500).send('Server Error');
    }
});

//-2. PUT Route to update a request's status
router.put('/api/requests/:id/status',
    ensureAuthenticated,
    ensureSalesRep,
     async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        //-Ensure the new status is valid
        if (!['approved', 'dispatched', 'canceled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        const updatedRequest = await chickRequest.findByIdAndUpdate(
            id, 
            { 
                status: status,
                approvedDate: status === 'approved' ? new Date() : undefined
            }, 
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        res.json({ success: true, request: updatedRequest });
    } catch (err) {
        console.error("Error updating request status:", err);
        res.status(500).json({ success: false, message: 'Server Error.' });
    }
});

// 3. POST Route to log a new call
router.post('/api/log-call', 
    ensureAuthenticated,
    ensureSalesRep, 
    async (req, res) => {
    try {
        const { phone, farmerName, callDate, status, notes } = req.body;

        const newCallLog = new CallLog({
            salesRep: req.session.user._id, // Use req.session.user._id to associate the call
            farmerName,
            phone,
            callDate,
            status,
            notes
        });

        await newCallLog.save();

        res.status(201).json({ success: true, callLog: newCallLog });
    } catch (err) {
        console.error("Error logging call:", err);
        res.status(500).json({ success: false, message: 'Server Error.' });
    }
});

module.exports = router;