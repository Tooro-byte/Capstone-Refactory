const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  nin: {
    type: String,
    required: function () {
      return this.role === "farmer";
    },
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["farmer", "SalesRep", "brooderManager"],
  },
  recommenderName: {
    type: String,
    required: function () {
      return this.role === "farmer";
    },
    default: null,
  },
  recommenderNIN: {
    type: String,
    required: function () {
      return this.role === "farmer";
    },
    default: null,
  },
});

// Create a unique index on 'nin' with a partial filter.
// This ensures uniqueness is only enforced for documents
// where the 'nin' field exists and is not an empty string.
userSchema.index(
  { nin: 1 },
  {
    unique: true,
    partialFilterExpression: { nin: { $exists: true, $ne: null, $ne: "" } },
  }
);

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
});

module.exports = mongoose.model("User", userSchema);
