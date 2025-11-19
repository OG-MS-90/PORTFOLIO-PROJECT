// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: { 
    type: String, 
    required: true 
  },
  authProvider: { 
    type: String, 
    enum: ["google", "github", "local"], 
    required: true 
  },
  // Fields for local auth
  hash: {
    type: String,
    select: false // Don't include in query results by default
  },
  salt: {
    type: String,
    select: false
  },
  // Fields for MFA
  mfaSecret: {
    type: String,
    select: false
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  // Additional security info
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  }
});

module.exports = mongoose.model("User", UserSchema);
