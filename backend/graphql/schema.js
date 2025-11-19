// graphql/schema.js
const { gql } = require("graphql-tag");

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    authProvider: String!
  }

  type Esop {
    id: ID!
    userId: ID!
    grantDate: String
    exercisePrice: Float
    vestingSchedule: String
    expirationDate: String
    totalGrants: Int
    vested: Int
    unvested: Int
    exercised: Int
  }

  type Goal {
    id: ID!
    userId: ID!
    monthlyIncome: Float
    retirementGoal: Float
    esopExercise: Int
    investmentHorizon: Int
    phoneNumber: String
  }

  type Query {
    me: User
    getEsops: [Esop]
    getGoals: [Goal]
  }

  type Mutation {
    addGoal(monthlyIncome: Float, retirementGoal: Float, esopExercise: Int, investmentHorizon: Int, phoneNumber: String): Goal
    generatePlan: String
  }
`;

module.exports = typeDefs;
