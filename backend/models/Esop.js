// models/Esop.js
const mongoose = require("mongoose");

const EsopSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },

  // Identification
  ticker: String,
  company: String,

  // Dates
  grantDate: Date,
  vestingStartDate: Date,
  vestingEndDate: Date,
  vestingSchedule: String,
  expirationDate: Date,
  exerciseDate: Date,

  // Quantities
  totalGrants: Number,
  quantity: Number,
  vested: Number,
  unvested: Number,
  exercised: Number,

  // Pricing
  strikePrice: Number,
  exercisePrice: Number,
  avgStockPrice: Number,
  currentPrice: Number,
  fmv: Number,
  price: Number, // legacy fallback
  salePrice: Number,
  saleDate: Date,

  // Classification & status
  type: { type: String, default: "ISO" },
  status: { type: String, default: "Not exercised" },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model("Esop", EsopSchema);
