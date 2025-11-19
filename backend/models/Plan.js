const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous plans initially
  },
  wealthManagerId: {
    type: String,
    required: true,
    unique: true
  },
  riskProfile: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  financialData: {
    monthlyIncome: Number,
    monthlyExpenses: Number,
    savingsGoal: Number,
    currentSavings: Number,
    monthlyContribution: Number
  },
  esopData: {
    vestingYears: Number,
    quantity: Number,
    currentPrice: Number,
    exercisePrice: Number
  },
  projections: {
    netWorth10Y: Number,
    successProbability: Number
  },
  allocation: [{
    name: String,
    value: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Plan', PlanSchema);
