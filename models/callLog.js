const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema({
    salesRep: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    farmerName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    callDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["attempted", "success", "no_answer"],
        default: "attempted",
    },
    notes: {
        type: String,
        default: "",
    },
});

module.exports = mongoose.model("CallLog", callLogSchema);