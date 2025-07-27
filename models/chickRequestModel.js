const mongoose = require("mongoose");
const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  farmerType: {
    type: String,
    required: true,
    enum: ["starter", "returning"],
  },
  chickType: {
    type: String,
    required: true,
  },
  numChicks: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
  },
  totalCost: {
    type: Number,
  },
  requestDate: {
    type: Date,
    required: true,
  },
  comments: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "approved", "dispatched", "canceled"],
    default: "Pending",
  },
  approvedDate: Date,
});
module.exports = mongoose.model("chickRequest", requestSchema);
