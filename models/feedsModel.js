const mongoose = require("mongoose");

const feedsRequestSchema = new mongoose.Schema({
  // Farmer Information
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  farmerName: {
    type: String,
    required: true,
    trim: true,
  },

  farmerPhone: {
    type: String,
    required: true,
    trim: true,
  },

  farmerNIN: {
    type: String,
    required: true,
    trim: true,
  },

  farmerType: {
    type: String,
    required: true,
    enum: ["starter", "returning"],
  },

  currentChicks: {
    type: Number,
    required: true,
    min: 0,
  },

  farmLocation: {
    type: String,
    required: true,
    trim: true,
  },

  // Feed Requirements
  feedTypes: [{
    type: String,
    required: true,
    enum: ["starter", "grower", "layer", "broiler"],
  }],

  feedQuantity: {
    type: Number,
    required: true,
    min: 1,
    max: 2, // Maximum 2 bags per farmer
  },

  urgency: {
    type: String,
    required: true,
    enum: ["normal", "urgent", "emergency"],
    default: "normal",
  },

  specialRequirements: {
    type: String,
    trim: true,
    default: "",
  },

  // Cost and Payment
  totalCost: {
    type: Number,
    required: true,
    min: 0,
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid", "overdue"],
    default: "pending",
  },

  paymentDueDate: {
    type: Date,
    required: true,
  },

  // Request Status
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "processing", "ready", "dispatched", "delivered", "completed"],
    default: "pending",
  },

  // Approval Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  approvedAt: {
    type: Date,
    default: null,
  },

  rejectionReason: {
    type: String,
    trim: true,
    default: null,
  },

  // Delivery Information
  deliveryDate: {
    type: Date,
    default: null,
  },

  deliveryAddress: {
    type: String,
    trim: true,
    default: null,
  },

  deliveryNotes: {
    type: String,
    trim: true,
    default: "",
  },

  // Tracking
  requestDate: {
    type: Date,
    default: Date.now,
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  },

  // Feed Details for tracking
  feedDetails: [{
    feedType: {
      type: String,
      required: true,
      enum: ["starter", "grower", "layer", "broiler"],
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  }],

  // Quality Control
  qualityCheck: {
    checked: {
      type: Boolean,
      default: false,
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    checkedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },

  // Farmer Feedback
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },

  // System Fields
  requestId: {
    type: String,
    unique: true,
    required: false, // Changed from true to false
    // The pre-save middleware will handle the generation
  },

  priority: {
    type: Number,
    default: 1, // 1 = normal, 2 = high, 3 = urgent
  },

  notes: [{
    note: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ["info", "warning", "error", "success"],
      default: "info",
    },
  }],

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
feedsRequestSchema.index({ farmer: 1, requestDate: -1 });
feedsRequestSchema.index({ status: 1, requestDate: -1 });
feedsRequestSchema.index({ paymentDueDate: 1, paymentStatus: 1 });
feedsRequestSchema.index({ urgency: 1, status: 1 });

