// graphql/resolvers.js
const Esop = require("../models/Esop");
const Goal = require("../models/Goal");
const { generateFinancialPlan } = require("../services/aiService");

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      // user object is attached in context if logged in
      return user || null;
    },
    getEsops: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return Esop.find({ userId: user._id });
    },
    getGoals: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      return Goal.find({ userId: user._id });
    },
  },

  Mutation: {
    addGoal: async (_, args, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const newGoal = new Goal({
        userId: user._id,
        monthlyIncome: args.monthlyIncome,
        retirementGoal: args.retirementGoal,
        esopExercise: args.esopExercise,
        investmentHorizon: args.investmentHorizon,
        phoneNumber: args.phoneNumber,
      });
      return newGoal.save();
    },

    generatePlan: async (_, __, { user }) => {
      if (!user) throw new Error("Not authenticated");
      const userGoals = await Goal.findOne({ userId: user._id }).sort({ createdAt: -1 });
      const esopData = await Esop.find({ userId: user._id });

      if (!userGoals) {
        return "No goals found for this user.";
      }

      const plan = await generateFinancialPlan(userGoals, esopData);
      return plan;
    },
  },
};

module.exports = resolvers;
