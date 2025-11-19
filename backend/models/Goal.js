// models/Goal.js
const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  monthlyIncome: Number,
  retirementGoal: Number,
  esopExercise: Number,
  investmentHorizon: Number,
  phoneNumber: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Goal", GoalSchema);