// Virtual for days until payment due
feedsRequestSchema.virtual('daysUntilPaymentDue').get(function() {
  if (!this.paymentDueDate) return null;
  const today = new Date();
  const dueDate = new Date(this.paymentDueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for request age in days
feedsRequestSchema.virtual('requestAge').get(function() {
  const today = new Date();
  const requestDate = new Date(this.requestDate);
  const diffTime = today - requestDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for total feed bags
feedsRequestSchema.virtual('totalBags').get(function() {
  return this.feedDetails.reduce((total, feed) => total + feed.quantity, 0);
});

// Pre-save middleware to generate request ID
feedsRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestId) { // Added check !this.requestId
    // Generate unique request ID
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Count requests today to generate sequence number
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const todayCount = await this.constructor.countDocuments({
      requestDate: { $gte: startOfDay, $lt: endOfDay }
    });

    const sequence = String(todayCount + 1).padStart(3, '0');
    this.requestId = `FD${year}${month}${day}${sequence}`;

    // Set payment due date (60 days from request)
    if (!this.paymentDueDate) {
      const dueDate = new Date(this.requestDate);
      dueDate.setDate(dueDate.getDate() + 60);
      this.paymentDueDate = dueDate;
    }

    // Set priority based on urgency
    switch (this.urgency) {
      case 'emergency':
        this.priority = 3;
        break;
      case 'urgent':
        this.priority = 2;
        break;
      default:
        this.priority = 1;
    }
  }

  // Update lastUpdated timestamp
  this.lastUpdated = new Date();

  next();
});

// Pre-save middleware to calculate feed details if not provided
feedsRequestSchema.pre('save', function(next) {
  if (this.isNew && (!this.feedDetails || this.feedDetails.length === 0)) {
    const feedPrices = {
      starter: 45000,
      grower: 42000,
      layer: 40000,
      broiler: 43000
    };

    const parsedFeedTypes = this.feedTypes;
    const quantity = this.feedQuantity;

    this.feedDetails = parsedFeedTypes.map((feedType, index) => {
        const unitPrice = feedPrices[feedType] || 0;
        const baseQuantityPerType = Math.floor(quantity / parsedFeedTypes.length);
        const remainder = index < (quantity % parsedFeedTypes.length) ? 1 : 0;
        const actualQuantity = baseQuantityPerType + remainder;
        const totalPrice = unitPrice * actualQuantity;

        return {
          feedType,
          quantity: actualQuantity,
          unitPrice,
          totalPrice
        };
    });

    // Recalculate total cost based on feed details
    this.totalCost = this.feedDetails.reduce((total, feed) => total + feed.totalPrice, 0);
  }

  next();
});

// Static method to get feed statistics
feedsRequestSchema.statics.getFeedStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        pendingRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        approvedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        completedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $in: ['$status', ['completed', 'delivered']] }, '$totalCost', 0] }
        },
        totalBags: { $sum: '$feedQuantity' },
        averageRequestValue: { $avg: '$totalCost' }
      }
    }
  ]);

  return stats[0] || {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    totalBags: 0,
    averageRequestValue: 0
  };
};

// Static method to get overdue payments
feedsRequestSchema.statics.getOverduePayments = async function() {
  const today = new Date();
  return await this.find({
    paymentDueDate: { $lt: today },
    paymentStatus: { $in: ['pending', 'partial'] },
    status: { $in: ['delivered', 'completed'] }
  }).populate('farmer', 'name phone email').sort({ paymentDueDate: 1 });
};

// Static method to get urgent requests
feedsRequestSchema.statics.getUrgentRequests = async function() {
  return await this.find({
    urgency: { $in: ['urgent', 'emergency'] },
    status: { $in: ['pending', 'approved', 'processing'] }
  }).populate('farmer', 'name phone email').sort({ priority: -1, requestDate: 1 });
};

// Instance method to add note
feedsRequestSchema.methods.addNote = function(note, addedBy, type = 'info') {
  this.notes.push({
    note,
    addedBy,
    type,
    addedAt: new Date()
  });
  return this.save();
};

// Instance method to approve request
feedsRequestSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.rejectionReason = null;
  return this.save();
};

// Instance method to reject request
feedsRequestSchema.methods.reject = function(rejectionReason) {
  this.status = 'rejected';
  this.rejectionReason = rejectionReason;
  this.approvedBy = null;
  this.approvedAt = null;
  return this.save();
};

// Instance method to mark as delivered
feedsRequestSchema.methods.markDelivered = function(deliveryDate, deliveryNotes = '') {
  this.status = 'delivered';
  this.deliveryDate = deliveryDate || new Date();
  this.deliveryNotes = deliveryNotes;
  return this.save();
};

// Instance method to update payment status
feedsRequestSchema.methods.updatePaymentStatus = function(status) {
  this.paymentStatus = status;
  if (status === 'paid') {
    this.status = 'completed';
  }
  return this.save();
};

module.exports = mongoose.model("FeedsRequest", feedsRequestSchema);