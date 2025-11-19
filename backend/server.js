// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const morgan = require("morgan");
const { securityHeaders, generalLimiter } = require('./middleware/security');
const { sanitizeInput } = require('./middleware/auth');
const connectDB = require("./config/db");
const routes = require("./routes");
const reportRoutes = require("./routes/reportRoutes");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");
const User = require("./models/User");

// 1) Connect Database
connectDB();

// 2) Initialize App
const app = express();

// Trust the first proxy (Render/Vercel, etc.) so secure cookies and req.secure
// are handled correctly when the app is behind an HTTPS proxy.
app.set('trust proxy', 1);

// 3) Security Middlewares
app.use(securityHeaders);
app.use(generalLimiter);

// 4) Basic Middlewares
// Configure CORS with environment variables for production
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// 5) Session config
// Ensure SESSION_SECRET is set in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('WARNING: SESSION_SECRET is not set in production environment!');
  console.error('This is a security risk. Please set SESSION_SECRET in your environment.');
}

// Configure session with secure settings
app.use(
  session({
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev_session_secret'),
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGODB_URI,
      // Add extra options for production
      ...(process.env.NODE_ENV === 'production' ? {
        touchAfter: 24 * 3600, // Reduce db writes - update only once per 24h
        ttl: 14 * 24 * 60 * 60 // 14 days session lifetime
      } : {})
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      // Use SameSite=None for production so cookies are sent from Vercel frontend to Render backend
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// 5) Passport config
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// Populate req.user from session with enhanced logging
app.use(async (req, res, next) => {
  // If passport sets req.session.passport.user = userId
  if (req.isAuthenticated() && req.session.passport && req.session.passport.user) {
    try {
      const user = await User.findById(req.session.passport.user);
      req.user = user;
      
      // Enhanced debug logging for specific routes
      if (req.path.includes('/csv/')) {
        console.log(`=== Session Debug [${req.method} ${req.path}] ===`);
        console.log('Session ID:', req.session.id);
        console.log('User authenticated:', !!req.user);
        console.log('User ID:', req.user?._id);
        console.log('User email:', req.user?.email);
        console.log('=====================================');
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  } else {
    // Log unauthenticated requests to sensitive endpoints
    if (req.path.includes('/csv/')) {
      console.log(`!!! Unauthenticated Request [${req.method} ${req.path}] !!!`);
      console.log('Session exists:', !!req.session);
      console.log('Session ID:', req.session?.id);
      console.log('isAuthenticated():', req.isAuthenticated?.());
      console.log('=====================================');
    }
  }
  next();
});

// Add a session verification middleware to help debug
app.use((req, res, next) => {
  // Add timestamp to headers for cache busting verification
  res.setHeader('X-Response-Time', new Date().toISOString());
  
  // Set cache control headers for API responses
  if (req.path.includes('/api/') || req.path.includes('/csv/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

// 6) Setup ApolloServer for GraphQL
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Pass the authenticated user into GraphQL context
        return { user: req.user };
      },
    })
  );
}

startApolloServer().then(() => {
  // 7) Use Routes
  app.use("/", routes);
  app.use("/api/reports", reportRoutes);

  // 8) Global Error Handler (must be last middleware)
  const errorHandler = require('./middleware/errorHandler');
  app.use(errorHandler);

  // 9) Listen
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
