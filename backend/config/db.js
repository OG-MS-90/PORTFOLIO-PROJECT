// config/db.js
const mongoose = require("mongoose");
require("dotenv").config();

/**
 * Connect to MongoDB with retry mechanism and graceful error handling
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  let retryCount = 0;
  let connected = false;

  // Validate MongoDB URI
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables");
    if (process.env.NODE_ENV === "production") {
      console.error("Cannot start application without database connection");
      process.exit(1);
    } else {
      console.warn("Running in development mode without a database connection");
      return;
    }
  }

  // Configure mongoose
  mongoose.set('strictQuery', true); // Prevent deprecation warning

  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Keep trying for 5 seconds
    heartbeatFrequencyMS: 30000, // Check connection every 30 seconds (default)
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  };

  // Retry connection until successful or max retries reached
  while (!connected && retryCount < MAX_RETRIES) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, options);
      connected = true;
      console.log("MongoDB connected successfully!");
    } catch (err) {
      retryCount++;
      console.error(`MongoDB connection attempt ${retryCount} failed:`, err.message);
      
      // If we've reached max retries in production, exit the application
      if (retryCount >= MAX_RETRIES && process.env.NODE_ENV === "production") {
        console.error("Failed to connect to MongoDB after multiple attempts. Exiting application.");
        process.exit(1);
      }
      
      // Wait before trying again (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(`Waiting ${waitTime}ms before trying again...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Setup event listeners for MongoDB connection
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
  });

  // Handle application termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error during MongoDB disconnection:', err);
      process.exit(1);
    }
  });
};

module.exports = connectDB;
